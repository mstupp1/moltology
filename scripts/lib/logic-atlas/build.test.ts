import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'
import { anchorKey, resolveTsAnchor } from './anchors'
import { buildAtlas, sourceLink, splitSections } from './build'
import { decisionSchema, domainSchema, type DecisionInput, type DomainInput } from './schema'

const REPO = 'https://github.com/example/repo'

const FILES: Record<string, string> = {
  'src/limits.ts': 'export const LIMIT = 10\nexport function gate(x: number) { return x > LIMIT }\n',
  'src/limits.test.ts': 'test',
}

function domain(id: string, rules: DomainInput['rules'], order = 1): DomainInput {
  return {
    ...domainSchema.parse({ id, title: `${id} domain`, order, color: '#00c3ff', summary: 'A domain summary.', rules }),
    overviewMarkdown: 'Overview **text**.',
    file: `docs/logic/domains/${id}.md`,
  }
}

function rule(id: string, extra: Record<string, unknown> = {}) {
  return { id, title: `Rule ${id}`, kind: 'gate', statement: 'A plain statement of the rule.', ...extra }
}

function decision(id: string, extra: Record<string, unknown> = {}): DecisionInput {
  return {
    ...decisionSchema.parse({
      id,
      date: '2026-09-01',
      title: `Decision ${id}`,
      summary: 'Why this happened.',
      domains: ['alpha'],
      ...extra,
    }),
    bodyMarkdown: '## Context\n\nBefore.\n\n## Decision\n\n- Do `this`.\n',
    file: `docs/logic/decisions/${id}.md`,
  }
}

function read(file: string) {
  return FILES[file] ?? null
}

const [alphaRule1, alphaRule2, betaRule] = [
  rule('alpha.limit', {
    kind: 'limit',
    anchors: [{ file: 'src/limits.ts', symbol: 'LIMIT' }],
    tests: ['src/limits.test.ts'],
  }),
  rule('alpha.gate', {
    dependsOn: ['alpha.limit'],
    anchors: [{ file: 'src/limits.ts', symbol: 'gate' }],
    flow: [
      { id: 'start', label: 'Start', kind: 'start', next: ['check'] },
      { id: 'check', label: 'Over limit?', next: [{ to: 'stop', label: 'yes' }] },
      { id: 'stop', label: 'Stop', kind: 'outcome', tone: 'block' },
    ],
  }),
  rule('beta.uses', { dependsOn: ['alpha.gate'], anchors: [{ file: 'src/gone.ts', symbol: 'X' }] }),
]

describe('buildAtlas', () => {
  it('assembles rules, edges, reverse links, and drift', async () => {
    const limitHash = resolveTsAnchor('src/limits.ts', FILES['src/limits.ts'], 'LIMIT')!.hash
    const { atlas, errors, anchors } = await buildAtlas({
      domains: [domain('alpha', [alphaRule1, alphaRule2]), domain('beta', [betaRule], 2)],
      decisions: [decision('d1', { rules: ['alpha.gate'], sources: [{ pr: 12 }] })],
      readFile: read,
      lock: {
        [anchorKey('alpha.limit', 'src/limits.ts', 'LIMIT')]: limitHash,
        [anchorKey('alpha.gate', 'src/limits.ts', 'gate')]: 'stale-hash',
      },
      repoUrl: REPO,
      syncedAt: '2026-09-24',
    })

    expect(errors).toEqual([])
    expect(atlas.stats).toMatchObject({ domains: 2, rules: 3, decisions: 1, anchors: 3, drifted: 2 })
    expect(atlas.edges).toEqual([
      { id: 'alpha.limit->alpha.gate', source: 'alpha.limit', target: 'alpha.gate', crossDomain: false },
      { id: 'alpha.gate->beta.uses', source: 'alpha.gate', target: 'beta.uses', crossDomain: true },
    ])

    const byId = new Map(atlas.rules.map((item) => [item.id, item]))
    expect(byId.get('alpha.limit')!.usedBy).toEqual(['alpha.gate'])
    expect(byId.get('alpha.gate')!.decisions).toEqual(['d1'])
    expect(anchors.map((row) => row.drift)).toEqual(['ok', 'changed', 'missing'])
    expect(byId.get('alpha.limit')!.anchors[0]).toMatchObject({ line: 1, value: '10', url: `${REPO}/blob/main/src/limits.ts#L1` })
    expect(byId.get('beta.uses')!.drift).toBe('missing')

    const flow = byId.get('alpha.gate')!.flow!
    expect(flow.steps.map((step) => step.id)).toEqual(['start', 'check', 'stop'])
    expect(flow.links.find((link) => link.target === 'stop')?.label).toBe('yes')
    expect(flow.steps[1].position.y).toBeGreaterThan(flow.steps[0].position.y)

    const [alpha, beta] = atlas.domains
    expect(alpha.overviewHtml).toContain('<strong>text</strong>')
    const overlaps =
      alpha.box.x < beta.box.x + beta.box.width &&
      beta.box.x < alpha.box.x + alpha.box.width &&
      alpha.box.y < beta.box.y + beta.box.height &&
      beta.box.y < alpha.box.y + alpha.box.height
    expect(overlaps).toBe(false)
  })

  it('reports broken references without throwing', async () => {
    const { errors } = await buildAtlas({
      domains: [
        domain('alpha', [
          rule('alpha.one', { dependsOn: ['alpha.nope'], tests: ['src/missing.test.ts'] }),
          rule('alpha.one'),
          rule('alpha.flow', { flow: [{ id: 'a', label: 'A', next: ['ghost'] }, { id: 'b', label: 'B' }] }),
        ]),
      ],
      decisions: [decision('d1', { domains: ['nowhere'], rules: ['alpha.ghost'], status: 'superseded' })],
      readFile: read,
      lock: {},
      repoUrl: REPO,
      syncedAt: '2026-09-24',
    })
    expect(errors.join('\n')).toMatch(/duplicate rule id "alpha.one"/)
    expect(errors.join('\n')).toMatch(/depends on unknown rule "alpha.nope"/)
    expect(errors.join('\n')).toMatch(/missing test "src\/missing.test.ts"/)
    expect(errors.join('\n')).toMatch(/unknown step "ghost"/)
    expect(errors.join('\n')).toMatch(/unknown domain "nowhere"/)
    expect(errors.join('\n')).toMatch(/unknown rule "alpha.ghost"/)
    expect(errors.join('\n')).toMatch(/superseded decision needs supersededBy/)
  })
})

describe('decision helpers', () => {
  it('splits sections by ## heading and renders markdown', () => {
    const sections = splitSections('## Context\n\nWhy.\n\n## Alternatives\n\n- One\n- Two\n')
    expect(sections.map((section) => section.heading)).toEqual(['Context', 'Alternatives'])
    expect(sections[1].html).toContain('<li>One</li>')
  })

  it('links every source kind', () => {
    expect(sourceLink({ pr: 155 }, REPO)).toEqual({ kind: 'pr', label: 'PR #155', url: `${REPO}/pull/155` })
    expect(sourceLink({ commit: '605ba42a886a' }, REPO).label).toBe('605ba42')
    expect(sourceLink({ changelog: '2026-09-05-stage-xp' }, REPO).url).toBe(
      `${REPO}/blob/main/content/changelogs/2026-09-05-stage-xp.md`,
    )
    expect(sourceLink({ doc: 'BRAND_BIBLE.md' }, REPO)).toMatchObject({ kind: 'doc', label: 'BRAND_BIBLE.md' })
  })
})

describe('committed atlas content', () => {
  const root = path.resolve(__dirname, '../../..')

  function load(dir: string) {
    return fs
      .readdirSync(path.join(root, dir))
      .filter((name) => name.endsWith('.md'))
      .map((name) => ({ file: `${dir}/${name}`, parsed: matter(fs.readFileSync(path.join(root, dir, name), 'utf8')) }))
  }

  it('parses and cross-references cleanly', async () => {
    const domains = load('docs/logic/domains').map(({ file, parsed }) => ({
      ...domainSchema.parse(parsed.data),
      overviewMarkdown: parsed.content,
      file,
    }))
    const decisions = load('docs/logic/decisions').map(({ file, parsed }) => ({
      ...decisionSchema.parse(parsed.data),
      bodyMarkdown: parsed.content,
      file,
    }))
    // Structure only. Code drift is reported by `npm run logic:check`, not by tests.
    const { errors } = await buildAtlas({
      domains,
      decisions,
      readFile: (file) => {
        const full = path.join(root, file)
        return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null
      },
      lock: {},
      repoUrl: REPO,
      syncedAt: '2026-09-24',
    })
    expect(errors).toEqual([])
  }, 30_000)
})
