import { Command } from "commander";
import { startCommand } from "./commands/start.js";
import { initCommand, installAgentSkills } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { installCommand } from "./commands/install.js";
import { validatePluginCommand } from "./commands/validate-plugin.js";
import { pluginCreateCommand } from "./commands/plugin.js";
import { notifyIfRequested } from "./cli-notifier.js";

declare const PKG_VERSION: string;
const pkg = { version: PKG_VERSION };

const defaultPort = process.env.API_EMULATOR_PORT ?? process.env.PORT ?? "4000";
const defaultGrpcPort = process.env.API_EMULATOR_GRPC_PORT ?? "50051";
const defaultLatency = process.env.API_EMULATOR_LATENCY_MS ?? "0";

const program = new Command();

program
  .name("api")
  .description("Local API emulators you can run, share, and extend with plugins")
  .version(pkg.version)
  .option("--notify", "Show a macOS notification for useful command milestones");

function notifyOption(command: Command): Command {
  return command.option("--notify", "Show a macOS notification for useful command milestones");
}

function wantsNotify(command: Command, opts: { notify?: boolean }): boolean {
  return Boolean(opts.notify ?? command.optsWithGlobals<{ notify?: boolean }>().notify);
}

function wantsStartNotify(opts: { notify?: boolean }): boolean {
  return opts.notify !== false;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function runCommandWithNotification(label: string, enabled: boolean, fn: () => Promise<void>): Promise<void> {
  const startedAt = Date.now();
  try {
    await fn();
    notifyIfRequested({
      enabled,
      title: "api-emulator",
      message: `${label} finished in ${formatDuration(Date.now() - startedAt)}`,
    });
  } catch (err) {
    notifyIfRequested({
      enabled,
      title: "api-emulator",
      message: `${label} failed after ${formatDuration(Date.now() - startedAt)}`,
    });
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

notifyOption(
  program
    .command("start", { isDefault: true })
    .description("Start the emulator server")
    .option("-p, --port <port>", "Port for the first service", defaultPort)
    .option("--grpc-port <port>", "Base gRPC port for plugins that declare gRPC services", defaultGrpcPort)
    .option("-s, --service <services>", "Comma-separated services to enable")
    .option("--seed <file>", "Load seed data from this file")
    .option("--base-url <url>", "Use this public URL for generated links (supports {service})")
    .option("--latency <milliseconds>", "Delay each HTTP response by this many milliseconds", defaultLatency)
    .option("--portless", "Serve over HTTPS via portless (auto-registers aliases)")
    .option("--plugin <plugins>", "Comma-separated external plugin paths or package names")
    .option("--no-notify", "Disable the macOS notification when the emulator server is ready"),
).action(async (opts) => {
  const port = parseInt(opts.port, 10);
  const grpcPort = parseInt(opts.grpcPort, 10);
  const latencyMs = Number(opts.latency);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    console.error(`Port ${opts.port} is invalid. Use a number from 1 through 65535.`);
    process.exit(1);
  }
  if (Number.isNaN(grpcPort) || grpcPort < 1 || grpcPort > 65535) {
    console.error(`gRPC port ${opts.grpcPort} is invalid. Use a number from 1 through 65535.`);
    process.exit(1);
  }
  if (!Number.isInteger(latencyMs) || latencyMs < 0) {
    console.error(`Latency ${opts.latency} is invalid. Use a whole number that is 0 or more.`);
    process.exit(1);
  }
  await startCommand({
    port,
    grpcPort,
    service: opts.service,
    seed: opts.seed,
    baseUrl: opts.baseUrl,
    portless: opts.portless,
    plugin: opts.plugin,
    notify: wantsStartNotify(opts),
    latencyMs,
  });
});

notifyOption(
  program
    .command("init")
    .description("Create a starter configuration file")
    .option("-s, --service <service>", "Create configuration for this service", "all")
    .option("--plugin <plugins>", "Comma-separated external plugin paths or package names")
    .option("--yes", "Replace an existing configuration file"),
).action(async (opts, command) => {
  await runCommandWithNotification("init", wantsNotify(command, opts), async () => {
    await initCommand({
      service: opts.service,
      plugin: opts.plugin,
      yes: opts.yes,
    });
  });
});

function addPluginCreateCommand(command: Command): void {
  notifyOption(
    command
      .command("create <name>")
      .description("Create starter files for a plugin")
      .option("--dir <dir>", "Create the plugin in this directory")
      .option("--fidelity <level>", "Set the initial fidelity level", "stub")
      .option("--yes", "Replace changed generated files"),
  ).action(async (name, opts, actionCommand) => {
    await runCommandWithNotification("plugin create", wantsNotify(actionCommand, opts), async () => {
      await pluginCreateCommand(name, {
        dir: opts.dir,
        fidelity: opts.fidelity,
        yes: opts.yes,
      });
    });
  });
}

const plugin = program.command("plugin").description("Create and manage provider plugins");
addPluginCreateCommand(plugin);

notifyOption(
  plugin
    .command("install <plugin>")
    .description("Install a plugin")
    .option("--package-manager <name>", "Use this package manager")
    .option("--no-package-manager", "Record the plugin without installing its package"),
).action(async (pluginName, opts, command) => {
  await runCommandWithNotification("plugin install", wantsNotify(command, opts), async () => {
    await installCommand(pluginName, {
      packageManager: opts.packageManager === false ? false : opts.packageManager,
    });
  });
});

notifyOption(
  plugin
    .command("validate <plugin>")
    .description("Validate a plugin by name, path, or package")
    .option("--skip-build", "Do not build the plugin entry")
    .option("--skip-load", "Do not load the plugin module"),
).action(async (pluginName, opts, command) => {
  await runCommandWithNotification("plugin validate", wantsNotify(command, opts), async () => {
    await validatePluginCommand(pluginName, {
      skipBuild: opts.skipBuild,
      skipLoad: opts.skipLoad,
    });
  });
});

const skills = program.command("skills").description("Manage agent skills");
notifyOption(
  skills
    .command("install")
    .description("Install agent skills")
    .option("--target <targets>", "Install for these comma-separated targets", "agents")
    .option("--yes", "Replace changed generated files"),
).action(async (opts, command) => {
  await runCommandWithNotification("skills install", wantsNotify(command, opts), async () => {
    installAgentSkills({ targets: opts.target, yes: opts.yes });
    console.log("Installed api-emulator agent skills.");
  });
});

program
  .command("list")
  .alias("list-services")
  .description("List available services")
  .option("--plugin <plugins>", "Comma-separated external plugin paths or package names")
  .action(async (opts) => {
    await listCommand({ plugin: opts.plugin });
  });

program.parse();
