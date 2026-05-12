import type { ServicePlugin, Store } from "@api-emulator/core";

export const plugin: ServicePlugin = {
  name: "echo",
  register(app, store) {
    app.get("/ping", (c) => c.json({ ok: true, service: "echo" }));
    app.get("/config", (c) => c.json(store.getData("echo:config") ?? null));
    app.post("/config", async (c) => {
      const body = await c.req.json();
      store.setData("echo:config", body);
      return c.json(body);
    });
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
