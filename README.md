<h1 align="center">api-emulator</h1>

<p align="center">
  Local API emulators you can run, share, and extend with plugins
</p>

api-emulator runs local, stateful API emulators for development, CI, and no-network sandboxes. The core package is a runtime plus a default plugin catalog; teams can load public, shared, or private provider-shaped plugins without forking the runtime.

## Install

```bash
npm install api-emulator
```

For one-off CLI usage:

```bash
npx api-emulator
```

No API keys, Docker daemon, or external sandbox accounts are required for the default plugin catalog.

## CLI

```bash
# Start the default plugin catalog
npx api-emulator

# Start a subset
npx api-emulator --service github,stripe,resend

# Start on trusted local HTTPS names
npx api-emulator --portless

# Load a seed file
npx api-emulator --seed api-emulator.config.yaml

# Generate a starter config
npx api-emulator init

# List default and external plugins
npx api-emulator list
```

With `--portless`, each service gets a named local HTTPS URL:

```text
GitHub        https://github.api-emulator.localhost
Stripe        https://stripe.api-emulator.localhost
Resend        https://resend.api-emulator.localhost
AWS           https://aws.api-emulator.localhost
```

The CLI reads `API_EMULATOR_PORT`, `API_EMULATOR_BASE_URL`, and `PORTLESS_URL`. It also accepts `EMULATE_PORT`, `EMULATE_BASE_URL`, and `emulate.config.*` names as migration compatibility aliases.

## Canonical API

Prefer the programmatic runtime when writing tests:

```ts
import { createEmulator } from 'api-emulator'

const github = await createEmulator({ service: 'github', port: 4001 })

process.env.GITHUB_API_BASE = github.url

afterEach(() => github.reset())
afterAll(() => github.close())
```

Each emulator instance exposes:

- `url` for the advertised base URL
- `reset()` to wipe state and replay seed data
- `close()` to stop the local server

## Plugins

api-emulator is designed around a small runtime spine and provider-shaped plugins. The default providers are loaded from `packages/emulate/src/default-plugin-catalog.ts`; external plugin modules are normalized by `packages/emulate/src/external-plugin-adapter.ts`.

Public external plugins live at [`jsj/api-emulator-plugins`](https://github.com/jsj/api-emulator-plugins). Private teams can keep the same shape in internal repos.

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

Plugins can also export `label`, `endpoints`, `initConfig`, `seedFromConfig`, and `defaultFallback`. The runtime keeps plugin lifecycle in one service-runtime module, so CLI and programmatic usage share the same seed, reset, token, and close behavior.

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

The CLI auto-detects:

- `api-emulator.config.yaml`
- `api-emulator.config.yml`
- `api-emulator.config.json`
- `emulate.config.yaml`
- `emulate.config.yml`
- `emulate.config.json`
- `service-emulator.config.yaml`
- `service-emulator.config.yml`
- `service-emulator.config.json`

## Default plugin catalog

api-emulator ships with a default plugin catalog so first run is useful, but these providers are catalog entries rather than hard-coded runtime behavior:

- Vercel API
- GitHub REST, OAuth, Apps, Actions, checks, statuses, and webhooks
- Google OAuth, OIDC, Gmail, Calendar, and Drive
- Slack Web API, OAuth, channels, messages, users, and webhooks
- Apple Sign in with Apple and OIDC
- Microsoft Entra ID OAuth and OIDC
- Okta OAuth and OIDC
- Clerk auth surfaces
- AWS S3, SQS, IAM, and STS
- MongoDB Atlas Admin and Data API
- Resend email API with local inbox
- Stripe Checkout, customers, products, prices, payment intents, and webhooks

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

## Production guidance

- Treat emulators as test infrastructure, not production dependencies.
- Keep real provider credentials out of seed files.
- Use fake tokens, fake webhook secrets, and local-only API keys.
- Prefer provider-shaped resource modules over app-specific happy-path stubs.
- Keep route handlers thin. Put depth in reusable Modules, Interfaces, and adapters.
- Keep private team plugins outside the public runtime until the interface proves stable.
- Use inspect and control endpoints for deterministic tests instead of sleeping or polling real systems.

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

Release publishing also uses `bun pm pack` before `npm publish` so workspace dependencies resolve in package tarballs.

## Examples
These examples use the default plugin catalog. For examples of external provider plugins you can load with `--plugin`, see [jsj/api-emulator-plugins](https://github.com/jsj/api-emulator-plugins).

See:

- [`examples/oauth`](./examples/oauth)
- [`examples/nextjs-embedded`](./examples/nextjs-embedded)
- [`examples/resend-magic-link`](./examples/resend-magic-link)
- [`examples/stripe-checkout`](./examples/stripe-checkout)

## Features

- Stateful local provider APIs for development and CI
- One CLI that can start many providers at predictable ports
- Trusted local HTTPS names through portless
- External plugin loading from files or package names through a dedicated adapter seam
- YAML and JSON seed data
- Programmatic test API with reset and close hooks
- Shared core store, auth, persistence, UI, webhooks, and inspect pages
- Next.js embedded mode for same-origin OAuth and SDK flows
- Public, shared, default-catalog, and private plugin workflows

## FAQ

<details>
  <summary>Is this a fork of emulate?</summary>

  Yes. api-emulator is a hard fork with a new identity and a stronger focus on the plugin-spine model: a small runtime plus many provider-shaped plugins.
</details>

<details>
  <summary>Why not just mock fetch calls?</summary>

  SDKs, OAuth redirects, webhooks, pagination, retries, XML wire formats, and provider state usually live below your app code. api-emulator runs those protocol surfaces locally so tests exercise the integration seam instead of a shallow stub.
</details>

<details>
  <summary>Can teams keep private emulators?</summary>

  Yes. Private and internal plugins are a first-class workflow. Load them with `--plugin`, keep them in a separate repo, and share only the runtime spine publicly.
</details>

<details>
  <summary>Does api-emulator still support old emulate config names?</summary>

  Yes. `emulate.config.*`, `EMULATE_PORT`, and `EMULATE_BASE_URL` still work as migration compatibility aliases.
</details>

<details>
  <summary>What should a good plugin emulate?</summary>

  Provider concepts, not one app's current happy path. Model resources, state transitions, errors, inspect surfaces, and control hooks so multiple products can test against the same plugin.
</details>

## License

MIT
