import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { installCommand } from "../commands/install.js";

describe("installCommand", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "emulate-install-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("records registry plugins in the lockfile", async () => {
    await installCommand("cloudflare", { packageManager: false });

    const lock = JSON.parse(readFileSync(join(tempDir, "api-emulator.lock"), "utf-8")) as {
      plugins: Record<string, { specifier: string; packageName: string }>;
    };

    expect(lock.plugins.cloudflare).toMatchObject({
      packageName: "@api-emulator/cloudflare",
      specifier: "@api-emulator/cloudflare",
    });
  });
});
