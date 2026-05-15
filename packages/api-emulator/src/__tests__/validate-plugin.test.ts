import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { validatePluginCommand } from "../commands/validate-plugin.js";

describe("validatePluginCommand", () => {
  const originalCwd = process.cwd();
  const originalCatalogs = process.env.API_EMULATOR_PLUGIN_CATALOGS;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "api-emulator-validate-plugin-"));
    process.chdir(tempDir);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.chdir(originalCwd);
    if (originalCatalogs === undefined) {
      delete process.env.API_EMULATOR_PLUGIN_CATALOGS;
    } else {
      process.env.API_EMULATOR_PLUGIN_CATALOGS = originalCatalogs;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("loads direct plugin specifiers", async () => {
    const pluginPath = join(tempDir, "pepper.mjs");
    writeFileSync(pluginPath, "export const plugin = { name: 'pepper', register() {} };\n");

    await expect(validatePluginCommand(pluginPath, { skipBuild: true })).resolves.toBeUndefined();
  });

  it("validates catalog package entries without loading source TypeScript", async () => {
    const catalog = join(tempDir, "api-emulator-plugins");
    const packageRoot = join(catalog, "@pepper", "api-emulator");
    mkdirSync(join(packageRoot, "src"), { recursive: true });
    writeFileSync(
      join(packageRoot, "package.json"),
      JSON.stringify({
        name: "@api-emulator/pepper",
        type: "module",
        exports: { ".": "./src/index.ts" },
      }),
    );
    writeFileSync(join(packageRoot, "src/index.ts"), "export const plugin = { name: 'pepper', register() {} };\n");
    process.env.API_EMULATOR_PLUGIN_CATALOGS = catalog;

    await expect(validatePluginCommand("pepper", { skipBuild: true, skipLoad: true })).resolves.toBeUndefined();
  });
});
