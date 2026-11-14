import matter from 'gray-matter'
import {
  ORACLE_SKILL_CATEGORIES,
  ORACLE_SKILL_PRICES,
  type OracleSkillCategory,
  type OracleSkillInfo,
} from '../oracle-skills'

/** A skill with its playbook: the text the Oracle follows. Server only. */
export interface OracleSkill extends OracleSkillInfo {
  playbook: string
}

/** Keep loaded playbooks cheap: about 550 tokens at most. */
export const ORACLE_SKILL_PLAYBOOK_MAX_CHARS = 3_200
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function text(value: unknown, field: string, file: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${file}: "${field}" is required.`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${file}: "${field}" is over ${max} characters.`)
  return trimmed
}

/** Parses one skill file. Throws with the file name when a field is missing or wrong. */
export function parseOracleSkill(source: string, file: string): OracleSkill {
  const { data, content } = matter(source)
  const id = text(data.id, 'id', file, 48)
  if (!ID_PATTERN.test(id)) throw new Error(`${file}: id "${id}" must be lowercase words joined by hyphens.`)
  const category = data.category as OracleSkillCategory
  if (!ORACLE_SKILL_CATEGORIES.includes(category)) {
    throw new Error(`${file}: category must be one of ${ORACLE_SKILL_CATEGORIES.join(', ')}.`)
  }
  const price = Number(data.price)
  if (!(ORACLE_SKILL_PRICES as readonly number[]).includes(price)) {
    throw new Error(`${file}: price must be one of ${ORACLE_SKILL_PRICES.join(', ')}.`)
  }
  const examples = Array.isArray(data.examples) ? data.examples.map((e: unknown) => text(e, 'examples', file, 120)) : []
  if (examples.length < 1 || examples.length > 4) throw new Error(`${file}: give 1 to 4 examples.`)
  const preview = data.preview as { member?: unknown; oracle?: unknown } | undefined
  const playbook = content.trim()
  if (!playbook) throw new Error(`${file}: the playbook body is empty.`)
  if (playbook.length > ORACLE_SKILL_PLAYBOOK_MAX_CHARS) {
    throw new Error(`${file}: the playbook is over ${ORACLE_SKILL_PLAYBOOK_MAX_CHARS} characters.`)
  }
  return {
    id,
    name: text(data.name, 'name', file, 40),
    summary: text(data.summary, 'summary', file, 120),
    whenToUse: text(data.whenToUse, 'whenToUse', file, 200),
    category,
    price,
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 999,
    examples,
    preview: {
      member: text(preview?.member, 'preview.member', file, 200),
      oracle: text(preview?.oracle, 'preview.oracle', file, 320),
    },
    playbook,
  }
}

/** Builds the catalog from file sources. Throws on a duplicate id. */
export function buildOracleSkillCatalog(sources: Record<string, string>): OracleSkill[] {
  const skills = Object.entries(sources).map(([file, source]) => parseOracleSkill(source, file.split('/').pop() ?? file))
  const seen = new Set<string>()
  for (const skill of skills) {
    if (seen.has(skill.id)) throw new Error(`Two skill files use the id "${skill.id}".`)
    seen.add(skill.id)
  }
  return skills.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

// The Markdown is bundled into the server build, so no file reads at runtime.
const SKILL_SOURCES = import.meta.glob('/content/oracle-skills/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const ORACLE_SKILLS: readonly OracleSkill[] = buildOracleSkillCatalog(SKILL_SOURCES)
const BY_ID = new Map(ORACLE_SKILLS.map((skill) => [skill.id, skill]))
export const ORACLE_SKILL_IDS: ReadonlySet<string> = new Set(BY_ID.keys())

export function getOracleSkill(id: string | null | undefined): OracleSkill | undefined {
  return id ? BY_ID.get(id) : undefined
}

/** Card text only, for the browser. */
export function toSkillInfo({ playbook: _playbook, ...info }: OracleSkill): OracleSkillInfo {
  return info
}
