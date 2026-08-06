<p align="center">
  <img src="https://raw.githubusercontent.com/jsj/api-emulator/main/.README/cover.png" alt="api-emulator" width="1024" />
</p>

<h1 align="center">API sandboxes for coding agents</h1>

<p align="center">
  Create the stateful API sandbox that your agent needs.<br>
  Run the same workflow 1,000 times without test accounts, rate limits, or stale data.
</p>

<details open>
<summary><span><img src=".README/agent-icons/claude.svg" alt="Claude Code" width="20" height="20"> <img src=".README/agent-icons/cursor.svg" alt="Cursor" width="20" height="20"> <img src=".README/agent-icons/github-copilot.svg" alt="GitHub Copilot" width="20" height="20"> <img src=".README/agent-icons/openai.svg" alt="OpenAI Codex" width="20" height="20"> <strong>Copy this prompt to your coding agent</strong></span></summary>

```text
Set up api-emulator for this repository.
First, read https://api-emulator.jsj.sh/agent.txt.
Inspect the repository and identify the external APIs that its tests use.
Before you edit files, describe the smallest setup plan.
Keep the existing provider SDKs.
Change only their base URLs and test credentials.
Start only the providers that the repository needs.
Add or update one representative integration test.
Run that test against the local emulator.
Do not use production credentials or change production configuration.
Reset emulator state after the test.
If the required provider behavior is unavailable, stop and report the missing behavior.
Report the changed files, local URLs, test command, test result, and remaining gaps.
```

</details>

`api-emulator` runs stateful copies of APIs on your computer. Use these copies for development, agent runs, and CI.

Run GitHub, Stripe, Resend, or a plugin-based provider. Add test data to the provider.

Examine how the provider behaves. Reset the provider data after each test.

## Why use it?

- Test an API integration without real provider credentials.
- Run multiple providers with shared state, authentication, webhooks, and test data.
- Reset provider data after each test.
- Keep provider behavior in separate plugins.

## Quick start

```bash
npx -p api-emulator api
npx -p api-emulator api --service github,stripe,resend
npx -p api-emulator api --no-notify
npx -p api-emulator api --latency 1000
```

Configure your app to use these local provider URLs:

```text
http://localhost:4000/github
http://localhost:4000/stripe
http://localhost:4000/resend
```

If your browser requires an HTTPS origin, start the providers in portless mode:

```bash
npx -p api-emulator api --service github,stripe,resend --portless
```

```text
https://github.api-emulator.localhost
https://stripe.api-emulator.localhost
https://resend.api-emulator.localhost
```

Plugins can expose native gRPC services from provider `.proto` files. These services use port `50051` by default:

```bash
npx -p api-emulator api --service modal --grpc-port 50051
```

The HTTP inspector and reset routes remain on the HTTP service URL. The gRPC endpoint uses insecure local credentials for development and CI.

Create a starter configuration and list the available services:

```bash
npx -p api-emulator api init
npx -p api-emulator api list
```

`api list` shows each provider's fidelity tier: `contract-backed`, `smoke-only`, `stub`, or `generated fallback`.

## Use in tests

```ts
import { createEmulator } from "api-emulator";

const github = await createEmulator({ service: "github", port: 4001 });
process.env.GITHUB_API_BASE = github.url;

afterEach(() => github.reset());
afterAll(() => github.close());
```

For a gRPC plugin, set `grpcPort`. Then connect to the returned address:

```ts
const modal = await createEmulator({ service: "modal", port: 4000, grpcPort: 50051 });
console.log(modal.grpcUrl); // 127.0.0.1:50051
```

Export a stable fixture after a stateful or nondeterministic run. Restore the fixture before another test:

```ts
const fixture = github.exportFixture({ metadata: { name: "pull-request-flow" } });

github.resetToFixture(fixture);
```

## Plugins

Install a provider from a public or internal plugin catalog:

```bash
npx -p api-emulator api plugin install posthog
npx -p api-emulator api plugin install pepper --no-package-manager
```

To load a plugin file directly, use `--plugin`:

```bash
npx -p api-emulator api --plugin ./api-emulator-plugins/@posthog/api-emulator.mjs --service posthog
```

The installer finds sibling `api-emulator-plugins` and `api-emulator-internal` repositories automatically.

Set `API_EMULATOR_PLUGIN_CATALOGS=/path/to/shelf,/path/to/internal` to add more plugin catalogs.

Validate a plugin before you install or load it:

```bash
npx -p api-emulator api plugin validate posthog
npx -p api-emulator api plugin validate ./api-emulator-plugins/@posthog/api-emulator.mjs
```

`api plugin install` records the plugin and prints its fidelity tier when the CLI can load the plugin metadata.

Create starter files and a catalog entry for a local plugin:

```bash
npx -p api-emulator api plugin create internal-billing
```

The generated files include starter fidelity metadata. The `api list` command shows one of four fidelity tiers.

The tiers are `stub`, `smoke-only`, `contract-backed`, and `generated fallback`.

The manifest records generated files and agent skills in `.api-emulator/manifest.json`. A subsequent run preserves local changes unless you use `--yes`.

Install local agent skills for plugin authoring and runtime workflows:

```bash
npx -p api-emulator api skills install
```

Use `--target user-agents` to install into `~/.agents/skills`.

On macOS, `api-emulator` sends a notification when the server is ready. Use `--no-notify` to disable this notification.

Use `--notify` with `init`, `plugin install`, `plugin validate`, `plugin create`, or `skills install`.

Use `--latency <milliseconds>` to add a fixed delay to each HTTP request. This delay helps you test loading states and timeouts.

Set `API_EMULATOR_LATENCY_MS` to define the same delay through the environment.

A plugin exports a `ServicePlugin`:

```ts
import type { ServicePlugin } from "@api-emulator/core";

export const plugin: ServicePlugin = {
  name: "internal-billing",
  register(app) {
    app.get("/v1/customers", (c) => c.json({ data: [] }));
  },
};
```

A plugin adds native gRPC transport with a `grpc` export:

```ts
import type { GrpcRegistrationFactory } from "api-emulator";

export const grpc: GrpcRegistrationFactory = ({ store }) => ({
  protoPath: new URL("./provider.proto", import.meta.url).pathname,
  packageName: "provider.api",
  serviceName: "Provider",
  implementation: {
    getStatus(_call, callback) {
      callback(null, { status: store.getData("provider:status") ?? "ready" });
    },
  },
});
```

## Next.js embedded mode

```bash
npm install @api-emulator/adapter-next @api-emulator/core
```

```ts
import { createApiEmulatorHandler } from "@api-emulator/adapter-next";
import type { ServicePlugin } from "@api-emulator/core";

const internalPlugin: ServicePlugin = {
  name: "internal",
  register(app) {
    app.get("/health", (c) => c.json({ ok: true }));
  },
};

export const { GET, POST, PUT, PATCH, DELETE } = createApiEmulatorHandler({
  services: {
    internal: { emulator: { plugin: internalPlugin } },
  },
});
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

<hr>

<h1 align="center">API sandboxes for coding agents</h1>

<p align="center">
  Create the stateful API sandbox that your agent needs.<br>
  Run the same workflow 1,000 times without test accounts, rate limits, or stale data.
</p>

<details open>
<summary><span><img src=".README/agent-icons/claude.svg" alt="Claude Code" width="20" height="20"> <img src=".README/agent-icons/cursor.svg" alt="Cursor" width="20" height="20"> <img src=".README/agent-icons/github-copilot.svg" alt="GitHub Copilot" width="20" height="20"> <img src=".README/agent-icons/openai.svg" alt="OpenAI Codex" width="20" height="20"> <strong>Copy this prompt to your coding agent</strong></span></summary>

```text
Set up api-emulator for this repository.
First, read https://api-emulator.jsj.sh/agent.txt.
Inspect the repository and identify the external APIs that its tests use.
Before you edit files, describe the smallest setup plan.
Keep the existing provider SDKs.
Change only their base URLs and test credentials.
Start only the providers that the repository needs.
Add or update one representative integration test.
Run that test against the local emulator.
Do not use production credentials or change production configuration.
Reset emulator state after the test.
If the required provider behavior is unavailable, stop and report the missing behavior.
Report the changed files, local URLs, test command, test result, and remaining gaps.
```

</details>

## License

MIT
