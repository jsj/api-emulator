import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, resolve } from "path";

export type PluginSourceKind = "package" | "file";

export interface PluginSource {
  name: string;
  sourceId: string;
  kind: PluginSourceKind;
  specifier: string;
  description: string;
  packageName?: string;
  packageRoot?: string;
}

const PLUGIN_SOURCES: Record<string, PluginSource> = {
  cloudflare: {
    name: "cloudflare",
    sourceId: "public",
    kind: "package",
    packageName: "@api-emulator/cloudflare",
    specifier: "@api-emulator/cloudflare",
    description: "Workers-style bindings, D1, KV, R2, queues, durable objects, and service bindings",
  },
};

const DEFAULT_CATALOG_DIRS = ["api-emulator-plugins", "api-emulator-internal"];
const CATALOG_MANIFEST_FILES = ["api-emulator.catalog.json"];
const PLUGIN_ENTRY_FILES = ["api-emulator.mjs", "api-emulator/index.mjs"];
const PACKAGE_ENTRY_DIRS = ["api-emulator", "trading-emulator"];

function candidateCatalogRoots(cwd = process.cwd()): string[] {
  const envRoots =
    process.env.API_EMULATOR_PLUGIN_CATALOGS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  const roots = [...envRoots];
  let current = resolve(cwd);
  for (;;) {
    for (const dir of DEFAULT_CATALOG_DIRS) {
      roots.push(join(current, dir));
      roots.push(join(dirname(current), dir));
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return [...new Set(roots.map((root) => resolve(root)))];
}

function sourceIdForRoot(root: string): string {
  const base = root.split(/[\\/]/).pop() ?? "local";
  if (base === "api-emulator-plugins") return "public";
  if (base === "api-emulator-internal") return "internal";
  return base;
}

function packageEntrySpecifier(packageRoot: string, pkg: { exports?: unknown; main?: string }): string {
  if (typeof pkg.exports === "string") return resolve(packageRoot, pkg.exports);
  if (
    typeof pkg.exports === "object" &&
    pkg.exports !== null &&
    "." in pkg.exports &&
    typeof pkg.exports["."] === "string"
  ) {
    return resolve(packageRoot, pkg.exports["."]);
  }
  if (
    typeof pkg.exports === "object" &&
    pkg.exports !== null &&
    "." in pkg.exports &&
    typeof pkg.exports["."] === "object" &&
    pkg.exports["."] !== null &&
    "import" in pkg.exports["."] &&
    typeof pkg.exports["."].import === "string"
  ) {
    return resolve(packageRoot, pkg.exports["."].import);
  }
  if (typeof pkg.main === "string") return resolve(packageRoot, pkg.main);
  return packageRoot;
}

interface CatalogManifest {
  plugins?: Record<
    string,
    {
      kind?: PluginSourceKind;
      specifier: string;
      description?: string;
      packageName?: string;
    }
  >;
}

function discoverManifest(root: string, sourceId: string): PluginSource[] {
  const sources: PluginSource[] = [];
  for (const manifestFile of CATALOG_MANIFEST_FILES) {
    const manifestPath = join(root, manifestFile);
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as CatalogManifest;
    for (const [name, entry] of Object.entries(manifest.plugins ?? {})) {
      sources.push({
        name,
        sourceId,
        kind: entry.kind ?? (entry.packageName ? "package" : "file"),
        packageName: entry.packageName,
        specifier: entry.specifier.startsWith(".") ? resolve(root, entry.specifier) : entry.specifier,
        description: entry.description ?? `${name} plugin from ${sourceId} catalog`,
      });
    }
  }
  return sources;
}

function discoverCatalog(root: string): PluginSource[] {
  if (!existsSync(root) || !statSync(root).isDirectory()) return [];

  const sourceId = sourceIdForRoot(root);
  const sources: PluginSource[] = discoverManifest(root, sourceId);
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("@")) continue;
    const name = entry.name.slice(1);
    const pluginRoot = join(root, entry.name);

    for (const entryDir of PACKAGE_ENTRY_DIRS) {
      const packageRoot = join(pluginRoot, entryDir);
      const packageJsonPath = join(packageRoot, "package.json");
      if (!existsSync(packageJsonPath)) continue;
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
        name?: string;
        description?: string;
        main?: string;
      };
      sources.push({
        name,
        sourceId,
        kind: "package",
        packageName: pkg.name,
        packageRoot,
        specifier: packageEntrySpecifier(packageRoot, pkg),
        description: pkg.description ?? `${name} package from ${sourceId} catalog`,
      });
      break;
    }

    for (const entryFile of PLUGIN_ENTRY_FILES) {
      const specifier = join(pluginRoot, entryFile);
      if (existsSync(specifier)) {
        sources.push({
          name,
          sourceId,
          kind: "file",
          specifier,
          description: `${name} plugin from ${sourceId} catalog`,
        });
        break;
      }
    }
  }
  return sources;
}

function pluginSources(): Record<string, PluginSource> {
  const sources = { ...PLUGIN_SOURCES };
  for (const root of candidateCatalogRoots()) {
    for (const source of discoverCatalog(root)) {
      sources[source.name] ??= source;
    }
  }
  return sources;
}

export function listPluginSources(): PluginSource[] {
  return Object.values(pluginSources());
}

export function resolvePluginSource(name: string): PluginSource | null {
  return pluginSources()[name] ?? null;
}
