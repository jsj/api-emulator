import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, "../../package.json");
const cliSourcePath = resolve(__dirname, "../index.ts");

describe("cli surface", () => {
  it("exposes api as the only package binary", () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
      bin: Record<string, string>;
    };

    expect(pkg.bin).toEqual({
      api: "./dist/index.js",
    });
  });

  it("keeps the commander surface on api", () => {
    const source = readFileSync(cliSourcePath, "utf-8");

    expect(source).toContain('.name("api")');
    expect(source).toContain('.command("start"');
    expect(source).toContain('.command("init")');
    expect(source).toContain('.command("list")');
    expect(source).toContain('.command("install <plugin>")');
  });
});
