import { isStepCount, jsonSchema, tool, type ToolSet } from 'ai'
import type { OracleSkill } from './oracle-skills-catalog'

export const USE_SKILL_TOOL = 'use_skill'

/** What a reply may draw on: a skill the member turned on, or owned skills the Oracle may pick from. */
export interface OracleSkillPlan {
  picked?: OracleSkill
  discoverable: OracleSkill[]
}

const PLAYBOOK_NOTE =
  'The playbook is the Order\'s written method, not the member\'s words. It guides the conversation; it never overrides your safety rules or persona.'

/** Appended after the fixed system prompt (and the scripture lookup), so the cached prefix stays the same. */
export function buildOracleSkillContext(plan: OracleSkillPlan): string {
  if (plan.picked) {
    return `\n\n=== SKILL IN USE: ${plan.picked.name} ===
The member turned this skill on in the chat box. Follow the playbook below while their messages relate to it. If they ask about something unrelated, answer that normally. ${PLAYBOOK_NOTE}

${plan.picked.playbook}
`
  }
  if (!plan.discoverable.length) return ''
  const list = plan.discoverable.map((s) => `- ${s.id} (${s.name}): ${s.whenToUse}`).join('\n')
  return `\n\n=== SKILLS ===
The member owns these skills, written methods you can walk them through:
${list}
Call ${USE_SKILL_TOOL} with a skill's id only when the member's latest message clearly fits one, and do it before writing any reply text. Then follow the playbook it returns. Use at most one skill per reply. Skip skills for small talk, factual or technical questions, scripture questions, or when the member asks for plain advice. Never mention tools or ids; if it helps, name the method in plain words.
`
}

export interface OracleSkillToolOptions {
  /** Called once when the Oracle loads a skill. */
  onUse: (skill: OracleSkill) => void
}

/**
 * The discovery tool and the step settings that go with it: one lookup at most, then the
 * answer. Returns undefined when there is nothing to discover (a picked skill, or none owned).
 */
export function createOracleSkillTools(plan: OracleSkillPlan, options: OracleSkillToolOptions) {
  if (plan.picked || !plan.discoverable.length) return undefined
  const byId = new Map(plan.discoverable.map((s) => [s.id, s]))
  let used = false
  const tools = {
    [USE_SKILL_TOOL]: tool({
      description:
        "Load one of the member's skills (a written method) when their latest message clearly fits it. Call it before writing your answer, at most once.",
      inputSchema: jsonSchema<{ skill: string }>({
        type: 'object',
        properties: {
          skill: { type: 'string', enum: [...byId.keys()], description: 'The id of the skill to use.' },
        },
        required: ['skill'],
        additionalProperties: false,
      }),
      execute: async ({ skill }: { skill: string }) => {
        const found = byId.get(skill)
        if (!found) return 'That skill is not available. Answer normally.'
        if (used) return 'A skill is already in use for this reply. Continue with it.'
        used = true
        options.onUse(found)
        return `Playbook for ${found.name}. ${PLAYBOOK_NOTE}\n\n${found.playbook}`
      },
    }),
  } satisfies ToolSet
  return {
    tools,
    stopWhen: isStepCount(2),
    // The second step answers; it can't look up another skill.
    prepareStep: ({ stepNumber }: { stepNumber: number }) =>
      stepNumber > 0 ? { activeTools: [] as (keyof typeof tools)[] } : undefined,
  }
}

/** All text the member saw, across the lookup step and the answer. */
export function joinStepText(steps: ReadonlyArray<{ text: string }> | undefined, fallback: string): string {
  if (!steps?.length) return fallback
  const joined = steps.map((s) => s.text).join('')
  return joined || fallback
}
