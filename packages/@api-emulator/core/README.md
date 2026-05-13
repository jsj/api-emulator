# @api-emulator/core

HTTP server, in-memory store, plugin interface, and middleware for api-emulator service plugins.

Part of [api-emulator](https://github.com/jsj/api-emulator) — local drop-in replacement services for CI and no-network sandboxes.

## Install

```bash
npm install @api-emulator/core
```

## Overview

The core provides the shared infrastructure that every service plugin builds on:

- **Store** — a generic in-memory store with typed `Collection<T>` instances supporting CRUD, indexing, filtering, and pagination
- **Server** — Hono-based HTTP server with automatic port management
- **Middleware** — bearer token auth, error handling, CORS
- **UI** — shared authorization/consent page rendering with bundled fonts
- **Persistence** — pluggable save/load adapters for state durability

## Persistence

### File persistence

For local development, use the built-in file adapter:

```typescript
import { filePersistence } from '@api-emulator/core'

persistence: filePersistence('.api-emulator/state.json')
```

### Custom adapter

Any object with `load` and `save` methods works:

```typescript
const kvAdapter = {
  async load() { return await kv.get('api-emulator-state') },
  async save(data: string) { await kv.set('api-emulator-state', data) },
}
```

The persistence adapter is called on cold start (load) and after every mutating request (save). Saves are serialized via an internal queue to prevent race conditions.

## Links

- [Full documentation](https://api-emulator.jsj.sh)
- [GitHub](https://github.com/jsj/api-emulator)
