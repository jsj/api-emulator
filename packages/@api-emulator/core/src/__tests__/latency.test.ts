import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { latencyMiddleware } from "../middleware/latency.js";

describe("latencyMiddleware", () => {
  it("delays requests by the configured duration", async () => {
    vi.useFakeTimers();
    const app = new Hono();
    app.use("*", latencyMiddleware(250));
    app.get("/test", (c) => c.json({ ok: true }));

    const responsePromise = Promise.resolve(app.request("/test"));
    let settled = false;
    void responsePromise.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(249);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(responsePromise).resolves.toMatchObject({ status: 200 });
    vi.useRealTimers();
  });

  it("rejects invalid latency values", () => {
    expect(() => latencyMiddleware(-1)).toThrow("latencyMs must be a non-negative finite number");
    expect(() => latencyMiddleware(Number.NaN)).toThrow("latencyMs must be a non-negative finite number");
  });
});
