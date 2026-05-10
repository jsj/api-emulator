import type { ServicePlugin } from "@emulators/core";

const plugin: ServicePlugin = {
  name: "defaulted",
  register(app) {
    app.get("/ping", (c) => c.json({ ok: true, service: "defaulted" }));
  },
};

export default plugin;
export const label = "Default export test plugin";
export const endpoints = "ping";
export const initConfig = {
  defaulted: {
    enabled: true,
  },
};
