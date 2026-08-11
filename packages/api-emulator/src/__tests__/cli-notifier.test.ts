import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyFromManifest } from "@jsjackson/cli-notify";
import { notifyIfRequested } from "../cli-notifier.js";

vi.mock("@jsjackson/cli-notify", () => ({
  notifyFromManifest: vi.fn(),
}));

describe("cli notifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the milestone through the package manifest", () => {
    notifyIfRequested({ enabled: true, title: "api-emulator", message: "Server started", milestone: "ready" });

    expect(notifyFromManifest).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: expect.stringContaining("/cli-notify.json") }),
      {
        title: "api-emulator",
        message: "Server started",
        milestone: "ready",
        override: "notify",
      },
    );
  });

  it("does nothing when notifications are disabled", () => {
    notifyIfRequested({ enabled: false, title: "api-emulator", message: "Server started", milestone: "ready" });

    expect(notifyFromManifest).not.toHaveBeenCalled();
  });
});
