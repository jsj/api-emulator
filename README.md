<p align="center">
  <img src="./.README/cover.png" alt="api-emulator" width="1024" />
</p>

<h1 align="center">api-emulator</h1>

<p align="center">Local API emulators you can run, share, and extend with plugins.</p>

api-emulator is a small runtime for stateful local API emulation. Provider behavior lives in plugins, while the runtime handles shared state, auth, webhooks, seed data, reset hooks, local URLs, and embedded adapters.

## Quick start

```bash
npx -p api-emulator api
npx -p api-emulator api --service github,stripe,resend
npx -p api-emulator api init
npx -p api-emulator api list
```

Use trusted local HTTPS names with portless:

```bash
npx -p api-emulator api --portless
```

```text
https://github.api-emulator.localhost
https://stripe.api-emulator.localhost
https://resend.api-emulator.localhost
```

## Plugins

Load plugins from a local plugin shelf:

```bash
npx -p api-emulator api --plugin ./api-emulator-plugins/@posthog/api-emulator.mjs --service posthog
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

Install plugins from a public or internal shelf:

```bash
npx -p api-emulator api install posthog
npx -p api-emulator api install pepper --no-package-manager
```

The installer auto-discovers sibling `api-emulator-plugins` and `api-emulator-internal` checkouts. Set `API_EMULATOR_PLUGIN_CATALOGS=/path/to/shelf,/path/to/internal` to add more shelves.

## Programmatic API

```ts
import { createEmulator } from 'api-emulator'

const github = await createEmulator({ service: 'github', port: 4001 })
process.env.GITHUB_API_BASE = github.url

afterEach(() => github.reset())
afterAll(() => github.close())
```

## Next.js embedded mode

```bash
npm install @api-emulator/adapter-next @api-emulator/core
```

```ts
import { createEmulateHandler } from '@api-emulator/adapter-next'
import type { ServicePlugin } from '@api-emulator/core'

const internalPlugin: ServicePlugin = {
  name: 'internal',
  register(app) {
    app.get('/health', (c) => c.json({ ok: true }))
  },
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
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

The CLI auto-detects `api-emulator.config.yaml`, `.yml`, and `.json`. Older `emulate.config.*` and `service-emulator.config.*` names still work as migration aliases.

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

- [`examples/`](./examples)
- [`jsj/api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins)
- [`api-emulator` on npm](https://www.npmjs.com/package/api-emulator)

## License

MIT
