import { writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";
import { stringify as yamlStringify } from "yaml";
import { writeGeneratedFile } from "../generated-manifest.js";
import { DEFAULT_TOKENS, resolvePluginModules } from "../registry.js";

interface InitOptions {
  service: string;
  plugin?: string;
  agents?: string;
  skillsOnly?: boolean;
  yes?: boolean;
  nonInteractive?: boolean;
}

const AGENT_SKILL_DIRS: Record<string, string> = {
  agents: ".agents/skills",
  claude: ".claude/skills",
  codex: ".codex/skills",
  cursor: ".cursor/skills",
  factory: ".agents/skills",
  global: `${homedir()}/.agents/skills`,
  "user-agents": `${homedir()}/.agents/skills`,
  windsurf: ".windsurf/skills",
};

function parseAgentTargets(input?: string, nonInteractive?: boolean): string[] {
  const values =
    input
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  if (values.length > 0) return values;
  return nonInteractive ? ["agents"] : ["agents"];
}

function pluginAuthoringSkill(): string {
  return `---
name: api-emulator-plugin-authoring
description: Create, validate, and install api-emulator provider plugins.
---

# API Emulator Plugin Authoring

Use this skill when adding or validating a provider plugin for api-emulator.

## Workflow

1. Create a provider clone scaffold with \`npx -p api-emulator api clone create <provider>\`.
2. Add provider-shaped routes, deterministic seed state, and manifest fidelity metadata.
3. Run \`npx -p api-emulator api validate-plugin <provider>\`.
4. Run the relevant smoke or test command before calling the plugin done.

## Safety

- Never call production APIs from smoke tests.
- Use dummy credentials and temporary CLI homes.
- Prefer documented base URL overrides before patching SDKs or CLIs.
`;
}

function runtimeSkill(): string {
  return `---
name: api-emulator-runtime
description: Run api-emulator locally with configured provider plugins.
---

# API Emulator Runtime

Use this skill when running local API replacements for development or tests.

## Commands

- \`npx -p api-emulator api list\`
- \`npx -p api-emulator api init\`
- \`npx -p api-emulator api install <plugin>\`
- \`npx -p api-emulator api clone create <provider>\`
- \`npx -p api-emulator api --service <service>\`

Keep seed data deterministic and reset emulator state between tests.
`;
}

function installAgentSkills(options: Pick<InitOptions, "agents" | "yes" | "nonInteractive">): void {
  for (const target of parseAgentTargets(options.agents, options.nonInteractive)) {
    const dir = AGENT_SKILL_DIRS[target];
    if (!dir) {
      throw new Error(`Unknown agent target: ${target}. Available: ${Object.keys(AGENT_SKILL_DIRS).join(", ")}`);
    }
    writeGeneratedFile(`${dir}/api-emulator-plugin-authoring/SKILL.md`, pluginAuthoringSkill(), {
      source: "api init",
      yes: options.yes,
    });
    writeGeneratedFile(`${dir}/api-emulator-runtime/SKILL.md`, runtimeSkill(), {
      source: "api init",
      yes: options.yes,
    });
  }
}

export async function initCommand(options: InitOptions): Promise<void> {
  if (options.agents || options.skillsOnly) {
    installAgentSkills(options);
    console.log("Installed api-emulator agent skills");
  }

  if (options.skillsOnly) return;

  const filename = "api-emulator.config.yaml";
  const fullPath = resolve(filename);

  if (existsSync(fullPath)) {
    console.error(`Config file already exists: ${filename}`);
    process.exit(1);
  }

  const pluginSpecifiers =
    options.plugin
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const pluginModules = await resolvePluginModules(pluginSpecifiers, { includeInstalled: true });
  const availableServices = Object.keys(pluginModules);

  let config: Record<string, unknown>;
  if (options.service === "all") {
    config = { ...DEFAULT_TOKENS };
    for (const name of availableServices) {
      Object.assign(config, pluginModules[name].initConfig);
    }
  } else {
    const pluginModule = pluginModules[options.service];
    if (!pluginModule) {
      console.error(`Unknown service: ${options.service}. Available: ${availableServices.join(", ")}, all`);
      process.exit(1);
    }
    config = { ...DEFAULT_TOKENS, ...pluginModule.initConfig };
  }

  const content = yamlStringify(config);
  writeFileSync(fullPath, content, "utf-8");

  console.log(`Created ${filename}`);
  console.log(`\nRun 'npx -p api-emulator api' to start the emulator.`);
}
