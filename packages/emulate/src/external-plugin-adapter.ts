import type { ServicePlugin, Store, AuthFallback, WebhookDispatcher } from "@emulators/core";
import { isAbsolute, resolve } from "path";
import { readPluginManifest, validatePluginManifest, type PluginManifest } from "./plugin-manifest.js";
import type { PluginModule } from "./plugin-types.js";

export interface ExternalPluginModule {
  plugin?: ServicePlugin;
  default?: ServicePlugin;
  seedFromConfig?(store: Store, baseUrl: string, config: unknown, webhooks?: WebhookDispatcher): void;
  label?: string;
  endpoints?: string;
  manifest?: PluginManifest;
  contract?: unknown;
  defaultFallback?(svcSeedConfig?: Record<string, unknown>): AuthFallback;
  initConfig?: Record<string, unknown>;
}

export async function loadExternalPluginModule(specifier: string): Promise<PluginModule> {
  const modulePath = specifier.startsWith(".") || isAbsolute(specifier) ? resolve(specifier) : specifier;

  const mod = (await import(modulePath)) as ExternalPluginModule;
  const plugin = mod.plugin ?? mod.default;
  if (!plugin || typeof plugin.register !== "function" || typeof plugin.name !== "string") {
    throw new Error(`Plugin "${specifier}" must export a ServicePlugin (as "plugin" or default export)`);
  }

  const name = plugin.name;
  const manifest = validatePluginManifest(readPluginManifest(mod), name);
  return {
    name,
    label: manifest.label,
    endpoints: manifest.endpoints,
    manifest,
    async load() {
      return {
        plugin,
        seedFromConfig: mod.seedFromConfig,
      };
    },
    defaultFallback: mod.defaultFallback ?? (() => ({ login: "admin", id: 1, scopes: [] })),
    initConfig: manifest.initConfig,
  };
}

export async function loadExternalPlugin(specifier: string): Promise<{ name: string; entry: PluginModule }> {
  const pluginModule = await loadExternalPluginModule(specifier);
  return { name: pluginModule.name, entry: pluginModule };
}
