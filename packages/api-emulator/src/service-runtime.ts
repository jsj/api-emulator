import { createServer, type AppKeyResolver, type Store } from "@api-emulator/core";
import { serve } from "@hono/node-server";
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
}

export interface RunningService {
  service: string;
  url: string;
  store: Store;
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

export function createServiceRuntime(options: ServiceRuntimeOptions): RunningService {
  const { service, pluginModule, loadedPlugin, port, baseUrl, tokens, seedConfig } = options;

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

  return {
    service,
    url: baseUrl,
    store,
    reset() {
      store.reset();
      seed();
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        httpServer.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
