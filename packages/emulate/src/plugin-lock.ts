import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

export const PLUGIN_LOCK_FILE = "api-emulator.lock";

export interface PluginLockEntry {
  name: string;
  source: "registry" | "specifier";
  specifier: string;
  sourceId?: string;
  packageName?: string;
  version?: string;
}

export interface PluginLock {
  version: 1;
  plugins: Record<string, PluginLockEntry>;
}

export function createEmptyPluginLock(): PluginLock {
  return { version: 1, plugins: {} };
}

export function readPluginLock(cwd = process.cwd()): PluginLock {
  const path = resolve(cwd, PLUGIN_LOCK_FILE);
  if (!existsSync(path)) return createEmptyPluginLock();

  const parsed = JSON.parse(readFileSync(path, "utf-8")) as PluginLock;
  if (parsed.version !== 1 || typeof parsed.plugins !== "object" || parsed.plugins === null) {
    throw new Error(`Invalid ${PLUGIN_LOCK_FILE}`);
  }
  return parsed;
}

export function writePluginLock(lock: PluginLock, cwd = process.cwd()): void {
  const sortedPlugins = Object.fromEntries(Object.entries(lock.plugins).sort(([a], [b]) => a.localeCompare(b)));
  const content = `${JSON.stringify({ version: 1, plugins: sortedPlugins }, null, 2)}\n`;
  writeFileSync(resolve(cwd, PLUGIN_LOCK_FILE), content, "utf-8");
}

export function getLockedPluginSpecifiers(cwd = process.cwd()): string[] {
  return Object.values(readPluginLock(cwd).plugins).map((entry) => entry.specifier);
}
