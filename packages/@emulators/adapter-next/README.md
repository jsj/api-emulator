# @emulators/adapter-next

Next.js App Router integration for emulate. Embed emulators directly in your Next.js app so they run on the same origin, solving the Vercel preview deployment problem where OAuth callback URLs change with every deployment.

Part of [emulate](https://github.com/jsj/api-emulator) — local drop-in replacement services for CI and no-network sandboxes.

## Install

```bash
npm install @emulators/adapter-next
```

## Route handler

Create a catch-all route that serves emulator traffic:

```typescript
// app/emulate/[...path]/route.ts
import { createEmulateHandler } from '@emulators/adapter-next'
import type { ServicePlugin } from '@emulators/core'

const localPlugin: ServicePlugin = {
  name: 'local',
  register(app) {
    app.get('/health', (c) => c.json({ ok: true }))
  },
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: {
    local: { emulator: { plugin: localPlugin } },
  },
})
```

## Auth.js / NextAuth configuration

Point your provider at the emulator paths on the same origin:

```typescript
import GitHub from 'next-auth/providers/github'

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

GitHub({
  clientId: 'any-value',
  clientSecret: 'any-value',
  authorization: { url: `${baseUrl}/emulate/github/login/oauth/authorize` },
  token: { url: `${baseUrl}/emulate/github/login/oauth/access_token` },
  userinfo: { url: `${baseUrl}/emulate/github/user` },
})
```

No `oauth_apps` need to be seeded. When none are configured, the emulator skips `client_id`, `client_secret`, and `redirect_uri` validation.

## Font files in serverless

Emulator UI pages use bundled fonts. Wrap your Next.js config to include them in the serverless trace:

```typescript
// next.config.mjs
import { withEmulate } from '@emulators/adapter-next'

export default withEmulate({
  // your normal Next.js config
})
```

If you mount the catch-all at a custom path, pass the matching prefix:

```typescript
export default withEmulate(nextConfig, { routePrefix: '/api/emulate' })
```

## Persistence

By default, emulator state is in-memory and resets on every cold start. To persist state across restarts, pass a `persistence` adapter:

```typescript
import { createEmulateHandler } from '@emulators/adapter-next'
import type { ServicePlugin } from '@emulators/core'

const localPlugin: ServicePlugin = {
  name: 'local',
  register(app) { app.get('/health', (c) => c.json({ ok: true })) },
}

const kvAdapter = {
  async load() { return await kv.get('api-emulator-state') },
  async save(data: string) { await kv.set('api-emulator-state', data) },
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: { local: { emulator: { plugin: localPlugin } } },
  persistence: kvAdapter,
})
```

For local development, `@emulators/core` ships `filePersistence`:

```typescript
import { filePersistence } from '@emulators/core'

// ...
persistence: filePersistence('.api-emulator/state.json'),
```

## Links

- [Full documentation](https://api-emulator.jsj.sh)
- [GitHub](https://github.com/jsj/api-emulator)
