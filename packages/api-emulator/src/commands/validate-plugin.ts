import { existsSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { basename, extname, isAbsolute, join, resolve } from "path";
import { spawnSync } from "child_process";
import { loadExternalPluginModule } from "../external-plugin-adapter.js";
import { resolvePluginSource, type PluginSource } from "../plugin-source-registry.js";

export interface ValidatePluginOptions {
  skipBuild?: boolean;
  skipLoad?: boolean;
}

function resolveSource(input: string): PluginSource {
  const source = resolvePluginSource(input);
  if (source) return source;

  const specifier = input.startsWith(".") || isAbsolute(input) ? resolve(input) : input;
  return {
    name: basename(input).replace(/\.[^.]+$/, ""),
    sourceId: "specifier",
    kind: "file",
    specifier,
    description: `${input} plugin specifier`,
  };
}

function assertLocalFile(path: string): void {
  if ((path.startsWith(".") || isAbsolute(path)) && !existsSync(resolve(path))) {
    throw new Error(`Plugin entry does not exist: ${path}`);
  }
}

function canBuild(specifier: string): boolean {
  return [".ts", ".tsx", ".js", ".mjs"].includes(extname(specifier));
}

function buildEntry(specifier: string): void {
  if (!canBuild(specifier)) return;
  const outdir = mkdtempSync(join(tmpdir(), "api-emulator-plugin-validate-"));
  try {
    const result = spawnSync("bun", ["build", specifier, "--packages", "external", "--outdir", outdir], {
      stdio: "pipe",
      encoding: "utf-8",
    });
    if (result.error) {
      if ((result.error as NodeJS.ErrnoException).code === "ENOENT") {
        console.log("  build: skipped (bun not found)");
        return;
      }
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout || "Plugin build failed").trim());
    }
    console.log("  build: ok");
  } finally {
    rmSync(outdir, { recursive: true, force: true });
  }
}

async function loadPlugin(specifier: string, expectedName: string): Promise<void> {
  const module = await loadExternalPluginModule(specifier);
  if (module.name !== expectedName) {
    throw new Error(`Plugin exported name "${module.name}" does not match requested plugin "${expectedName}"`);
  }
  await module.load();
  console.log("  load: ok");
}

export async function validatePluginCommand(input: string, options: ValidatePluginOptions = {}): Promise<void> {
  const source = resolveSource(input);

  console.log(`Validating ${source.name} from ${source.sourceId}`);
  console.log(`  specifier: ${source.specifier}`);
  if (source.packageName) console.log(`  package: ${source.packageName}`);

  assertLocalFile(source.specifier);
  console.log("  entry: ok");

  if (!options.skipBuild) {
    buildEntry(source.specifier);
  }

  if (options.skipLoad) {
    console.log("  load: skipped");
  } else {
    await loadPlugin(source.specifier, source.name);
  }

  console.log(`Plugin ${source.name} is valid`);
}
