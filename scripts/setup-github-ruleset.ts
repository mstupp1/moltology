import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

interface ExistingRuleset {
  id: number;
  name: string;
  target: string;
  enforcement: string;
}

function runGh(command: string): string {
  try {
    return execSync(`gh ${command}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error: any) {
    const stderr = error.stderr?.toString() || error.message;
    throw new Error(`GitHub CLI command failed (gh ${command}):\n${stderr}`);
  }
}

async function main() {
  console.log('🦀 Moltology GitHub Ruleset Deployment');
  console.log('====================================');

  const configPath = resolve(process.cwd(), '.github/rulesets/main-branch-protection.json');
  if (!existsSync(configPath)) {
    throw new Error(`Ruleset config not found at: ${configPath}`);
  }

  const rawConfig = readFileSync(configPath, 'utf8');
  const rulesetConfig = JSON.parse(rawConfig);
  const targetRulesetName = rulesetConfig.name;

  console.log(`Checking existing rulesets for repository mstupp1/moltology...`);
  const existingRulesetsRaw = runGh('api repos/mstupp1/moltology/rulesets');
  const existingRulesets: ExistingRuleset[] = JSON.parse(existingRulesetsRaw);

  const matched = existingRulesets.find((r) => r.name === targetRulesetName);

  let responseRaw: string;
  if (matched) {
    console.log(`Found existing ruleset "${matched.name}" (ID: ${matched.id}). Updating...`);
    responseRaw = runGh(
      `api --method PUT repos/mstupp1/moltology/rulesets/${matched.id} --input "${configPath}"`
    );
    console.log(`✓ Ruleset ID ${matched.id} successfully updated!`);
  } else {
    console.log(`Creating new ruleset "${targetRulesetName}"...`);
    responseRaw = runGh(
      `api --method POST repos/mstupp1/moltology/rulesets --input "${configPath}"`
    );
    console.log(`✓ Ruleset successfully created!`);
  }

  const result = JSON.parse(responseRaw);
  console.log('\n--- Active Ruleset Summary ---');
  console.log(`ID:           ${result.id}`);
  console.log(`Name:         ${result.name}`);
  console.log(`Target:       ${result.target}`);
  console.log(`Enforcement:  ${result.enforcement}`);
  console.log(`Rules Count:  ${result.rules?.length ?? 0}`);
  if (result.rules?.length) {
    result.rules.forEach((rule: any, i: number) => {
      console.log(`  ${i + 1}. Type: ${rule.type}`);
    });
  }
  console.log(`Bypass Actors: ${result.bypass_actors?.length ?? 0}`);
  if (result.bypass_actors?.length) {
    result.bypass_actors.forEach((actor: any, i: number) => {
      console.log(`  ${i + 1}. Type: ${actor.actor_type} (ID: ${actor.actor_id}, Mode: ${actor.bypass_mode})`);
    });
  }
  console.log('\nVerify with:');
  console.log('  gh ruleset check main');
  console.log('  gh ruleset list');
}

main().catch((err) => {
  console.error(`\n❌ Error:`, err.message);
  process.exit(1);
});
