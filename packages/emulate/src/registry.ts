import { loadExternalPluginModule } from "./external-plugin-adapter.js";
import {
  DEFAULT_PLUGIN_REGISTRY,
  DEFAULT_PLUGIN_NAMES,
  SERVICE_NAMES,
  type ServiceName,
} from "./default-plugin-catalog.js";
import type { PluginModule } from "./plugin-types.js";
export { DEFAULT_PLUGIN_REGISTRY, DEFAULT_PLUGIN_NAMES, SERVICE_NAMES, type ServiceName };
export type { LoadedPlugin, LoadedService, PluginModule, ServiceEntry } from "./plugin-types.js";

export const DEFAULT_TOKENS = {
  tokens: {
    test_token_admin: {
      login: "admin",
      scopes: ["repo", "user", "admin:org", "admin:repo_hook"],
    },
    test_token_user1: {
      login: "octocat",
      scopes: ["repo", "user"],
    },
  },
};

export async function resolvePluginModules(pluginSpecifiers: string[] = []): Promise<Record<string, PluginModule>> {
  const results = await Promise.all(pluginSpecifiers.map(loadExternalPluginModule));

  const externalEntries: Record<string, PluginModule> = {};
  for (const pluginModule of results) {
    if (pluginModule.name in DEFAULT_PLUGIN_REGISTRY) {
      throw new Error(`Plugin "${pluginModule.name}" conflicts with default plugin "${pluginModule.name}"`);
    }
    if (pluginModule.name in externalEntries) {
      throw new Error(`Duplicate plugin name "${pluginModule.name}"`);
    }
    externalEntries[pluginModule.name] = pluginModule;
  }

  return { ...DEFAULT_PLUGIN_REGISTRY, ...externalEntries };
}

export const resolveServiceEntries = resolvePluginModules;

export function getDefaultPluginNames(): string[] {
  return [...DEFAULT_PLUGIN_NAMES];
}
