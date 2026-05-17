import { Command } from "commander";
import { startCommand } from "./commands/start.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { installCommand } from "./commands/install.js";
import { validatePluginCommand } from "./commands/validate-plugin.js";
import { pluginCreateCommand } from "./commands/plugin.js";

declare const PKG_VERSION: string;
const pkg = { version: PKG_VERSION };

const defaultPort = process.env.API_EMULATOR_PORT ?? process.env.PORT ?? "4000";

const program = new Command();

program.name("api").description("Local API emulators you can run, share, and extend with plugins").version(pkg.version);

program
  .command("start", { isDefault: true })
  .description("Start the emulator server")
  .option("-p, --port <port>", "Base port", defaultPort)
  .option("-s, --service <services>", "Comma-separated services to enable")
  .option("--seed <file>", "Path to seed config file")
  .option("--base-url <url>", "Override advertised base URL (supports {service} template)")
  .option("--portless", "Serve over HTTPS via portless (auto-registers aliases)")
  .option("--plugin <plugins>", "Comma-separated external plugin paths or package names")
  .action(async (opts) => {
    const port = parseInt(opts.port, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
      console.error(`Invalid port: ${opts.port}`);
      process.exit(1);
    }
    await startCommand({
      port,
      service: opts.service,
      seed: opts.seed,
      baseUrl: opts.baseUrl,
      portless: opts.portless,
      plugin: opts.plugin,
    });
  });

program
  .command("init")
  .description("Generate a starter config file")
  .option("-s, --service <service>", "Service to generate config for", "all")
  .option("--plugin <plugins>", "Comma-separated external plugin paths or package names")
  .option("--agents <targets>", "Install agent skills for agents,user-agents,claude,codex,cursor,windsurf")
  .option("--skills-only", "Only install agent skills")
  .option("--yes", "Overwrite generated files that changed")
  .option("--non-interactive", "Use defaults suitable for agents and CI")
  .action(async (opts) => {
    try {
      await initCommand({
        service: opts.service,
        plugin: opts.plugin,
        agents: opts.agents,
        skillsOnly: opts.skillsOnly,
        yes: opts.yes,
        nonInteractive: opts.nonInteractive,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

function addPluginCreateCommand(command: Command): void {
  command
    .command("create <name>")
    .description("Scaffold a provider clone")
    .option("--dir <dir>", "Directory to create the clone in")
    .option("--fidelity <level>", "Initial fidelity level", "stub")
    .option("--yes", "Overwrite generated files that changed")
    .action(async (name, opts) => {
      try {
        await pluginCreateCommand(name, {
          dir: opts.dir,
          fidelity: opts.fidelity,
          yes: opts.yes,
        });
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });
}

const plugin = program.command("plugin").description("Create and manage provider plugins");
addPluginCreateCommand(plugin);

const clone = program.command("clone").description("Create and manage provider clones");
addPluginCreateCommand(clone);

program
  .command("list")
  .alias("list-services")
  .description("List available services")
  .option("--plugin <plugins>", "Comma-separated external plugin paths or package names")
  .action(async (opts) => {
    await listCommand({ plugin: opts.plugin });
  });

program
  .command("install <plugin>")
  .description("Install a provider plugin by name")
  .option("--package-manager <name>", "Package manager to use")
  .option("--no-package-manager", "Only record the plugin in api-emulator.lock")
  .action(async (plugin, opts) => {
    try {
      await installCommand(plugin, {
        packageManager: opts.packageManager === false ? false : opts.packageManager,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("validate-plugin <plugin>")
  .description("Validate a provider plugin by name, path, or package")
  .option("--skip-build", "Skip entrypoint build validation")
  .option("--skip-load", "Skip runtime module loading validation")
  .action(async (plugin, opts) => {
    try {
      await validatePluginCommand(plugin, {
        skipBuild: opts.skipBuild,
        skipLoad: opts.skipLoad,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
