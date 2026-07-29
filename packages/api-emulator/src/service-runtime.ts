import {
  createServer,
  createStoreFixture,
  fixtureStoreSnapshot,
  type AppKeyResolver,
  type FixtureInteraction,
  type FixtureSource,
  type Store,
  type StoreFixture,
  type StoreFixtureOptions,
  type StoreSnapshot,
} from "@api-emulator/core";
import { serve } from "@hono/node-server";
import * as grpcJs from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";
import { load as loadProto } from "@grpc/proto-loader";
import type { LoadedPlugin, PluginModule } from "./registry.js";

export interface SeedConfig {
  tokens?: Record<string, { login: string; scopes?: string[] }>;
  [service: string]: unknown;
}

export type TokenMap = Record<string, { login: string; id: number; scopes?: string[] }>;

export interface ServiceRuntimeOptions {
  service: string;
  pluginModule: PluginModule;
  loadedPlugin: LoadedPlugin;
  port: number;
  baseUrl: string;
  tokens: TokenMap;
  seedConfig?: Record<string, unknown>;
  grpcPort?: number;
  latencyMs?: number;
}

export interface RunningService {
  service: string;
  url: string;
  grpcUrl?: string;
  store: Store;
  snapshot(): StoreSnapshot;
  restore(fixture: FixtureSource): void;
  exportFixture(options?: StoreFixtureOptions): StoreFixture;
  resetToFixture(fixture: FixtureSource): void;
  reset(): void;
  close(): Promise<void>;
}

export function createAuthTokens(seedConfig?: SeedConfig | null): TokenMap {
  const tokens: TokenMap = {};
  if (seedConfig?.tokens) {
    let tokenId = 100;
    for (const [token, user] of Object.entries(seedConfig.tokens)) {
      tokens[token] = { login: user.login, id: tokenId++, scopes: user.scopes };
    }
  } else {
    tokens["test_token_admin"] = { login: "admin", id: 2, scopes: ["repo", "user", "admin:org", "admin:repo_hook"] };
  }
  return tokens;
}

function resolveGrpcService(
  root: grpcJs.GrpcObject,
  packageName: string | undefined,
  serviceName: string,
): grpcJs.ServiceDefinition<grpcJs.UntypedServiceImplementation> {
  let current: unknown = root;
  for (const segment of [...(packageName?.split(".").filter(Boolean) ?? []), serviceName]) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      throw new Error(`gRPC service not found in proto: ${[packageName, serviceName].filter(Boolean).join(".")}`);
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (typeof current !== "function" || !("service" in current))
    throw new Error(`gRPC target is not a service: ${serviceName}`);
  return (current as grpcJs.ServiceClientConstructor).service;
}

async function startGrpcServer(loadedPlugin: LoadedPlugin, store: Store, baseUrl: string, grpcPort?: number) {
  if (!loadedPlugin.grpc || grpcPort === undefined) return undefined;
  const registrations = await loadedPlugin.grpc({ store, baseUrl });
  const server = new grpcJs.Server();
  for (const registration of Array.isArray(registrations) ? registrations : [registrations]) {
    const definition = await loadProto(registration.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      ...registration.loaderOptions,
    });
    const root = loadPackageDefinition(definition);
    server.addService(
      resolveGrpcService(root, registration.packageName, registration.serviceName),
      registration.implementation,
    );
  }
  const address = `127.0.0.1:${grpcPort}`;
  await new Promise<void>((resolve, reject) => {
    server.bindAsync(address, grpcJs.ServerCredentials.createInsecure(), (error) =>
      error ? reject(error) : resolve(),
    );
  });
  return { server, url: address };
}

export async function createServiceRuntime(options: ServiceRuntimeOptions): Promise<RunningService> {
  const { service, pluginModule, loadedPlugin, port, baseUrl, tokens, seedConfig, grpcPort, latencyMs } = options;

  const resolverRef: { current?: AppKeyResolver } = {};
  const appKeyResolver: AppKeyResolver | undefined = loadedPlugin.createAppKeyResolver
    ? (appId) => resolverRef.current!(appId)
    : undefined;
  const fallbackUser = pluginModule.defaultFallback(seedConfig);

  const { app, store, webhooks } = createServer(loadedPlugin.plugin, {
    port,
    baseUrl,
    tokens,
    appKeyResolver,
    fallbackUser,
    latencyMs,
  });
  resolverRef.current = loadedPlugin.createAppKeyResolver?.(store);

  const seed = () => {
    loadedPlugin.plugin.seed?.(store, baseUrl);
    if (seedConfig && loadedPlugin.seedFromConfig) {
      loadedPlugin.seedFromConfig(store, baseUrl, seedConfig, webhooks);
    }
  };
  seed();

  const httpServer = serve({ fetch: app.fetch, port });
  let grpcRuntime: Awaited<ReturnType<typeof startGrpcServer>>;
  try {
    grpcRuntime = await startGrpcServer(loadedPlugin, store, baseUrl, grpcPort);
  } catch (error) {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    throw error;
  }

  return {
    service,
    url: baseUrl,
    grpcUrl: grpcRuntime?.url,
    store,
    snapshot() {
      return store.snapshot();
    },
    restore(fixture) {
      store.restore(fixtureStoreSnapshot(fixture));
    },
    exportFixture(options = {}) {
      const interactions = store.getData<FixtureInteraction[]>("api-emulator:interactions");
      return createStoreFixture(service, store.snapshot(), {
        ...options,
        interactions: options.interactions ?? interactions,
      });
    },
    resetToFixture(fixture) {
      store.reset();
      store.restore(fixtureStoreSnapshot(fixture));
    },
    reset() {
      store.reset();
      seed();
    },
    async close(): Promise<void> {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          httpServer.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        }),
        new Promise<void>((resolve) => {
          if (!grpcRuntime) return resolve();
          grpcRuntime.server.tryShutdown(() => resolve());
        }),
      ]);
    },
  };
}
