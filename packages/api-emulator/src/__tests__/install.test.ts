import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { installCommand } from "../commands/install.js";
import { resolvePluginSource } from "../plugin-source-registry.js";

describe("installCommand", () => {
  const originalCwd = process.cwd();
  const originalCatalogs = process.env.API_EMULATOR_PLUGIN_CATALOGS;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "api-emulator-install-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (originalCatalogs === undefined) {
      delete process.env.API_EMULATOR_PLUGIN_CATALOGS;
    } else {
      process.env.API_EMULATOR_PLUGIN_CATALOGS = originalCatalogs;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("records registry plugins in the lockfile", async () => {
    await installCommand("cloudflare", { packageManager: false });

    const lock = JSON.parse(readFileSync(join(tempDir, "api-emulator.lock"), "utf-8")) as {
      plugins: Record<string, { specifier: string; packageName: string }>;
    };

    expect(lock.plugins.cloudflare).toMatchObject({
      packageName: "@api-emulator/cloudflare",
      specifier: "@api-emulator/cloudflare",
      sourceId: "public",
    });
  });

  it("records single-file plugins from configured catalogs", async () => {
    const catalog = join(tempDir, "api-emulator-internal");
    const pluginDir = join(catalog, "@pepper");
    mkdirSync(pluginDir, { recursive: true });
    writeFileSync(join(pluginDir, "api-emulator.mjs"), "export const plugin = { name: 'pepper', register() {} };\n");
    process.env.API_EMULATOR_PLUGIN_CATALOGS = catalog;

    await installCommand("pepper", { packageManager: false });

    const lock = JSON.parse(readFileSync(join(tempDir, "api-emulator.lock"), "utf-8")) as {
      plugins: Record<string, { specifier: string; source: string; sourceId: string }>;
    };

    expect(lock.plugins.pepper).toMatchObject({
      source: "specifier",
      sourceId: "internal",
      specifier: join(pluginDir, "api-emulator.mjs"),
    });
  });

  it("records package plugins from configured catalogs without installing packages", async () => {
    const catalog = join(tempDir, "api-emulator-plugins");
    const packageRoot = join(catalog, "@alpaca", "trading-emulator");
    mkdirSync(join(packageRoot, "src"), { recursive: true });
    writeFileSync(
      join(packageRoot, "package.json"),
      JSON.stringify({
        name: "@alpaca/trading-emulator",
        type: "module",
        exports: { ".": "./src/index.ts" },
      }),
    );
    writeFileSync(join(packageRoot, "src/index.ts"), "export const plugin = { name: 'alpaca', register() {} };\n");
    process.env.API_EMULATOR_PLUGIN_CATALOGS = catalog;

    await installCommand("alpaca", { packageManager: false });

    const lock = JSON.parse(readFileSync(join(tempDir, "api-emulator.lock"), "utf-8")) as {
      plugins: Record<string, { specifier: string; packageName: string; sourceId: string }>;
    };

    expect(lock.plugins.alpaca).toMatchObject({
      packageName: "@alpaca/trading-emulator",
      sourceId: "public",
      specifier: join(packageRoot, "src/index.ts"),
    });
  });

  it("prefers package plugins over legacy single-file entries", () => {
    const catalog = join(tempDir, "api-emulator-plugins");
    const pluginRoot = join(catalog, "@github");
    const packageRoot = join(pluginRoot, "api-emulator");
    mkdirSync(join(packageRoot, "src"), { recursive: true });
    writeFileSync(join(pluginRoot, "api-emulator.mjs"), "export const plugin = { name: 'github', register() {} };\n");
    writeFileSync(
      join(packageRoot, "package.json"),
      JSON.stringify({
        name: "@api-emulator/github",
        type: "module",
        exports: { ".": "./src/index.ts" },
      }),
    );
    writeFileSync(join(packageRoot, "src/index.ts"), "export const plugin = { name: 'github', register() {} };\n");
    process.env.API_EMULATOR_PLUGIN_CATALOGS = catalog;

    expect(resolvePluginSource("github")).toMatchObject({
      kind: "package",
      packageName: "@api-emulator/github",
      specifier: join(packageRoot, "src/index.ts"),
    });
  });

  it("records plugins from explicit catalog manifests", async () => {
    const catalog = join(tempDir, "team-plugins");
    mkdirSync(catalog, { recursive: true });
    writeFileSync(join(catalog, "billing.mjs"), "export const plugin = { name: 'billing', register() {} };\n");
    writeFileSync(
      join(catalog, "api-emulator.catalog.json"),
      JSON.stringify({
        plugins: {
          billing: {
            specifier: "./billing.mjs",
            description: "Internal billing plugin",
          },
        },
      }),
    );
    process.env.API_EMULATOR_PLUGIN_CATALOGS = catalog;

    await installCommand("billing", { packageManager: false });

    const lock = JSON.parse(readFileSync(join(tempDir, "api-emulator.lock"), "utf-8")) as {
      plugins: Record<string, { specifier: string; sourceId: string }>;
    };

    expect(lock.plugins.billing).toMatchObject({
      sourceId: "team-plugins",
      specifier: join(catalog, "billing.mjs"),
    });
  });
});
