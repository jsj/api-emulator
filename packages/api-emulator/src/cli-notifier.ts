import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cliNotifyExecutable, notifyFromManifest } from "@jsjackson/cli-notify";

export type NotificationMilestone = "ready" | "finished" | "failed";

export interface NotificationOptions {
  enabled?: boolean;
  title: string;
  message: string;
  milestone: NotificationMilestone;
}

const manifest = new URL("./cli-notify.json", import.meta.url);
const identity = "sh.jsj.api-emulator";

export function notifyIfRequested(options: NotificationOptions): void {
  if (!options.enabled) return;

  notifyFromManifest(manifest, {
    title: options.title,
    message: options.message,
    milestone: options.milestone,
    override: "notify",
  });
}

interface CliNotifyResult {
  stderr: string;
}

function runCliNotify(args: string[], input?: string): Promise<CliNotifyResult> {
  return new Promise((resolve) => {
    const child = spawn(cliNotifyExecutable(), args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => resolve({ stderr: error.message }));
    child.on("close", () => resolve({ stderr }));
    child.stdin.end(input);
  });
}

export async function setUpNotifications(): Promise<void> {
  if (process.platform !== "darwin") {
    console.log("Native notification setup is only needed on macOS.");
    return;
  }

  const result = await runCliNotify(
    ["send", "--manifest", fileURLToPath(manifest), "--stdin", "--verbose"],
    JSON.stringify({
      title: "API Emulator notifications enabled",
      message: "You will be notified when the emulator server is ready.",
      milestone: "ready",
      override: "notify",
    }),
  );

  if (result.stderr.toLowerCase().includes("authorization") && result.stderr.toLowerCase().includes("denied")) {
    console.log("Notifications are disabled in macOS. Opening the API Emulator notification settings guide.");
    await runCliNotify(["settings", "--bundle-id", identity]);
    return;
  }

  if (result.stderr.trim()) {
    console.log(`Notification setup could not finish: ${result.stderr.trim()}`);
    return;
  }

  console.log("API Emulator notifications are enabled.");
}
