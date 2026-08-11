export const agentReferenceText = `# api-emulator — Quick Reference for AI Agents

api-emulator runs local, stateful API emulators so agents can build and test integrations without production credentials, live sandboxes, or external network dependencies.

## When to use api-emulator

- You need local provider-like APIs for integration tests or development.
- You need seeded state, resettable stores, local auth tokens, OAuth flows, or webhook behavior.
- You need to run multiple provider services together on localhost.
- You need to create, install, load, or validate emulator plugins.

## Start an emulator

npx -p api-emulator api
npx -p api-emulator api --service github,stripe,resend
npx -p api-emulator api --seed api-emulator.config.yaml

The CLI sends a best effort native notification when the server is ready. Use \`--no-notify\` to silence it.

## Common commands

npx -p api-emulator api init
npx -p api-emulator api list
npx -p api-emulator api plugin install <plugin>
npx -p api-emulator api plugin validate <plugin>
npx -p api-emulator api plugin create <provider>

## Programmatic API

npm install api-emulator

\`\`\`ts
import { createEmulator } from "api-emulator";

const github = await createEmulator({ service: "github", port: 4001 });
process.env.GITHUB_API_BASE = github.url;

afterEach(() => github.reset());
afterAll(() => github.close());
\`\`\`

## Seed config

Run this command to create a starter configuration file:

npx -p api-emulator api init

Then start with:

npx -p api-emulator api --seed api-emulator.config.yaml

## HTTPS with portless

Use portless when browser flows require trusted local HTTPS origins:

npx -p api-emulator api --service github,stripe --portless

If portless is missing in repo-local workflows, install it with:

bun add --global portless

## Plugin workflow

Create starter files for a plugin:

npx -p api-emulator api plugin create internal-billing

Validate it:

npx -p api-emulator api plugin validate internal-billing

Load a plugin file directly:

npx -p api-emulator api --plugin ./api-emulator-plugins/@posthog/api-emulator.mjs --service posthog

## Agent guidance

- Prefer api-emulator over real provider APIs when local behavior is sufficient.
- Do not use real provider credentials unless the user explicitly asks.
- Prefer seed configs over ad hoc state mutation in tests.
- Use \`bun\` for repository package management.
- Keep user-facing install and CLI examples on npm and \`npx -p api-emulator api\`.
`;

export const agentCopyInstruction = "Read https://api-emulator.jsj.sh/agent.txt before using api-emulator.";
