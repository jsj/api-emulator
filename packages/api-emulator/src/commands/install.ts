import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";
import { PLUGIN_LOCK_FILE, readPluginLock, writePluginLock } from "../plugin-lock.js";
import { resolvePluginSource } from "../plugin-source-registry.js";

export interface InstallOptions {
  packageManager?: string | false;
}

function detectPackageManager(): string {
  if (existsSync(resolve("bun.lock")) || existsSync(resolve("bun.lockb"))) return "bun";
  if (existsSync(resolve("pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(resolve("yarn.lock"))) return "yarn";
  return "npm";
}

function installPackage(packageManager: string, packageName: string): void {
  const args =
    packageManager === "bun"
      ? ["add", "-D", packageName]
      : packageManager === "pnpm"
        ? ["add", "-D", packageName]
        : packageManager === "yarn"
          ? ["add", "-D", packageName]
          : ["install", "-D", packageName];

  const result = spawnSync(packageManager, args, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${packageManager} ${args.join(" ")} failed`);
  }
}

export async function installCommand(name: string, options: InstallOptions = {}): Promise<void> {
  const source = resolvePluginSource(name);
  if (!source) {
    throw new Error(`Unknown plugin source: ${name}`);
  }

  const packageManager = options.packageManager === undefined ? detectPackageManager() : options.packageManager;
  if (packageManager && source.packageName) {
    installPackage(packageManager, source.packageName);
  } else if (packageManager && source.kind === "package" && !source.packageName) {
    throw new Error(`Plugin source "${name}" is a local package without a package name`);
  }

  const lock = readPluginLock();
  lock.plugins[source.name] = {
    name: source.name,
    source: source.kind === "file" ? "specifier" : "registry",
    sourceId: source.sourceId,
    packageName: source.packageName,
    specifier: packageManager && source.packageName ? source.packageName : source.specifier,
    version: "latest",
  };
  writePluginLock(lock);

  console.log(`Installed ${source.name} from ${source.sourceId}`);
  console.log(`Recorded plugin in ${PLUGIN_LOCK_FILE}`);
}
