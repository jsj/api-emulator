import { Command } from "commander";
import { startCommand } from "./commands/start.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { installCommand } from "./commands/install.js";

declare const PKG_VERSION: string;
const pkg = { version: PKG_VERSION };

const defaultPort = process.env.API_EMULATOR_PORT ?? process.env.EMULATE_PORT ?? process.env.PORT ?? "4000";

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
  .action(async (opts) => {
    await initCommand({ service: opts.service, plugin: opts.plugin });
  });

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

program.parse();
