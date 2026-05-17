import { resolvePluginModules } from "../registry.js";

interface ListOptions {
  plugin?: string;
}

export async function listCommand(options: ListOptions = {}): Promise<void> {
  const pluginSpecifiers =
    options.plugin
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const pluginModules = await resolvePluginModules(pluginSpecifiers, { includeInstalled: true });

  console.log("\nAvailable services:\n");
  for (const pluginModule of Object.values(pluginModules)) {
    console.log(`  ${pluginModule.name.padEnd(10)}${pluginModule.label}`);
    console.log(`            Endpoints: ${pluginModule.endpoints}`);
    console.log(`            Fidelity: ${pluginModule.fidelity}`);
    console.log();
  }
}
