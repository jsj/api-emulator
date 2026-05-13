import { describe, expect, it } from "vitest";
import type { ServicePlugin } from "@api-emulator/core";
import { createApiEmulatorHandler, withApiEmulator } from "./index.js";

const plugin: ServicePlugin = {
  name: "echo",
  register(app) {
    app.get("/page", (c) =>
      c.html(
        `<a href="/login">Login</a><form action="/submit"></form><div style="background:url('/font.woff2')"></div>`,
      ),
    );
    app.get("/redirect", () => new Response(null, { status: 302, headers: { Location: "/login" } }));
    app.get("/ping", (c) => c.json({ ok: true }));
  },
};

function ctx(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe("createApiEmulatorHandler", () => {
  it("routes requests by service and rewrites relative HTML URLs", async () => {
    const handler = createApiEmulatorHandler({ services: { echo: { emulator: { plugin } } } });

    const res = await handler.GET(new Request("https://app.test/api-emulator/echo/page"), ctx(["echo", "page"]));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('href="/api-emulator/echo/login"');
    expect(html).toContain('action="/api-emulator/echo/submit"');
    expect(html).toContain("url('/api-emulator/echo/font.woff2')");
  });

  it("rewrites relative redirect locations", async () => {
    const handler = createApiEmulatorHandler({ services: { echo: { emulator: { plugin } } } });

    const res = await handler.GET(
      new Request("https://app.test/api-emulator/echo/redirect"),
      ctx(["echo", "redirect"]),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/api-emulator/echo/login");
  });

  it("returns 404 for unknown services", async () => {
    const handler = createApiEmulatorHandler({ services: { echo: { emulator: { plugin } } } });

    const res = await handler.GET(new Request("https://app.test/api-emulator/missing/ping"), ctx(["missing", "ping"]));

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Unknown service: missing");
  });
});

describe("withApiEmulator", () => {
  it("adds core font tracing for the api-emulator route", () => {
    const config = withApiEmulator({ outputFileTracingIncludes: { "/api/**": ["./existing/**"] } });

    expect(config.outputFileTracingIncludes).toMatchObject({
      "/api/**": ["./existing/**"],
      "/api-emulator/**": ["./node_modules/@api-emulator/core/dist/fonts/**"],
    });
  });
});
