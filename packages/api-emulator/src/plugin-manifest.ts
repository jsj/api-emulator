export interface PluginManifest {
  name?: string;
  label?: string;
  endpoints?: string;
  fidelity?: string | PluginFidelity;
  fidelityTier?: FidelityTier;
  initConfig?: Record<string, unknown>;
  contract?: unknown;
}

export type FidelityTier = "contract-backed" | "smoke-only" | "stub" | "generated fallback";

export interface PluginFidelity {
  level: string;
  endpoints?: string[];
  seedableResources?: string[];
  smoke?: string;
  notes?: string;
}

export function formatPluginFidelity(fidelity: PluginManifest["fidelity"]): string {
  if (!fidelity) return "unrated";
  if (typeof fidelity === "string") return fidelity;
  return fidelity.level;
}

export function classifyPluginFidelity(manifest: PluginManifest): FidelityTier {
  if (manifest.fidelityTier) return manifest.fidelityTier;

  const level = formatPluginFidelity(manifest.fidelity).toLowerCase();
  if (level.includes("contract-backed") || level.includes("contract backed")) return "contract-backed";
  if (level.includes("smoke-only") || level.includes("smoke only")) return "smoke-only";
  if (level.includes("stub")) return "stub";
  if (level.includes("generated") || level.includes("fallback") || level.includes("openapi")) {
    return "generated fallback";
  }

  const endpoints = manifest.endpoints?.trim().toLowerCase() ?? "";
  if (!endpoints || endpoints === "get /health" || endpoints === "health") return "stub";

  return "smoke-only";
}

export function readPluginManifest(mod: {
  manifest?: PluginManifest;
  label?: string;
  endpoints?: string;
  initConfig?: Record<string, unknown>;
  contract?: unknown;
}): PluginManifest {
  if (mod.manifest) return mod.manifest;

  const contract = mod.contract as { fidelity?: string } | undefined;
  return {
    label: mod.label,
    endpoints: mod.endpoints,
    fidelity: contract?.fidelity,
    initConfig: mod.initConfig,
    contract: mod.contract,
  };
}

export function validatePluginManifest(
  manifest: PluginManifest,
  pluginName: string,
): Required<Pick<PluginManifest, "label" | "endpoints" | "fidelityTier" | "initConfig">> &
  Omit<PluginManifest, "label" | "endpoints" | "fidelityTier" | "initConfig"> {
  if (manifest.name && manifest.name !== pluginName) {
    throw new Error(`Plugin manifest name "${manifest.name}" does not match plugin name "${pluginName}"`);
  }

  return {
    ...manifest,
    label: manifest.label ?? `${pluginName} (external plugin)`,
    endpoints: manifest.endpoints ?? "",
    fidelityTier: classifyPluginFidelity(manifest),
    initConfig: manifest.initConfig ?? {},
  };
}
