import type { ServicePlugin, Store, AuthFallback, WebhookDispatcher } from "@emulators/core";
import { isAbsolute, resolve } from "path";
import type { PluginModule } from "./plugin-types.js";

export interface ExternalPluginModule {
  plugin?: ServicePlugin;
  default?: ServicePlugin;
  seedFromConfig?(store: Store, baseUrl: string, config: unknown, webhooks?: WebhookDispatcher): void;
  label?: string;
  endpoints?: string;
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
  return {
    name,
    label: mod.label ?? `${name} (external plugin)`,
    endpoints: mod.endpoints ?? "",
    async load() {
      return {
        plugin,
        seedFromConfig: mod.seedFromConfig,
      };
    },
    defaultFallback: mod.defaultFallback ?? (() => ({ login: "admin", id: 1, scopes: [] })),
    initConfig: mod.initConfig ?? {},
  };
}

export async function loadExternalPlugin(specifier: string): Promise<{ name: string; entry: PluginModule }> {
  const pluginModule = await loadExternalPluginModule(specifier);
  return { name: pluginModule.name, entry: pluginModule };
}
