import type { ServicePlugin, Store } from "@emulators/core";

export const plugin: ServicePlugin = {
  name: "echo",
  register(app, store) {
    app.get("/ping", (c) => c.json({ ok: true, service: "echo" }));
    app.get("/config", (c) => c.json(store.getData("echo:config") ?? null));
  },
};

export function seedFromConfig(store: Store, _baseUrl: string, config: unknown): void {
  store.setData("echo:config", config);
}

export const manifest = {
  name: "echo",
  label: "Echo test plugin",
  endpoints: "ping",
  initConfig: {
    echo: {
      message: "hello",
    },
  },
};
