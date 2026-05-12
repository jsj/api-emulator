import type { StoreSnapshot } from "./store.js";

export interface FixtureInteraction {
  service: string;
  method: string;
  endpoint: string;
  request: unknown;
  response: unknown;
  status?: number;
  recordedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface StoreFixture {
  version: 1;
  service: string;
  capturedAt: string;
  store: StoreSnapshot;
  interactions?: FixtureInteraction[];
  metadata?: Record<string, unknown>;
}

export interface StoreFixtureOptions {
  capturedAt?: string;
  interactions?: FixtureInteraction[];
  metadata?: Record<string, unknown>;
}

export type FixtureSource = StoreSnapshot | StoreFixture;

export function createStoreFixture(
  service: string,
  store: StoreSnapshot,
  options: StoreFixtureOptions = {},
): StoreFixture {
  return {
    version: 1,
    service,
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    store,
    interactions: options.interactions,
    metadata: options.metadata,
  };
}

export function isStoreFixture(source: FixtureSource): source is StoreFixture {
  return "version" in source && source.version === 1 && "store" in source;
}

export function fixtureStoreSnapshot(source: FixtureSource): StoreSnapshot {
  return isStoreFixture(source) ? source.store : source;
}
