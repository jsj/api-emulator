import { resolve } from "path";
import type { NextConfig } from "next";
import { withApiEmulator } from "@api-emulator/adapter-next";

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve(import.meta.dirname, "../.."),
  },
};

export default withApiEmulator(nextConfig);
