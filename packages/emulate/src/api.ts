import { resolvePluginModules } from "./registry.js";
export type { ServiceName } from "./registry.js";
import type { ServiceName } from "./registry.js";
import { resolveBaseUrl } from "./base-url.js";
import { createAuthTokens, createServiceRuntime, type SeedConfig } from "./service-runtime.js";

export type { SeedConfig };

export interface EmulatorOptions {
  service: ServiceName | (string & {});
  port?: number;
  seed?: SeedConfig;
  baseUrl?: string;
  plugins?: string[];
}

export interface Emulator {
  url: string;
  reset(): void;
  close(): Promise<void>;
}

export async function createEmulator(options: EmulatorOptions): Promise<Emulator> {
  const { service, port = 4000, seed: seedConfig, plugins = [] } = options;

  const registry = await resolvePluginModules(plugins);
  const pluginModule = registry[service];
  if (!pluginModule) {
    throw new Error(`Unknown service: ${service}`);
  }

  const loadedPlugin = await pluginModule.load();

  const svcSeedConfig = seedConfig?.[service] as Record<string, unknown> | undefined;
  const seedBaseUrl =
    typeof svcSeedConfig?.baseUrl === "string" && svcSeedConfig.baseUrl.length > 0 ? svcSeedConfig.baseUrl : undefined;
  const baseUrl = resolveBaseUrl({ service, port, baseUrl: options.baseUrl, seedBaseUrl });
  const running = createServiceRuntime({
    service,
    pluginModule,
    loadedPlugin,
    port,
    baseUrl,
    tokens: createAuthTokens(seedConfig),
    seedConfig: svcSeedConfig,
  });

  return {
    url: running.url,
    reset: running.reset,
    close: running.close,
  };
}
