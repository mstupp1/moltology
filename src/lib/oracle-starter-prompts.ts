/**
 * Starter prompts for the Oracle's new-chat screen: the catalog and the rules for who sees
 * what. Browser safe. To add or change a prompt, edit STARTER_PROMPTS below; Admin >
 * Starter prompts previews what each kind of visitor gets today.
 *
 * The screen shows four chips: a page prompt first when the chat is open over a page the
 * Oracle can read (a forum thread, an article, a Codex passage...), then one prompt from
 * each group, rotating daily. "More ideas" lists every prompt the visitor can use, by group.
 */

export const STARTER_GROUPS = ['start', 'community', 'codex', 'focus'] as const
export type StarterGroup = (typeof STARTER_GROUPS)[number]

export const STARTER_GROUP_LABELS: Record<StarterGroup, string> = {
  start: 'Start',
  community: 'Community',
  codex: 'Codex',
  focus: 'Focus',
}

export type StarterAudience = 'guest' | 'member' | 'max'

/** Pages that get their own first chip (see parseOraclePage). */
export type StarterPageKind =
  | 'forum-thread'
  | 'forum-board'
  | 'forum'
  | 'news-article'
  | 'news'
  | 'changelog-entry'
  | 'codex'
  | 'academy-course'

/** Things a prompt can need before it shows. */
export type StarterNeed = 'academy-courses'

export interface StarterPrompt {
  /** Stable id, kebab-case. */
  id: string
  /** Chip text. Short. */
  label: string
  /** What gets sent. Defaults to the label. */
  prompt?: string
  /** Group for the daily mix and the "More ideas" tabs. Page prompts have none. */
  group?: StarterGroup
  /** Only on this kind of page, as the first chip. */
  page?: StarterPageKind
  /** Who can see it. Default: everyone. */
  audience?: StarterAudience[]
  /** Always takes its group's daily slot for these visitors (e.g. "What is Moltology?" for guests). */
  always?: StarterAudience[]
  /** 'only' = first 7 days after sign-up; 'skip' = not during them. Default: both. */
  newMember?: 'only' | 'skip'
  needs?: StarterNeed[]
  /** ISO dates (inclusive) for seasonal or launch prompts. */
  from?: string
  until?: string
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  // Start
  { id: 'what-is-moltology', group: 'start', label: 'What is Moltology?', prompt: 'What is Moltology and why should I molt?', always: ['guest'] },
  { id: 'first-steps', group: 'start', label: 'What should I do first?', prompt: "I'm new here. What should I do first?", audience: ['member', 'max'], newMember: 'only' },
  { id: 'start-moltmaxxing', group: 'start', label: 'Start moltmaxxing', prompt: 'How do I start moltmaxxing and optimize my routine?' },
  { id: 'earn-gems', group: 'start', label: 'Earn Chitin Gems', prompt: 'How do I earn Chitin Gems?', audience: ['member', 'max'] },
  { id: 'melt-vs-molt', group: 'start', label: 'The Great Melt vs the Great Molt', prompt: 'Explain the difference between The Great Melt and The Great Molt.' },
  { id: 'the-stages', group: 'start', label: 'Walk me through the stages', prompt: 'Walk me through the stages of the molt, simply.' },

  // Community (uses the site-reading tools)
  { id: 'top-posts-today', group: 'community', label: "Today's top posts", prompt: "What are today's top posts on the forum?" },
  { id: 'hot-this-week', group: 'community', label: "What's hot this week?", prompt: "What's hot on the forum this week?" },
  { id: 'latest-news', group: 'community', label: 'Latest news', prompt: "What's the latest news? Give me the short version." },
  { id: 'what-shipped', group: 'community', label: 'What shipped recently?', prompt: 'What shipped on Moltology recently?' },
  { id: 'forum-focus', group: 'community', label: 'What are members saying about focus?', prompt: 'Find forum posts about focus and tell me what members are saying.' },
  { id: 'academy-courses', group: 'community', label: 'What courses can I take?', prompt: 'What courses does the Academy have?', needs: ['academy-courses'] },

  // Codex
  { id: 'codex-letting-go', group: 'codex', label: 'A passage on letting go', prompt: 'Show me a Codex passage about letting go of old habits.' },
  { id: 'codex-distraction', group: 'codex', label: 'What the Codex says about distraction', prompt: 'What does the Codex say about distraction?' },
  { id: 'codex-hard-morning', group: 'codex', label: 'A verse for a hard morning', prompt: 'Give me one Codex verse for a hard morning, and why it fits.' },
  { id: 'codex-routine', group: 'codex', label: 'The Codex on daily routine', prompt: 'What does the Codex teach about a daily routine?' },

  // Focus
  { id: 'plan-my-day', group: 'focus', label: 'Help me plan my day', prompt: 'Help me plan my day. Ask me what I have going on.' },
  { id: 'putting-off', group: 'focus', label: "I keep putting something off", prompt: "I keep putting something off. Help me start it." },
  { id: 'focus-hour', group: 'focus', label: 'One focused hour', prompt: 'Help me set up one focused hour of work right now.' },
  { id: 'close-the-day', group: 'focus', label: 'Close out my day', prompt: 'Help me close out my day: what went well, what to let go, what is first tomorrow.' },

  // Page prompts (first chip when the chat is open over that page)
  { id: 'page-summarize-thread', page: 'forum-thread', label: 'Summarize this thread', prompt: 'Summarize this thread: the main points and where people agree or disagree.' },
  { id: 'page-board-hot', page: 'forum-board', label: "What's hot on this board?", prompt: "What's hot on this board this week?" },
  { id: 'page-forum-today', page: 'forum', label: "Today's top posts", prompt: "What are today's top posts on the forum?" },
  { id: 'page-tldr-article', page: 'news-article', label: 'TL;DR this article', prompt: 'Give me the TL;DR of this article.' },
  { id: 'page-news-latest', page: 'news', label: 'Catch me up on the news', prompt: "Catch me up on the latest news in a few lines." },
  { id: 'page-changelog-entry', page: 'changelog-entry', label: 'What changed in this update?', prompt: 'What changed in this update, in plain words?' },
  { id: 'page-explain-passage', page: 'codex', label: 'Explain this passage simply', prompt: 'Explain this passage simply and how I could use it today.' },
  { id: 'page-course-fit', page: 'academy-course', label: 'Is this course for me?', prompt: 'Tell me about this course and who it is for.' },
]

/** The visitor the chips are picked for. */
export interface StarterContext {
  audience: StarterAudience
  /** Days since sign-up; leave out when unknown. */
  memberDays?: number
  /** Kind of page open behind the chat. */
  page?: StarterPageKind | null
  /** What the site has right now. Unknown counts as not there. */
  has?: Partial<Record<StarterNeed, boolean>>
  /** Today, YYYY-MM-DD in the visitor's zone. */
  today: string
  /** Varies the daily mix per person (user id, or "guest"). */
  seed: string
}

export const NEW_MEMBER_DAYS = 7
export const STARTER_CHIP_COUNT = 4

/** Whether the visitor can see this prompt today (page prompts need their page). */
export function starterPromptVisible(p: StarterPrompt, ctx: StarterContext): boolean {
  if (p.audience && !p.audience.includes(ctx.audience)) return false
  const isNew = ctx.audience !== 'guest' && ctx.memberDays !== undefined && ctx.memberDays < NEW_MEMBER_DAYS
  if (p.newMember === 'only' && !isNew) return false
  if (p.newMember === 'skip' && isNew) return false
  if (p.needs?.some((need) => !ctx.has?.[need])) return false
  if (p.from && ctx.today < p.from) return false
  if (p.until && ctx.today > p.until) return false
  if (p.page && p.page !== ctx.page) return false
  return true
}

/** Small stable hash, so the daily mix is the same all day for one person. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickOne(list: StarterPrompt[], key: string, skip: Set<string>): StarterPrompt | null {
  const options = list.filter((p) => !skip.has(p.id))
  if (!options.length) return null
  return options[hash(key) % options.length]
}

/**
 * The chips for the new-chat screen: the page prompt (if any), then one per group in a
 * daily rotation. New members get a second "start" prompt in place of "focus".
 */
export function pickStarterChips(ctx: StarterContext, catalog: StarterPrompt[] = STARTER_PROMPTS): StarterPrompt[] {
  const visible = catalog.filter((p) => starterPromptVisible(p, ctx))
  const chips: StarterPrompt[] = []
  const used = new Set<string>()
  const pagePrompt = ctx.page ? visible.find((p) => p.page === ctx.page) : undefined
  if (pagePrompt) {
    chips.push(pagePrompt)
    used.add(pagePrompt.id)
  }
  const isNew = ctx.audience !== 'guest' && ctx.memberDays !== undefined && ctx.memberDays < NEW_MEMBER_DAYS
  const order: StarterGroup[] = isNew ? ['start', 'community', 'start', 'codex'] : ['start', 'community', 'codex', 'focus']
  // A newcomer's own prompts (newMember: 'only') come first in their "start" slot.
  const firstStart = isNew ? visible.find((p) => p.group === 'start' && p.newMember === 'only') : undefined
  for (const [i, group] of order.entries()) {
    if (chips.length >= STARTER_CHIP_COUNT) break
    const inGroup = visible.filter((p) => p.group === group)
    const fixed = (group === 'start' && firstStart) || inGroup.find((p) => p.always?.includes(ctx.audience))
    const pick = fixed && !used.has(fixed.id)
      ? fixed
      : pickOne(inGroup, `${ctx.today}|${ctx.seed}|${group}|${i}`, used)
    if (pick) {
      chips.push(pick)
      used.add(pick.id)
    }
  }
  return chips
}

/** Every prompt the visitor can use, by group, for "More ideas". */
export function starterPromptsByGroup(ctx: StarterContext, catalog: StarterPrompt[] = STARTER_PROMPTS) {
  const visible = catalog.filter((p) => p.group && starterPromptVisible({ ...p, page: undefined }, ctx))
  return STARTER_GROUPS.map((group) => ({
    group,
    label: STARTER_GROUP_LABELS[group],
    prompts: visible.filter((p) => p.group === group),
  })).filter((g) => g.prompts.length > 0)
}

export function starterPromptText(p: Pick<StarterPrompt, 'label' | 'prompt'>): string {
  return p.prompt ?? p.label
}

/** Local YYYY-MM-DD for the daily rotation. */
export function localDay(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** The kind of page behind the chat, from its path. Matches parseOraclePage on the server. */
export function starterPageKind(pathname: string | null | undefined): StarterPageKind | null {
  if (!pathname) return null
  const parts = pathname.split(/[?#]/)[0].split('/').filter(Boolean)
  const [first, second, third] = parts
  if (first === 'forum') {
    if (!second || second === 'leaderboard') return 'forum'
    return third ? 'forum-thread' : 'forum-board'
  }
  if (first === 'news') return second ? 'news-article' : 'news'
  if (first === 'changelog' && second) return 'changelog-entry'
  if (first === 'codex' && second && /^scr-\d{1,4}$/i.test(second)) return 'codex'
  if (first === 'academy' && second === 'courses' && third) return 'academy-course'
  return null
}
