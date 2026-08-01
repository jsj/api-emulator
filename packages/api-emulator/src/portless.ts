import { execSync, spawnSync } from "child_process";
import { Socket } from "net";
import { createInterface } from "readline";

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY) && !process.env.CI;
}

function hasPortless(): boolean {
  const result = spawnSync("portless", ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "" || normalized === "y" || normalized === "yes");
    });
  });
}

function portlessUrl(name: string): string | null {
  const result = spawnSync("portless", ["get", name], { encoding: "utf-8" });
  if (result.status !== 0) return null;

  const url = result.stdout.trim();
  return url.length > 0 ? url : null;
}

async function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(500);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
    socket.connect(port, "127.0.0.1");
  });
}

async function isProxyRunning(): Promise<boolean> {
  const url = portlessUrl("api-emulator-probe");
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const port = parsed.port ? Number(parsed.port) : parsed.protocol === "http:" ? 80 : 443;
    return await canConnect(port);
  } catch {
    return false;
  }
}

const portlessInstallCommand = "bun add --global portless";

export async function ensurePortless(): Promise<void> {
  if (!hasPortless()) {
    if (!isInteractive()) {
      console.error(`portless is not installed. Run '${portlessInstallCommand}', then run this command again.`);
      process.exit(1);
    }

    const yes = await promptYesNo(`portless is not installed. Install it now? (${portlessInstallCommand}) [Y/n] `);
    if (!yes) {
      console.error("Cannot continue without portless.");
      process.exit(1);
    }

    try {
      execSync(portlessInstallCommand, { stdio: "inherit" });
    } catch {
      console.error(`The portless installation failed. Run '${portlessInstallCommand}', then run this command again.`);
      process.exit(1);
    }

    if (!hasPortless()) {
      console.error("portless was installed but could not be found on PATH.");
      process.exit(1);
    }
  }

  if (!(await isProxyRunning())) {
    console.error("The portless proxy is not running. Run 'portless proxy start', then run this command again.");
    process.exit(1);
  }
}

export interface PortlessAlias {
  name: string;
  port: number;
}

export function registerAliases(aliases: PortlessAlias[]): void {
  const registered: PortlessAlias[] = [];
  for (const { name, port } of aliases) {
    const result = spawnSync("portless", ["alias", name, String(port), "--force"], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      if (registered.length > 0) {
        removeAliases(registered);
      }
      throw new Error(`Failed to register portless alias: ${name} -> ${port}`);
    }
    registered.push({ name, port });
  }
}

export function removeAliases(aliases: PortlessAlias[]): void {
  for (const { name } of aliases) {
    const result = spawnSync("portless", ["alias", "--remove", name], { stdio: "ignore" });
    if (result.status !== 0) {
      console.error(`Warning: failed to remove portless alias: ${name}`);
    }
  }
}

export function portlessBaseUrl(serviceName: string): string {
  return portlessUrl(`${serviceName}.api-emulator`) ?? `https://${serviceName}.api-emulator.localhost`;
}
