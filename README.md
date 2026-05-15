<p align="center">
  <img src="https://raw.githubusercontent.com/jsj/api-emulator/main/.README/cover.png" alt="api-emulator" width="1024" />
</p>

<h1 align="center">api-emulator</h1>

<p align="center">Fake real APIs locally so your app can test integrations without touching production, sandboxes, or someone else's server.</p>

`api-emulator` is a local app store for fake APIs. Run GitHub, Stripe, Resend, and plugin powered providers on localhost, seed state, inspect behavior, reset data, and test your app in one place.

## Why use it?

- Test API integrations locally without real provider credentials.
- Run multiple fake services together, with shared state, auth, webhooks, seed data, and resets.
- Keep provider behavior in plugins so public, private, and internal APIs can live outside your app.

## Quick start

```bash
npx -p api-emulator api
npx -p api-emulator api --service github,stripe,resend
```

Then point your app at the local provider URLs:

```text
http://localhost:4000/github
http://localhost:4000/stripe
http://localhost:4000/resend
```

Use trusted local HTTPS names when your app needs browser compatible origins:

```bash
npx -p api-emulator api --service github,stripe,resend --portless
```

```text
https://github.api-emulator.localhost
https://stripe.api-emulator.localhost
https://resend.api-emulator.localhost
```

Create starter config and list available services:

```bash
npx -p api-emulator api init
npx -p api-emulator api list
```

## Use in tests

```ts
import { createEmulator } from 'api-emulator'

const github = await createEmulator({ service: 'github', port: 4001 })
process.env.GITHUB_API_BASE = github.url

afterEach(() => github.reset())
afterAll(() => github.close())
```

Capture and replay a stable fixture after a stochastic or stateful run:

```ts
const fixture = github.exportFixture({ metadata: { name: 'pull-request-flow' } })

github.resetToFixture(fixture)
```

## Plugins

Install more providers from a public or internal plugin shelf:

```bash
npx -p api-emulator api install posthog
npx -p api-emulator api install pepper --no-package-manager
```

Or load a plugin file directly:

```bash
npx -p api-emulator api --plugin ./api-emulator-plugins/@posthog/api-emulator.mjs --service posthog
```

The installer auto discovers sibling `api-emulator-plugins` and `api-emulator-internal` checkouts. Set `API_EMULATOR_PLUGIN_CATALOGS=/path/to/shelf,/path/to/internal` to add more shelves.

Sanity check a plugin before installing or loading it:

```bash
npx -p api-emulator api validate-plugin posthog
npx -p api-emulator api validate-plugin ./api-emulator-plugins/@posthog/api-emulator.mjs
```

A plugin exports a `ServicePlugin`:

```ts
import type { ServicePlugin } from '@api-emulator/core'

export const plugin: ServicePlugin = {
  name: 'internal-billing',
  register(app) {
    app.get('/v1/customers', (c) => c.json({ data: [] }))
  },
}
```

## Next.js embedded mode

```bash
npm install @api-emulator/adapter-next @api-emulator/core
```

```ts
import { createApiEmulatorHandler } from '@api-emulator/adapter-next'
import type { ServicePlugin } from '@api-emulator/core'

const internalPlugin: ServicePlugin = {
  name: 'internal',
  register(app) {
    app.get('/health', (c) => c.json({ ok: true }))
  },
}

export const { GET, POST, PUT, PATCH, DELETE } = createApiEmulatorHandler({
  services: {
    internal: { emulator: { plugin: internalPlugin } },
  },
})
```

## Configuration

`npx -p api-emulator api init` creates `api-emulator.config.yaml`.

```yaml
tokens:
  test_token_admin:
    login: admin
    scopes: [repo, user]

github:
  users:
    - login: octocat
      name: The Octocat
```

The CLI auto-detects `api-emulator.config.yaml`, `.yml`, and `.json`.

## Examples

- [`examples/oauth`](./examples/oauth)
- [`examples/nextjs-embedded`](./examples/nextjs-embedded)
- [`examples/resend-magic-link`](./examples/resend-magic-link)
- [`examples/stripe-checkout`](./examples/stripe-checkout)

## Development

```bash
bun install
bun run build
bun run format:check
bun run type-check
bun run lint
bun run test
```

## Links

- [`jsj/api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins)
- [`api-emulator` on npm](https://www.npmjs.com/package/api-emulator)

## License

MIT
