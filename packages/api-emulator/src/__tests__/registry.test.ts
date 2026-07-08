import { describe, expect, it } from "vitest";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DEFAULT_PLUGIN_NAMES, resolvePluginModules } from "../registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("resolvePluginModules", () => {
  it("starts with no built-in provider plugins", async () => {
    const registry = await resolvePluginModules();

    expect(DEFAULT_PLUGIN_NAMES).toEqual([]);
    expect(Object.keys(registry)).toEqual([]);
  });

  it("normalizes external default exports into plugin modules", async () => {
    const registry = await resolvePluginModules([resolve(__dirname, "fixtures/default-export-plugin.ts")]);

    expect(registry.defaulted).toMatchObject({
      name: "defaulted",
      label: "Default export test plugin",
      endpoints: "ping",
      fidelityTier: "smoke-only",
      initConfig: { defaulted: { enabled: true } },
    });

    const loadedPlugin = await registry.defaulted.load();
    expect(loadedPlugin.plugin.name).toBe("defaulted");
  });

  it("allows external plugins to use provider names", async () => {
    const registry = await resolvePluginModules([resolve(__dirname, "fixtures/github-conflict-plugin.ts")]);

    expect(registry.github).toMatchObject({
      name: "github",
      endpoints: "GitHub OpenAPI fallback",
      fidelity: "stateful-core-plus-openapi-compatible-generic-fallback",
      fidelityTier: "generated fallback",
    });
  });

  it("rejects duplicate external plugin names", async () => {
    const pluginPath = resolve(__dirname, "fixtures/echo-plugin.ts");

    await expect(resolvePluginModules([pluginPath, pluginPath])).rejects.toThrow('Duplicate plugin name "echo"');
  });
});
