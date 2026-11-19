import React, { useMemo, useState } from 'react'
import { ArrowRight, BookOpenText, ChevronDown, GraduationCap } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { ForumTopicRow } from '@/components/forum/ForumTopicRow'
import { Kicker, formatPostDate } from '@/components/news/NewsStory'
import { formatNewsTitle, type BlogPostData } from '@/lib/blog-data'
import type { ChangelogEntry } from '@/lib/changelogs-data'
import type { AcademyCourseCard } from '@/lib/academy'
import { getAssetUrl } from '@/lib/assets'
import { lazyImageProps } from '@/lib/media-priority'
import { getOracleCardsFn } from '@/lib/server/api'
import type { OracleCardsPayload, OracleCodexCard } from '@/lib/server/oracle-content-source'
import type { ForumTopicEntry } from '@/lib/server/api'
import { authToken, useAppQuery } from '@/lib/query/account'
import { FRESH } from '@/lib/query/content'
import {
  collectCardRefs,
  hasCardRefs,
  oracleReadsLabel,
  oracleReadsLink,
  type OracleCardRefs,
  type OracleReadItem,
} from '@/lib/oracle-reads'

/** Cards shown before "Show more". */
export const ORACLE_CARDS_VISIBLE = 3

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'

type Card =
  | { kind: 'forum'; key: string; topic: ForumTopicEntry }
  | { kind: 'news'; key: string; post: BlogPostData }
  | { kind: 'changelog'; key: string; entry: ChangelogEntry }
  | { kind: 'academy'; key: string; course: AcademyCourseCard }
  | { kind: 'codex'; key: string; passage: OracleCodexCard }

/** The cards in the order the Oracle read them. */
export function orderOracleCards(reads: readonly OracleReadItem[], data: OracleCardsPayload): Card[] {
  const forum = new Map(data.forum.map((t) => [t.slug, t]))
  const news = new Map(data.news.map((p) => [p.slug, p]))
  const changelog = new Map(data.changelog.map((c) => [c.slug, c]))
  const academy = new Map(data.academy.map((c) => [c.slug, c]))
  const codex = new Map(data.codex.map((c) => [c.id, c]))
  const cards: Card[] = []
  const seen = new Set<string>()
  const push = (card: Card | null) => {
    if (!card || seen.has(card.key)) return
    seen.add(card.key)
    cards.push(card)
  }
  for (const item of reads) {
    for (const ref of item.refs ?? []) {
      if (item.kind === 'forum-list' || item.kind === 'forum-thread') {
        const topic = forum.get(ref)
        push(topic ? { kind: 'forum', key: `forum:${ref}`, topic } : null)
      } else if (item.kind === 'news') {
        const post = news.get(ref)
        push(post ? { kind: 'news', key: `news:${ref}`, post } : null)
      } else if (item.kind === 'changelog') {
        const entry = changelog.get(ref)
        push(entry ? { kind: 'changelog', key: `changelog:${ref}`, entry } : null)
      } else if (item.kind === 'academy') {
        const course = academy.get(ref)
        push(course ? { kind: 'academy', key: `academy:${ref}`, course } : null)
      } else {
        const passage = codex.get(ref.split('#')[0].toUpperCase())
        push(passage ? { kind: 'codex', key: `codex:${passage.id}`, passage } : null)
      }
    }
  }
  return cards
}

function NewsCard({ post }: { post: BlogPostData }) {
  const { headline } = formatNewsTitle(post.title)
  return (
    <a
      href={`/news/${post.slug}`}
      className={`group flex gap-3 p-2.5 rounded-card border border-line-subtle bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line transition-colors no-underline ${FOCUS}`}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-[4.5rem] shrink-0 overflow-hidden rounded-control bg-surface-2">
        <img
          src={getAssetUrl(post.coverImageUrl)}
          alt=""
          {...lazyImageProps}
          className="w-full h-full object-cover brightness-90 group-hover:brightness-100 transition"
        />
      </div>
      <div className="min-w-0 flex flex-col gap-1">
        <Kicker category={post.category} />
        <h3 className="font-garamond text-base leading-snug text-ink group-hover:text-cyan-glow transition-colors line-clamp-2">
          {headline}
        </h3>
        <p className="text-2xs text-ink-muted">{formatPostDate(post.publishedAt, 'short')}</p>
      </div>
    </a>
  )
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  return (
    <Link
      to="/changelog/$slug"
      params={{ slug: entry.slug }}
      className={`group block p-3 rounded-card border border-line-subtle bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line transition-colors ${FOCUS}`}
    >
      <span className="flex flex-wrap items-center gap-2 text-2xs">
        <span className="rounded-chip bg-cyan-soft px-2 py-0.5 font-semibold text-cyan-glow">{entry.category}</span>
        {entry.version && <span className="text-ink-muted">{entry.version}</span>}
        <span className="ml-auto text-ink-muted tabular-nums">{formatPostDate(entry.releasedAt, 'short')}</span>
      </span>
      <span className="mt-1.5 block text-sm font-semibold text-ink group-hover:text-cyan-glow leading-snug">{entry.title}</span>
      <span className="mt-1 block text-xs text-ink-muted leading-relaxed line-clamp-2">{entry.summary}</span>
      <span className="mt-1.5 inline-flex items-center gap-1 text-2xs font-semibold text-cyan-glow">
        Read update <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </span>
    </Link>
  )
}

/** A Codex passage on the reader's dark paper. */
function CodexCard({ passage }: { passage: OracleCodexCard }) {
  return (
    <a
      href={passage.href}
      className={`group block p-3.5 rounded-card border no-underline transition-colors ${FOCUS}`}
      style={{ backgroundColor: '#191714', borderColor: '#2e2a24', color: '#e6dfd0' }}
    >
      <span className="eyebrow flex items-center gap-2 opacity-70">
        <BookOpenText className="w-3 h-3" aria-hidden="true" />
        <span>{passage.id}</span>
        {passage.verse && <span>· Verse {passage.verse.verseNumber}</span>}
      </span>
      <span className="mt-1 block font-garamond text-lg leading-snug group-hover:underline underline-offset-4">
        {passage.title}
      </span>
      {passage.verse && (
        <span className="mt-1.5 block font-garamond text-md leading-relaxed opacity-90 line-clamp-4">
          {passage.verse.heading ? <em className="not-italic font-semibold">{passage.verse.heading}. </em> : null}
          {passage.verse.text}
        </span>
      )}
    </a>
  )
}

function AcademyCard({ course }: { course: AcademyCourseCard }) {
  return (
    <Link
      to="/academy/courses/$slug"
      params={{ slug: course.slug }}
      className={`group flex gap-3 p-3 rounded-card border border-line-subtle bg-surface-1 hud-sheen hover:bg-surface-2 hover:border-line transition-colors ${FOCUS}`}
    >
      <GraduationCap className="w-5 h-5 mt-0.5 shrink-0 text-cyan-glow" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-2xs text-ink-muted">
          {course.code ? `${course.code} · ` : ''}{course.category} · {course.lessonCount} lessons
        </span>
        <span className="block text-sm font-semibold text-ink group-hover:text-cyan-glow leading-snug">{course.title}</span>
        {course.subtitle && <span className="block text-xs text-ink-muted line-clamp-2">{course.subtitle}</span>}
      </span>
    </Link>
  )
}

function CardView({ card }: { card: Card }) {
  switch (card.kind) {
    case 'forum':
      return <ForumTopicRow topic={card.topic} />
    case 'news':
      return <NewsCard post={card.post} />
    case 'changelog':
      return <ChangelogCard entry={card.entry} />
    case 'academy':
      return <AcademyCard course={card.course} />
    case 'codex':
      return <CodexCard passage={card.passage} />
  }
}

function refsKey(refs: OracleCardRefs): string[] {
  return [refs.forum, refs.news, refs.changelog, refs.academy, refs.codex].map((list) => list.join(','))
}

/**
 * What the Oracle read for a reply: a short label ("Read 5 forum topics") over the real
 * items as cards, in the app's own styles. Three show at first; the rest fold behind
 * "Show more". Without card data (an older reply, or a failed load) only the label shows.
 */
export function OracleReadCards({ reads, signedIn }: { reads: readonly OracleReadItem[]; signedIn: boolean }) {
  const refs = useMemo(() => collectCardRefs(reads), [reads])
  const wanted = hasCardRefs(refs)
  const { data } = useAppQuery<OracleCardsPayload>({
    queryKey: ['oracle-cards', signedIn, ...refsKey(refs)],
    queryFn: async () => getOracleCardsFn({ data: { ...refs, token: signedIn ? await authToken() : undefined } }),
    enabled: wanted,
    staleTime: FRESH.forum,
  })
  const [expanded, setExpanded] = useState(false)
  const label = oracleReadsLabel(reads)
  const link = oracleReadsLink(reads)
  const cards = data ? orderOracleCards(reads, data) : []
  const visible = expanded ? cards : cards.slice(0, ORACLE_CARDS_VISIBLE)
  const hidden = cards.length - visible.length
  if (!label) return null

  const icon = <BookOpenText className="w-3 h-3 text-cyan-glow" aria-hidden="true" />
  const header = link && cards.length === 0 ? (
    <a href={link.href} title={link.title} className={`flex w-fit items-center gap-1 rounded-chip text-2xs font-medium text-ink-muted hover:text-ink ${FOCUS}`}>
      {icon}
      {label}
    </a>
  ) : (
    <p className="flex w-fit items-center gap-1 text-2xs font-medium text-ink-muted">
      {icon}
      {label}
    </p>
  )

  return (
    <section aria-label={label} className="mt-2 flex flex-col gap-2 not-prose" data-testid="oracle-read-cards">
      {header}
      {visible.length > 0 && (
        <ul className="flex flex-col gap-2">
          {visible.map((card) => (
            <li key={card.key}>
              <CardView card={card} />
            </li>
          ))}
        </ul>
      )}
      {wanted && !data && (
        <div aria-hidden className="h-20 rounded-card border border-line-subtle bg-surface-1 animate-pulse" />
      )}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`flex w-fit items-center gap-1 rounded-control px-2 py-1 -mx-2 text-xs font-semibold text-cyan-glow hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ${FOCUS}`}
        >
          Show {hidden} more <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </section>
  )
}
