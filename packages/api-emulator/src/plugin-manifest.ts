export interface PluginManifest {
  name?: string;
  label?: string;
  endpoints?: string;
  initConfig?: Record<string, unknown>;
  contract?: unknown;
}

export function readPluginManifest(mod: { manifest?: PluginManifest }): PluginManifest {
  return mod.manifest ?? {};
}

export function validatePluginManifest(
  manifest: PluginManifest,
  pluginName: string,
): Required<Pick<PluginManifest, "label" | "endpoints" | "initConfig">> &
  Omit<PluginManifest, "label" | "endpoints" | "initConfig"> {
  if (manifest.name && manifest.name !== pluginName) {
    throw new Error(`Plugin manifest name "${manifest.name}" does not match plugin name "${pluginName}"`);
  }

  return {
    ...manifest,
    label: manifest.label ?? `${pluginName} (external plugin)`,
    endpoints: manifest.endpoints ?? "",
    initConfig: manifest.initConfig ?? {},
  };
}
