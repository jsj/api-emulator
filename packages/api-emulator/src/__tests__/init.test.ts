import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { initCommand, installAgentSkills } from "../commands/init.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("initCommand", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "api-emulator-init-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates config for an external plugin when explicitly targeted", async () => {
    await initCommand({
      service: "echo",
      plugin: resolve(__dirname, "fixtures/echo-plugin.ts"),
    });

    const content = readFileSync(join(tempDir, "api-emulator.config.yaml"), "utf-8");
    expect(content).toContain("tokens:");
    expect(content).toContain("echo:");
    expect(content).toContain("message: hello");
  });

  it("installs agent skills with a generated manifest", async () => {
    installAgentSkills({ targets: "agents" });

    const skillPath = join(tempDir, ".agents/skills/api-emulator-plugin-authoring/SKILL.md");
    expect(readFileSync(skillPath, "utf-8")).toContain("api plugin create <provider>");

    const manifest = JSON.parse(readFileSync(join(tempDir, ".api-emulator/manifest.json"), "utf-8")) as {
      files: Record<string, unknown>;
    };
    expect(manifest.files[".agents/skills/api-emulator-plugin-authoring/SKILL.md"]).toBeTruthy();
  });

  it("refuses to overwrite user-edited generated skills without yes", async () => {
    installAgentSkills({ targets: "codex" });
    writeFileSync(join(tempDir, ".codex/skills/api-emulator-plugin-authoring/SKILL.md"), "local edits\n");

    await expect(Promise.resolve().then(() => installAgentSkills({ targets: "codex" }))).rejects.toThrow(
      "The generated file contains changes",
    );

    installAgentSkills({ targets: "codex", yes: true });
    expect(existsSync(join(tempDir, ".codex/skills/api-emulator-plugin-authoring/SKILL.md"))).toBe(true);
  });
});
