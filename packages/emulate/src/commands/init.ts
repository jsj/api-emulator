import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { stringify as yamlStringify } from "yaml";
import { DEFAULT_TOKENS, resolvePluginModules } from "../registry.js";

interface InitOptions {
  service: string;
  plugin?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const filename = "api-emulator.config.yaml";
  const fullPath = resolve(filename);

  if (existsSync(fullPath)) {
    console.error(`Config file already exists: ${filename}`);
    process.exit(1);
  }

  const pluginSpecifiers =
    options.plugin
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const pluginModules = await resolvePluginModules(pluginSpecifiers, { includeInstalled: true });
  const availableServices = Object.keys(pluginModules);

  let config: Record<string, unknown>;
  if (options.service === "all") {
    config = { ...DEFAULT_TOKENS };
    for (const name of availableServices) {
      Object.assign(config, pluginModules[name].initConfig);
    }
  } else {
    const pluginModule = pluginModules[options.service];
    if (!pluginModule) {
      console.error(`Unknown service: ${options.service}. Available: ${availableServices.join(", ")}, all`);
      process.exit(1);
    }
    config = { ...DEFAULT_TOKENS, ...pluginModule.initConfig };
  }

  const content = yamlStringify(config);
  writeFileSync(fullPath, content, "utf-8");

  console.log(`Created ${filename}`);
  console.log(`\nRun 'npx api-emulator' to start the emulator.`);
}
