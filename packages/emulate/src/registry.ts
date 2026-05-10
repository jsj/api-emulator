import { loadExternalPlugin } from "./external-plugin-adapter.js";
import {
  DEFAULT_PLUGIN_REGISTRY,
  DEFAULT_PLUGIN_NAMES,
  SERVICE_NAMES,
  type ServiceName,
} from "./default-plugin-catalog.js";
import type { ServiceEntry } from "./plugin-types.js";
export { DEFAULT_PLUGIN_REGISTRY, DEFAULT_PLUGIN_NAMES, SERVICE_NAMES, type ServiceName };
export type { LoadedService, ServiceEntry } from "./plugin-types.js";

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

export async function resolveServiceEntries(pluginSpecifiers: string[] = []): Promise<Record<string, ServiceEntry>> {
  const results = await Promise.all(pluginSpecifiers.map(loadExternalPlugin));

  const externalEntries: Record<string, ServiceEntry> = {};
  for (const { name, entry } of results) {
    if (name in DEFAULT_PLUGIN_REGISTRY) {
      throw new Error(`Plugin "${name}" conflicts with default plugin "${name}"`);
    }
    if (name in externalEntries) {
      throw new Error(`Duplicate plugin name "${name}"`);
    }
    externalEntries[name] = entry;
  }

  return { ...DEFAULT_PLUGIN_REGISTRY, ...externalEntries };
}

export function getDefaultPluginNames(): string[] {
  return [...DEFAULT_PLUGIN_NAMES];
}
