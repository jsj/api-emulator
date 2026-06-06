import { describe, expect, it } from "vitest";
import { appleScriptNotification, escapeAppleScript } from "../cli-notifier.js";

describe("cli notifier", () => {
  it("escapes AppleScript string values", () => {
    expect(escapeAppleScript('api "server" \\ done')).toBe('api \\"server\\" \\\\ done');
  });

  it("builds an AppleScript notification", () => {
    expect(appleScriptNotification({ title: "api-emulator", message: "Server started" })).toBe(
      'display notification "Server started" with title "api-emulator"',
    );
  });
});
