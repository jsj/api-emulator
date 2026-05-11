export interface PluginSource {
  name: string;
  packageName: string;
  specifier: string;
  description: string;
}

const PLUGIN_SOURCES: Record<string, PluginSource> = {
  cloudflare: {
    name: "cloudflare",
    packageName: "@api-emulator/cloudflare",
    specifier: "@api-emulator/cloudflare",
    description: "Workers-style bindings, D1, KV, R2, queues, durable objects, and service bindings",
  },
};

export function listPluginSources(): PluginSource[] {
  return Object.values(PLUGIN_SOURCES);
}

export function resolvePluginSource(name: string): PluginSource | null {
  return PLUGIN_SOURCES[name] ?? null;
}
