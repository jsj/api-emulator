import type { ServicePlugin, Store, AppKeyResolver, AuthFallback, WebhookDispatcher } from "@api-emulator/core";
import type { PluginManifest } from "./plugin-manifest.js";

export interface LoadedPlugin {
  plugin: ServicePlugin;
  grpc?: GrpcRegistrationFactory;
  materializeSeedConfig?(config: Record<string, unknown>): Promise<Record<string, unknown>>;
  seedFromConfig?(store: Store, baseUrl: string, config: unknown, webhooks?: WebhookDispatcher): void;
  createAppKeyResolver?(store: Store): AppKeyResolver;
}

export async function materializeSeedConfig(
  plugin: LoadedPlugin,
  config: Record<string, unknown> | undefined,
): Promise<Record<string, unknown> | undefined> {
  return config && plugin.materializeSeedConfig ? plugin.materializeSeedConfig(config) : config;
}

export interface GrpcPluginContext {
  store: Store;
  baseUrl: string;
}

export interface GrpcServiceRegistration {
  protoPath: string;
  packageName?: string;
  serviceName: string;
  implementation: Record<string, (...args: unknown[]) => unknown>;
  loaderOptions?: Record<string, unknown>;
}

export type GrpcRegistrationFactory = (
  context: GrpcPluginContext,
) => GrpcServiceRegistration | GrpcServiceRegistration[] | Promise<GrpcServiceRegistration | GrpcServiceRegistration[]>;

export interface PluginModule {
  name: string;
  label: string;
  endpoints: string;
  fidelity: string;
  fidelityTier: string;
  manifest?: PluginManifest;
  load(): Promise<LoadedPlugin>;
  defaultFallback(svcSeedConfig?: Record<string, unknown>): AuthFallback;
  initConfig: Record<string, unknown>;
}

export type LoadedService = LoadedPlugin;
export type ServiceEntry = PluginModule;
