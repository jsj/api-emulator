import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

export const GENERATED_MANIFEST_FILE = ".api-emulator/manifest.json";

export interface GeneratedManifest {
  version: 1;
  files: Record<
    string,
    {
      checksum: string;
      source: string;
    }
  >;
}

export interface WriteGeneratedFileOptions {
  source: string;
  yes?: boolean;
  cwd?: string;
}

export function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function readGeneratedManifest(cwd = process.cwd()): GeneratedManifest {
  const path = resolve(cwd, GENERATED_MANIFEST_FILE);
  if (!existsSync(path)) return { version: 1, files: {} };

  const parsed = JSON.parse(readFileSync(path, "utf-8")) as GeneratedManifest;
  if (parsed.version !== 1 || typeof parsed.files !== "object" || parsed.files === null) {
    throw new Error(`Invalid ${GENERATED_MANIFEST_FILE}`);
  }
  return parsed;
}

export function writeGeneratedManifest(manifest: GeneratedManifest, cwd = process.cwd()): void {
  const path = resolve(cwd, GENERATED_MANIFEST_FILE);
  mkdirSync(dirname(path), { recursive: true });
  const files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(path, `${JSON.stringify({ version: 1, files }, null, 2)}\n`, "utf-8");
}

export function writeGeneratedFile(relativePath: string, content: string, options: WriteGeneratedFileOptions): void {
  const cwd = options.cwd ?? process.cwd();
  const path = resolve(cwd, relativePath);
  const manifest = readGeneratedManifest(cwd);
  const existing = manifest.files[relativePath];

  if (existsSync(path)) {
    const current = readFileSync(path, "utf-8");
    if (current === content) {
      manifest.files[relativePath] = { checksum: checksum(content), source: options.source };
      writeGeneratedManifest(manifest, cwd);
      return;
    }
    if (!options.yes && (!existing || existing.checksum !== checksum(current))) {
      throw new Error(`Refusing to overwrite user-edited file: ${relativePath}. Re-run with --yes to overwrite.`);
    }
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf-8");
  manifest.files[relativePath] = { checksum: checksum(content), source: options.source };
  writeGeneratedManifest(manifest, cwd);
}
