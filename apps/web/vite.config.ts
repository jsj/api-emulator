import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "node:module";
import { defineConfig } from "vite";
import vinext from "vinext";

const require = createRequire(import.meta.url);
const justBashNodeBundle = require.resolve("just-bash").replace(/index\.cjs$/, "index.js");

export default defineConfig({
  resolve: {
    alias: {
      "just-bash": justBashNodeBundle,
    },
  },
  plugins: [
    tailwindcss(),
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
