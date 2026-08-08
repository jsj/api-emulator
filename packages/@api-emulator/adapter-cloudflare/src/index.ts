import {
  Store,
  WebhookDispatcher,
  type AppEnv,
  type ServicePlugin,
  type StoreSnapshot,
  type TokenMap,
} from "@api-emulator/core/worker-runtime";
import { Hono } from "hono";

export interface EmulatorModule {
  plugin?: ServicePlugin;
  default?: ServicePlugin;
}

export interface CloudflareState {
  load(): Promise<string | null>;
  save(value: string): Promise<void>;
}

export interface CloudflareAdapterConfig<Environment> {
  emulator: EmulatorModule;
  state(environment: Environment): CloudflareState;
  baseUrl?(request: Request, environment: Environment): string;
}

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function createApiEmulatorWorker<Environment>(config: CloudflareAdapterConfig<Environment>) {
  let runtimePromise: Promise<Runtime> | undefined;
  let pendingSave = Promise.resolve();

  return {
    async fetch(request: Request, environment: Environment): Promise<Response> {
      runtimePromise ??= createRuntime(config, request, environment);
      const runtime = await runtimePromise;
      const response = await runtime.app.fetch(request);
      if (mutatingMethods.has(request.method)) {
        pendingSave = pendingSave.then(() => runtime.state.save(JSON.stringify(runtime.store.snapshot())));
        await pendingSave;
      }
      return response;
    },
  };
}

interface Runtime {
  app: Hono<AppEnv>;
  state: CloudflareState;
  store: Store;
}

async function createRuntime<Environment>(
  config: CloudflareAdapterConfig<Environment>,
  request: Request,
  environment: Environment,
): Promise<Runtime> {
  const plugin = resolvePlugin(config.emulator);
  const store = new Store();
  const state = config.state(environment);
  await restoreStore(store, state);

  const app = new Hono<AppEnv>();
  const webhooks = new WebhookDispatcher();
  const tokenMap: TokenMap = new Map();
  const baseUrl = config.baseUrl?.(request, environment) ?? new URL(request.url).origin;
  plugin.register(app, store, webhooks, baseUrl, tokenMap);
  return { app, state, store };
}

export function createKVState(namespace: KVNamespaceLike, key = "api-emulator:state"): CloudflareState {
  return {
    load: () => namespace.get(key),
    save: (value) => namespace.put(key, value),
  };
}

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

function resolvePlugin(emulator: EmulatorModule): ServicePlugin {
  const plugin = emulator.plugin ?? emulator.default;
  if (!plugin) throw new Error("Emulator module must export `plugin` or a default plugin");
  return plugin;
}

async function restoreStore(store: Store, state: CloudflareState): Promise<void> {
  const savedState = await state.load();
  if (!savedState) return;
  store.restore(JSON.parse(savedState) as StoreSnapshot);
}
