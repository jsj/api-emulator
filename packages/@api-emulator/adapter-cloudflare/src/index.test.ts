import { describe, expect, it } from "vitest";
import { createApiEmulatorWorker, type CloudflareState } from "./index";

describe("createApiEmulatorWorker", () => {
  it("restores and saves plugin state around mutating requests", async () => {
    let saved: string | null = null;
    const state: CloudflareState = {
      load: async () => saved,
      save: async (value) => {
        saved = value;
      },
    };
    const plugin = {
      name: "counter",
      register(app: any, store: any) {
        app.post("/increment", (context: any) => {
          const count = (store.getData("count") ?? 0) + 1;
          store.setData("count", count);
          return context.json({ count });
        });
      },
    };
    const worker = createApiEmulatorWorker({ emulator: { plugin }, state: () => state });

    const first = await worker.fetch(new Request("https://example.com/increment", { method: "POST" }), {});
    const second = await worker.fetch(new Request("https://example.com/increment", { method: "POST" }), {});

    expect(await first.json()).toEqual({ count: 1 });
    expect(await second.json()).toEqual({ count: 2 });
    expect(saved).not.toBeNull();
  });
});
