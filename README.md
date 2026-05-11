<p align="center">
  <img src="./.README/cover.png" alt="api-emulator" width="1024" />
</p>

<h1 align="center">api-emulator</h1>

<p align="center">
  Local API emulators you can run, share, and extend with plugins
</p>

api-emulator is the thin runtime spine for local, stateful API emulation. It starts provider-shaped plugins, wires shared state, auth, webhooks, seed data, reset hooks, and local URLs, then gets out of the way.

Provider depth belongs in plugins. The public plugin shelf lives in [`jsj/api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins), and private teams can keep the same shape in internal repos.

## Quick start

Run the built-in catalog:

```bash
npx api-emulator
```

Start specific services:

```bash
npx api-emulator --service github,stripe,resend
```

Generate config:

```bash
npx api-emulator init
```

List built-in and external plugins:

```bash
npx api-emulator list
```

Use trusted local HTTPS names:

```bash
npx api-emulator --portless
```

Example local URLs:

```text
https://github.api-emulator.localhost
https://stripe.api-emulator.localhost
https://resend.api-emulator.localhost
```

No API keys, Docker daemon, or external sandbox accounts are required for the built-in catalog.

## Programmatic API

Prefer the programmatic runtime when writing tests:

```ts
import { createEmulator } from 'api-emulator'

const github = await createEmulator({ service: 'github', port: 4001 })

process.env.GITHUB_API_BASE = github.url

afterEach(() => github.reset())
afterAll(() => github.close())
```

Each emulator exposes `url`, `reset()`, and `close()`.

## Plugins

Load public plugins from [`api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins):

```bash
npx api-emulator --plugin ./api-emulator-plugins/@posthog/api-emulator.mjs --service posthog
npx api-emulator --plugin ./api-emulator-plugins/@github/api-emulator.mjs,./api-emulator-plugins/@apple/api-emulator.mjs
```

A plugin exports a `ServicePlugin`:

```ts
import type { ServicePlugin } from '@emulators/core'

export const plugin: ServicePlugin = {
  name: 'internal-billing',
  register(app, store, webhooks, baseUrl) {
    app.get('/v1/customers', (c) => c.json({ data: [] }))
  },
}
```

Plugins can also export `label`, `endpoints`, `initConfig`, `seedFromConfig`, and `defaultFallback`. See [`jsj/api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins) for the current public catalog and examples.

## Configuration

`api-emulator init` creates `api-emulator.config.yaml`.

```yaml
tokens:
  test_token_admin:
    login: admin
    scopes: [repo, user]

github:
  users:
    - login: octocat
      name: The Octocat
      email: octocat@github.com
  repos:
    - owner: octocat
      name: hello-world
      auto_init: true

stripe:
  products:
    - id: prod_tshirt
      name: T-shirt
  prices:
    - id: price_tshirt
      product: prod_tshirt
      unit_amount: 2500
      currency: usd

resend:
  apiKeys:
    - re_test_key
```

The CLI auto-detects `api-emulator.config.yaml`, `.yml`, and `.json`. It still accepts older `emulate.config.*` and `service-emulator.config.*` names for migration.

## Next.js embedded mode

Use `@emulators/adapter-next` to mount emulators inside a Next.js app on the same origin.

```ts
// app/emulate/[...path]/route.ts
import { createEmulateHandler } from '@emulators/adapter-next'
import { githubPlugin } from '@emulators/github'
import { stripePlugin } from '@emulators/stripe'

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  plugins: [githubPlugin, stripePlugin],
})
```

This gives local routes like:

```text
/emulate/github/login/oauth/authorize
/emulate/stripe/v1/checkout/sessions
```

## Development

This monorepo uses Bun.

```bash
bun install
bun run build
bun run format:check
bun run type-check
bun run lint
bun run test
```

## Examples

- [`examples/oauth`](./examples/oauth)
- [`examples/nextjs-embedded`](./examples/nextjs-embedded)
- [`examples/resend-magic-link`](./examples/resend-magic-link)
- [`examples/stripe-checkout`](./examples/stripe-checkout)
- [`jsj/api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins)

## Features

- Thin runtime spine for stateful local provider APIs
- Built-in catalog for common local development flows
- External plugin loading from files or package names
- Trusted local HTTPS names through portless
- YAML and JSON seed data
- Programmatic test API with reset hooks
- Shared store, auth, webhooks, UI, and inspect surfaces
- Next.js embedded mode

## FAQ

<details>
  <summary>Is this a fork of emulate?</summary>

  Yes. api-emulator is a hard fork with a new identity and a stronger focus on the plugin-spine model: a small runtime plus provider-shaped plugins.
</details>

<details>
  <summary>Why not just mock fetch calls?</summary>

  SDKs, OAuth redirects, webhooks, pagination, retries, XML wire formats, and provider state usually live below your app code. api-emulator runs those protocol surfaces locally so tests exercise the integration seam instead of a shallow stub.
</details>

<details>
  <summary>Can teams keep private emulators?</summary>

  Yes. Load them with `--plugin`, keep them in a separate repo, and share only the runtime spine publicly.
</details>

<details>
  <summary>Does api-emulator still support old emulate config names?</summary>

  Yes. `emulate.config.*`, `EMULATE_PORT`, and `EMULATE_BASE_URL` still work as migration compatibility aliases.
</details>

## License

MIT
