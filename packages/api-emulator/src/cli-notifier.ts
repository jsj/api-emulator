import { spawn } from "child_process";
import { platform } from "os";

export interface NotificationOptions {
  enabled?: boolean;
  title: string;
  message: string;
}

export function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function appleScriptNotification({ title, message }: Omit<NotificationOptions, "enabled">): string {
  return `display notification "${escapeAppleScript(message)}" with title "${escapeAppleScript(title)}"`;
}

export function notifyIfRequested(options: NotificationOptions): void {
  if (!options.enabled || platform() !== "darwin") return;

  const child = spawn("/usr/bin/osascript", ["-e", appleScriptNotification(options)], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
