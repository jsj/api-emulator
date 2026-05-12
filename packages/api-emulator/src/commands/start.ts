import { resolvePluginModules, getDefaultPluginNames, type LoadedPlugin, type PluginModule } from "../registry.js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parse as parseYaml } from "yaml";
import pc from "picocolors";
import { ensurePortless, registerAliases, removeAliases, portlessBaseUrl, type PortlessAlias } from "../portless.js";
import { resolveBaseUrl } from "../base-url.js";
import { createAuthTokens, createServiceRuntime, type RunningService, type SeedConfig } from "../service-runtime.js";

declare const PKG_VERSION: string;
const pkg = { version: PKG_VERSION };

export interface StartOptions {
  port: number;
  service?: string;
  seed?: string;
  baseUrl?: string;
  portless?: boolean;
  plugin?: string;
}

interface LoadResult {
  config: SeedConfig;
  source: string;
}

function loadSeedConfig(seedPath?: string): LoadResult | null {
  if (seedPath) {
    const fullPath = resolve(seedPath);
    if (!existsSync(fullPath)) {
      console.error(`Seed file not found: ${fullPath}`);
      process.exit(1);
    }
    const content = readFileSync(fullPath, "utf-8");
    try {
      const config = fullPath.endsWith(".json") ? JSON.parse(content) : parseYaml(content);
      return { config, source: seedPath };
    } catch (err) {
      console.error(`Failed to parse ${seedPath}: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  }

  const autoFiles = [
    "api-emulator.config.yaml",
    "api-emulator.config.yml",
    "api-emulator.config.json",
    "emulate.config.yaml",
    "emulate.config.yml",
    "emulate.config.json",
    "service-emulator.config.yaml",
    "service-emulator.config.yml",
    "service-emulator.config.json",
  ];

  for (const file of autoFiles) {
    const fullPath = resolve(file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      try {
        const config = fullPath.endsWith(".json") ? JSON.parse(content) : parseYaml(content);
        return { config, source: file };
      } catch (err) {
        console.error(`Failed to parse ${file}: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
    }
  }

  return null;
}

function inferServicesFromConfig(config: SeedConfig, availableServices: string[]): string[] | null {
  const found = availableServices.filter((k) => k in config);
  return found.length > 0 ? [...found] : null;
}

export async function startCommand(options: StartOptions): Promise<void> {
  const { port: basePort } = options;

  if (options.portless && options.baseUrl) {
    console.error("--portless and --base-url are mutually exclusive.");
    process.exit(1);
  }

  const loaded = loadSeedConfig(options.seed);
  const seedConfig = loaded?.config ?? null;
  const configSource = loaded?.source ?? null;

  const pluginSpecifiers =
    options.plugin
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  let allPluginModules: Record<string, PluginModule>;
  try {
    allPluginModules = await resolvePluginModules(pluginSpecifiers, { includeInstalled: true });
  } catch (err) {
    console.error(`Failed to load plugins: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const defaultPlugins = getDefaultPluginNames();
  const externalServices = Object.keys(allPluginModules).filter((name) => !defaultPlugins.includes(name));

  let services: string[];
  if (options.service) {
    services = options.service.split(",").map((s) => s.trim());
  } else if (seedConfig) {
    services = inferServicesFromConfig(seedConfig, Object.keys(allPluginModules)) ?? [
      ...defaultPlugins,
      ...externalServices,
    ];
  } else {
    services = [...defaultPlugins, ...externalServices];
  }

  for (const svc of services) {
    if (!allPluginModules[svc]) {
      console.error(`Unknown service: ${svc}`);
      process.exit(1);
    }
  }

  const tokens = createAuthTokens(seedConfig);

  if (options.portless) {
    await ensurePortless();
  }

  interface PreparedService {
    svc: string;
    pluginModule: PluginModule;
    loadedPlugin: LoadedPlugin;
    svcSeedConfig: Record<string, unknown> | undefined;
    port: number;
    baseUrl: string;
  }

  const portlessAliases: PortlessAlias[] = [];
  const prepared: PreparedService[] = [];

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    const pluginModule = allPluginModules[svc];
    const loadedPlugin = await pluginModule.load();

    const svcSeedConfig = seedConfig?.[svc] as Record<string, unknown> | undefined;
    const port = (svcSeedConfig?.port as number | undefined) ?? basePort + i;

    if (options.portless) {
      portlessAliases.push({ name: `${svc}.api-emulator`, port });
    }

    const seedBaseUrl =
      typeof svcSeedConfig?.baseUrl === "string" && svcSeedConfig.baseUrl.length > 0
        ? svcSeedConfig.baseUrl
        : undefined;
    const effectiveBaseUrl = options.portless ? portlessBaseUrl(svc) : options.baseUrl;
    const baseUrl = resolveBaseUrl({ service: svc, port, baseUrl: effectiveBaseUrl, seedBaseUrl });

    prepared.push({ svc, pluginModule, loadedPlugin, svcSeedConfig, port, baseUrl });
  }

  if (portlessAliases.length > 0) {
    registerAliases(portlessAliases);
  }

  const serviceUrls: Array<{ name: string; url: string }> = [];
  const runningServices: RunningService[] = [];

  for (const { svc, pluginModule, loadedPlugin, svcSeedConfig, port, baseUrl } of prepared) {
    serviceUrls.push({ name: svc, url: baseUrl });

    const running = createServiceRuntime({
      service: svc,
      pluginModule,
      loadedPlugin,
      port,
      baseUrl,
      tokens,
      seedConfig: svcSeedConfig,
    });
    runningServices.push(running);
  }

  printBanner(serviceUrls, tokens, configSource);

  const shutdown = () => {
    console.log(`\n${pc.dim("Shutting down...")}`);
    if (portlessAliases.length > 0) {
      removeAliases(portlessAliases);
    }
    for (const running of runningServices) {
      void running.close();
    }
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

function printBanner(
  services: Array<{ name: string; url: string }>,
  tokens: Record<string, { login: string; id: number; scopes?: string[] }>,
  configSource: string | null,
): void {
  const lines: string[] = [];
  lines.push("");
  lines.push(`  ${pc.bold("api-emulator")} ${pc.dim(`v${pkg.version}`)}`);
  lines.push("");

  const maxNameLen = Math.max(...services.map((s) => s.name.length));
  for (const { name, url } of services) {
    lines.push(`  ${pc.cyan(name.padEnd(maxNameLen + 2))}${pc.bold(url)}`);
  }
  lines.push("");

  const tokenEntries = Object.entries(tokens);
  if (tokenEntries.length > 0) {
    lines.push(`  ${pc.dim("Tokens")}`);
    for (const [token, user] of tokenEntries) {
      lines.push(`  ${pc.dim(token)} ${pc.dim("->")} ${user.login}`);
    }
    lines.push("");
  }

  if (configSource) {
    lines.push(`  ${pc.dim("Config:")} ${configSource}`);
  } else {
    lines.push(
      `  ${pc.dim("Config:")} defaults ${pc.dim("(run")} npx -p api-emulator api init ${pc.dim("to customize)")}`,
    );
  }
  lines.push("");

  console.log(lines.join("\n"));
}
