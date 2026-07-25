import { afterEach, describe, it, expect } from "vitest";
import { resolve } from "path";
import { createEmulator } from "../api.js";
import * as grpc from "@grpc/grpc-js";
import { load as loadProto } from "@grpc/proto-loader";

describe("createEmulator", () => {
  const emulators: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(emulators.splice(0).map((emulator) => emulator.close()));
  });

  it("starts a plugin and returns a url", async () => {
    const echo = await createEmulator({
      service: "echo",
      port: 14000,
      plugins: [resolve("src/__tests__/fixtures/echo-plugin.ts")],
    });
    emulators.push(echo);

    expect(echo.url).toBe("http://localhost:14000");

    const res = await fetch(`${echo.url}/ping`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body).toEqual({ ok: true, service: "echo" });
  });

  it("starts multiple plugins independently", async () => {
    const pluginPath = resolve("src/__tests__/fixtures/echo-plugin.ts");
    const [echo1, echo2] = await Promise.all([
      createEmulator({ service: "echo", port: 14010, plugins: [pluginPath] }),
      createEmulator({ service: "echo", port: 14011, plugins: [pluginPath] }),
    ]);
    emulators.push(echo1, echo2);

    expect(echo1.url).toBe("http://localhost:14010");
    expect(echo2.url).toBe("http://localhost:14011");
  });

  it("reset wipes and re-seeds stores", async () => {
    const echo = await createEmulator({
      service: "echo",
      port: 14020,
      plugins: [resolve("src/__tests__/fixtures/echo-plugin.ts")],
      seed: { echo: { message: "hello" } },
    });
    emulators.push(echo);

    const configRes = await fetch(`${echo.url}/config`);
    expect(await configRes.json()).toEqual({ message: "hello" });

    echo.reset();

    const resetConfigRes = await fetch(`${echo.url}/config`);
    expect(await resetConfigRes.json()).toEqual({ message: "hello" });
  });

  it("exports and restores fixtures", async () => {
    const echo = await createEmulator({
      service: "echo",
      port: 14025,
      plugins: [resolve("src/__tests__/fixtures/echo-plugin.ts")],
      seed: { echo: { message: "seed" } },
    });
    emulators.push(echo);

    await fetch(`${echo.url}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "captured" }),
    });

    const fixture = echo.exportFixture({ metadata: { name: "captured-run" } });
    expect(fixture.service).toBe("echo");
    expect(fixture.metadata).toEqual({ name: "captured-run" });

    await fetch(`${echo.url}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "changed" }),
    });

    echo.resetToFixture(fixture);
    const fixtureConfigRes = await fetch(`${echo.url}/config`);
    expect(await fixtureConfigRes.json()).toEqual({ message: "captured" });

    echo.reset();
    const resetConfigRes = await fetch(`${echo.url}/config`);
    expect(await resetConfigRes.json()).toEqual({ message: "seed" });
  });

  it("throws on unknown service", async () => {
    await expect(createEmulator({ service: "unknown-svc" })).rejects.toThrow("Unknown service");
  });

  it("starts an external plugin", async () => {
    const echo = await createEmulator({
      service: "echo",
      port: 14030,
      plugins: [resolve("src/__tests__/fixtures/echo-plugin.ts")],
      seed: { echo: { message: "hello" } },
    });
    emulators.push(echo);

    const res = await fetch(`${echo.url}/ping`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body).toEqual({ ok: true, service: "echo" });

    const configRes = await fetch(`${echo.url}/config`);
    expect(await configRes.json()).toEqual({ message: "hello" });
  });

  it("starts a real gRPC listener declared by a plugin", async () => {
    const echo = await createEmulator({
      service: "echo",
      port: 14040,
      grpcPort: 15040,
      plugins: [resolve("src/__tests__/fixtures/echo-plugin.ts")],
      seed: { echo: { message: "seeded" } },
    });
    emulators.push(echo);
    expect(echo.grpcUrl).toBe("127.0.0.1:15040");

    const definition = await loadProto(resolve("src/__tests__/fixtures/echo.proto"), { defaults: true });
    const root = grpc.loadPackageDefinition(definition) as unknown as {
      apiemulator: { echo: { Echo: grpc.ServiceClientConstructor } };
    };
    const client = new root.apiemulator.echo.Echo(
      echo.grpcUrl!,
      grpc.credentials.createInsecure(),
    ) as unknown as grpc.Client & {
      ping(request: { message: string }, callback: (error: grpc.ServiceError | null, response: unknown) => void): void;
    };
    const response = await new Promise<{ message: string; configured: string }>((resolveResponse, reject) => {
      client.ping({ message: "hello" }, (error, value) => {
        if (error) reject(error);
        else resolveResponse(value as { message: string; configured: string });
      });
    });
    client.close();
    expect(response).toEqual({ message: "hello", configured: "seeded" });
  });
});
