import type { ServicePlugin, Store, AppKeyResolver, AuthFallback, WebhookDispatcher } from "@api-emulator/core";
import type { PluginManifest } from "./plugin-manifest.js";

export interface LoadedPlugin {
  plugin: ServicePlugin;
  seedFromConfig?(store: Store, baseUrl: string, config: unknown, webhooks?: WebhookDispatcher): void;
  createAppKeyResolver?(store: Store): AppKeyResolver;
}

export interface PluginModule {
  name: string;
  label: string;
  endpoints: string;
  manifest?: PluginManifest;
  load(): Promise<LoadedPlugin>;
  defaultFallback(svcSeedConfig?: Record<string, unknown>): AuthFallback;
  initConfig: Record<string, unknown>;
}

export type LoadedService = LoadedPlugin;
export type ServiceEntry = PluginModule;
