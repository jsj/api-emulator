import type { ServicePlugin, Store, AppKeyResolver, AuthFallback, WebhookDispatcher } from "@emulators/core";

export interface LoadedPlugin {
  plugin: ServicePlugin;
  seedFromConfig?(store: Store, baseUrl: string, config: unknown, webhooks?: WebhookDispatcher): void;
  createAppKeyResolver?(store: Store): AppKeyResolver;
}

export interface PluginModule {
  name: string;
  label: string;
  endpoints: string;
  load(): Promise<LoadedPlugin>;
  defaultFallback(svcSeedConfig?: Record<string, unknown>): AuthFallback;
  initConfig: Record<string, unknown>;
}

export type LoadedService = LoadedPlugin;
export type ServiceEntry = PluginModule;
