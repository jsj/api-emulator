import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  external: ["@api-emulator/core", "@api-emulator/core/worker-runtime"],
});
