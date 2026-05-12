import { createEmulateHandler } from "@emulators/adapter-next";
import type { ServicePlugin } from "@emulators/core";

function jsonPlugin(name: string): { plugin: ServicePlugin } {
  return {
    plugin: {
      name,
      register(app) {
        app.all("/*", (c) => c.json({ ok: true, provider: name, path: c.req.path }));
      },
    },
  };
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: {
    github: {
      emulator: jsonPlugin("github"),
      seed: {
        users: [
          { login: "admin", name: "Admin User", email: "admin@example.com" },
          { login: "designer", name: "Creative Director", email: "designer@example.com" },
          { login: "editor", name: "Content Editor", email: "editor@example.com" },
        ],
      },
    },
    google: {
      emulator: jsonPlugin("google"),
      seed: {
        users: [
          { email: "admin@example.com", name: "Admin User" },
          { email: "designer@example.com", name: "Creative Director" },
          { email: "editor@example.com", name: "Content Editor" },
        ],
      },
    },
  },
});
