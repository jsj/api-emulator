import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { writeGeneratedFile } from "../generated-manifest.js";

export interface PluginCreateOptions {
  dir?: string;
  fidelity?: string;
  yes?: boolean;
}

function normalizePluginName(input: string): string {
  const name = input.trim().replace(/^@/, "");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("Plugin names must use lowercase letters, numbers, and hyphens");
  }
  return name;
}

function pluginEntry(name: string, fidelity: string): string {
  return `export const manifest = {
  name: "${name}",
  label: "${name} API emulator",
  endpoints: "GET /health",
  fidelity: {
    level: "${fidelity}",
    endpoints: ["GET /health"],
    seedableResources: [],
    smoke: "not-started",
  },
  initConfig: {
    ${JSON.stringify(name)}: {},
  },
};

export const plugin = {
  name: "${name}",
  register(app) {
    app.get("/health", (c) => c.json({ ok: true, service: "${name}" }));
  },
};
`;
}

function catalogContent(name: string, specifier: string, description: string): string {
  const catalogPath = "api-emulator.catalog.json";
  const catalog = existsSync(catalogPath)
    ? (JSON.parse(readFileSync(catalogPath, "utf-8")) as { plugins?: Record<string, unknown> })
    : {};
  catalog.plugins ??= {};
  catalog.plugins[name] = {
    kind: "file",
    specifier,
    description,
  };
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

export async function pluginCreateCommand(input: string, options: PluginCreateOptions = {}): Promise<void> {
  const name = normalizePluginName(input);
  const pluginDir = options.dir ?? `@${name}`;
  const entryPath = join(pluginDir, "api-emulator.mjs");
  const catalogSpecifier = `./${entryPath}`;

  writeGeneratedFile(entryPath, pluginEntry(name, options.fidelity ?? "stub"), {
    source: "api clone create",
    yes: options.yes,
  });
  writeGeneratedFile(
    "api-emulator.catalog.json",
    catalogContent(name, catalogSpecifier, `${name} API emulator plugin`),
    {
      source: "api clone create",
      yes: options.yes,
    },
  );

  console.log(`Created ${entryPath}`);
  console.log(`Recorded ${name} in api-emulator.catalog.json`);
  console.log(`Run 'npx -p api-emulator api validate-plugin ${name}' to check the clone.`);
}
