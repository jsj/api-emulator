import { describe, expect, it } from "vitest";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DEFAULT_PLUGIN_NAMES, resolvePluginModules } from "../registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("resolvePluginModules", () => {
  it("keeps the default plugin order stable", async () => {
    const registry = await resolvePluginModules();

    expect(Object.keys(registry)).toEqual([...DEFAULT_PLUGIN_NAMES]);
    expect(Object.values(registry).map((pluginModule) => pluginModule.name)).toEqual([...DEFAULT_PLUGIN_NAMES]);
  });

  it("normalizes external default exports into plugin modules", async () => {
    const registry = await resolvePluginModules([resolve(__dirname, "fixtures/default-export-plugin.ts")]);

    expect(registry.defaulted).toMatchObject({
      name: "defaulted",
      label: "Default export test plugin",
      endpoints: "ping",
      initConfig: { defaulted: { enabled: true } },
    });

    const loadedPlugin = await registry.defaulted.load();
    expect(loadedPlugin.plugin.name).toBe("defaulted");
  });

  it("rejects external plugins that conflict with default plugin names", async () => {
    await expect(resolvePluginModules([resolve(__dirname, "fixtures/github-conflict-plugin.ts")])).rejects.toThrow(
      'Plugin "github" conflicts with default plugin "github"',
    );
  });

  it("rejects duplicate external plugin names", async () => {
    const pluginPath = resolve(__dirname, "fixtures/echo-plugin.ts");

    await expect(resolvePluginModules([pluginPath, pluginPath])).rejects.toThrow('Duplicate plugin name "echo"');
  });
});
