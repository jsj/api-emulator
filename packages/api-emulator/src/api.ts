import { resolvePluginModules } from "./registry.js";
export type { ServiceName } from "./registry.js";
import type { ServiceName } from "./registry.js";
import type { FixtureSource, StoreFixture, StoreFixtureOptions, StoreSnapshot } from "@api-emulator/core";
import { resolveBaseUrl } from "./base-url.js";
import { createAuthTokens, createServiceRuntime, type SeedConfig } from "./service-runtime.js";
import { materializeSeedConfig } from "./plugin-types.js";

export type { SeedConfig };
export type { GrpcPluginContext, GrpcRegistrationFactory, GrpcServiceRegistration } from "./plugin-types.js";
export type {
  FixtureInteraction,
  FixtureSource,
  StoreFixture,
  StoreFixtureOptions,
  StoreSnapshot,
} from "@api-emulator/core";

export interface EmulatorOptions {
  service: ServiceName | (string & {});
  port?: number;
  seed?: SeedConfig;
  baseUrl?: string;
  plugins?: string[];
  grpcPort?: number;
  latencyMs?: number;
}

export interface Emulator {
  url: string;
  grpcUrl?: string;
  snapshot(): StoreSnapshot;
  restore(fixture: FixtureSource): void;
  exportFixture(options?: StoreFixtureOptions): StoreFixture;
  resetToFixture(fixture: FixtureSource): void;
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

  const configuredSeed = seedConfig?.[service] as Record<string, unknown> | undefined;
  const svcSeedConfig = await materializeSeedConfig(loadedPlugin, configuredSeed);
  const seedBaseUrl =
    typeof svcSeedConfig?.baseUrl === "string" && svcSeedConfig.baseUrl.length > 0 ? svcSeedConfig.baseUrl : undefined;
  const baseUrl = resolveBaseUrl({ service, port, baseUrl: options.baseUrl, seedBaseUrl });
  const running = await createServiceRuntime({
    service,
    pluginModule,
    loadedPlugin,
    port,
    baseUrl,
    tokens: createAuthTokens(seedConfig),
    seedConfig: svcSeedConfig,
    grpcPort: options.grpcPort ?? port + 10_000,
    latencyMs: options.latencyMs,
  });

  return {
    url: running.url,
    grpcUrl: running.grpcUrl,
    snapshot: running.snapshot,
    restore: running.restore,
    exportFixture: running.exportFixture,
    resetToFixture: running.resetToFixture,
    reset: running.reset,
    close: running.close,
  };
}
