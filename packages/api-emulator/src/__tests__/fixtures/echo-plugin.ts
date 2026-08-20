import type { ServicePlugin, Store } from "@api-emulator/core";
import { fileURLToPath } from "node:url";

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

export async function materializeSeedConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  return config.materialize ? { ...config, message: `${String(config.message)} materialized` } : config;
}

export function grpc({ store }: { store: Store }) {
  return {
    protoPath: fileURLToPath(new URL("./echo.proto", import.meta.url)),
    packageName: "apiemulator.echo",
    serviceName: "Echo",
    implementation: {
      ping(call: { request: { message?: string } }, callback: (error: Error | null, response?: unknown) => void) {
        callback(null, {
          message: call.request.message ?? "",
          configured: String(store.getData<{ message?: string }>("echo:config")?.message ?? ""),
        });
      },
    },
  };
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
