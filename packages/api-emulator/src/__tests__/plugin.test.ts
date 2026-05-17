import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { pluginCreateCommand } from "../commands/plugin.js";

describe("pluginCreateCommand", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "api-emulator-plugin-create-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("scaffolds a plugin, catalog entry, fidelity metadata, and generated manifest", async () => {
    await pluginCreateCommand("pepper", { fidelity: "contract" });

    const entry = readFileSync(join(tempDir, "@pepper/api-emulator.mjs"), "utf-8");
    expect(entry).toContain('name: "pepper"');
    expect(entry).toContain('level: "contract"');

    const catalog = JSON.parse(readFileSync(join(tempDir, "api-emulator.catalog.json"), "utf-8")) as {
      plugins: Record<string, { specifier: string }>;
    };
    expect(catalog.plugins.pepper.specifier).toBe("./@pepper/api-emulator.mjs");

    const manifest = JSON.parse(readFileSync(join(tempDir, ".api-emulator/manifest.json"), "utf-8")) as {
      files: Record<string, unknown>;
    };
    expect(manifest.files["@pepper/api-emulator.mjs"]).toBeTruthy();
    expect(manifest.files["api-emulator.catalog.json"]).toBeTruthy();
  });
});
