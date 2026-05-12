import type { PluginModule } from "./plugin-types.js";

export type ServiceName = string;
export const DEFAULT_PLUGIN_NAMES: readonly ServiceName[] = [];
export const SERVICE_NAMES: readonly ServiceName[] = DEFAULT_PLUGIN_NAMES;
export const DEFAULT_PLUGIN_REGISTRY: Record<ServiceName, PluginModule> = {};
