import { describe, expect, it } from "vitest";
import type { ServicePlugin } from "@api-emulator/core";
import { createEmulateHandler, withEmulate } from "./index.js";

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

describe("createEmulateHandler", () => {
  it("routes requests by service and rewrites relative HTML URLs", async () => {
    const handler = createEmulateHandler({ services: { echo: { emulator: { plugin } } } });

    const res = await handler.GET(new Request("https://app.test/emulate/echo/page"), ctx(["echo", "page"]));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('href="/emulate/echo/login"');
    expect(html).toContain('action="/emulate/echo/submit"');
    expect(html).toContain("url('/emulate/echo/font.woff2')");
  });

  it("rewrites relative redirect locations", async () => {
    const handler = createEmulateHandler({ services: { echo: { emulator: { plugin } } } });

    const res = await handler.GET(new Request("https://app.test/emulate/echo/redirect"), ctx(["echo", "redirect"]));

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/emulate/echo/login");
  });

  it("returns 404 for unknown services", async () => {
    const handler = createEmulateHandler({ services: { echo: { emulator: { plugin } } } });

    const res = await handler.GET(new Request("https://app.test/emulate/missing/ping"), ctx(["missing", "ping"]));

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Unknown service: missing");
  });
});

describe("withEmulate", () => {
  it("adds core font tracing for the emulate route", () => {
    const config = withEmulate({ outputFileTracingIncludes: { "/api/**": ["./existing/**"] } });

    expect(config.outputFileTracingIncludes).toMatchObject({
      "/api/**": ["./existing/**"],
      "/emulate/**": ["./node_modules/@api-emulator/core/dist/fonts/**"],
    });
  });
});
