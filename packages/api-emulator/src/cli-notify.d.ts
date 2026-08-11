declare module "@jsjackson/cli-notify" {
  export interface NotificationRequest {
    title: string;
    message: string;
    subtitle?: string | null;
    milestone: "ready" | "finished" | "failed" | "action-required";
    override?: "inherit" | "notify" | "no-notify";
  }

  export function notifyFromManifest(
    manifest: URL | string,
    request: NotificationRequest,
  ): import("node:child_process").ChildProcess;

  export function cliNotifyExecutable(): string;
}
