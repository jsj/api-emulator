import type { AuthFallback } from "@api-emulator/core";

export interface PluginManifest {
  name?: string;
  label?: string;
  endpoints?: string;
  initConfig?: Record<string, unknown>;
  contract?: unknown;
  compatibility?: {
    apiEmulator?: string;
  };
}

interface LegacyManifestFields {
  label?: string;
  endpoints?: string;
  initConfig?: Record<string, unknown>;
  contract?: unknown;
  defaultFallback?(svcSeedConfig?: Record<string, unknown>): AuthFallback;
}

export function readPluginManifest(mod: { manifest?: PluginManifest } & LegacyManifestFields): PluginManifest {
  return {
    label: mod.label,
    endpoints: mod.endpoints,
    initConfig: mod.initConfig,
    contract: mod.contract,
    ...mod.manifest,
  };
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
