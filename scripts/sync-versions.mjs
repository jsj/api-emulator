#!/usr/bin/env node

/**
 * Reads the version from packages/api-emulator/package.json (the canonical
 * source), writes it to runtime package package.json files, and keeps
 * api-emulator's runtime package dependencies aligned.
 *
 * Usage:
 *   node scripts/sync-versions.mjs          # sync
 *   node scripts/sync-versions.mjs --check  # CI check (exit 1 if out of sync)
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(import.meta.url), "../..");
const apiEmulatorPkgPath = join(root, "packages/api-emulator/package.json");
const runtimePackageDirs = ["packages/@api-emulator/adapter-next", "packages/@api-emulator/core"];

const canonicalPkg = JSON.parse(readFileSync(apiEmulatorPkgPath, "utf8"));
const version = canonicalPkg.version;

const check = process.argv.includes("--check");
let mismatches = [];

for (const dir of runtimePackageDirs) {
  const pkgPath = join(root, dir, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    continue;
  }

  if (pkg.version === version) continue;

  if (check) {
    mismatches.push(`${pkg.name}: ${pkg.version} (expected ${version})`);
  } else {
    pkg.version = version;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Updated ${pkg.name} to ${version}`);
  }
}

for (const [name, currentVersion] of Object.entries(canonicalPkg.dependencies ?? {})) {
  if (!name.startsWith("@api-emulator/")) continue;
  if (currentVersion === version) continue;

  if (check) {
    mismatches.push(`api-emulator dependency ${name}: ${currentVersion} (expected ${version})`);
  } else {
    canonicalPkg.dependencies[name] = version;
    console.log(`Updated api-emulator dependency ${name} to ${version}`);
  }
}

if (!check) {
  writeFileSync(apiEmulatorPkgPath, JSON.stringify(canonicalPkg, null, 2) + "\n");
}

if (check && mismatches.length > 0) {
  console.error("Version mismatch:");
  for (const m of mismatches) console.error(`  ${m}`);
  process.exit(1);
} else if (check) {
  console.log(`All runtime packages are at ${version}`);
}
