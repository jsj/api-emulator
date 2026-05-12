import { createEmulateHandler } from "@emulators/adapter-next";
import type { ServicePlugin } from "@emulators/core";

const resendPlugin: ServicePlugin = {
  name: "resend",
  register(app) {
    app.all("/*", (c) => c.json({ ok: true, provider: "resend", path: c.req.path }));
  },
};

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: {
    resend: {
      emulator: { plugin: resendPlugin },
      seed: {
        domains: [{ name: "example.com" }],
      },
    },
  },
});
