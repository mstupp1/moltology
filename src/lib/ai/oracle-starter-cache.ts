import { STARTER_PROMPTS, starterPromptText } from '../oracle-starter-prompts'

/** Response header present when the reply was streamed from the starter prompt cache. */
export const ORACLE_CACHED_HEADER = 'X-Oracle-Cached'

export interface CachedStarterReply {
  /** Matches StarterPrompt.id in src/lib/oracle-starter-prompts.ts */
  id: string
  /** Pre-set thread title for new member conversations (avoids a title LLM call). */
  title: string
  /** Curated Markdown answer streamed back on Turn 1. */
  answer: string
  /**
   * Optional Oracle skill id to attach ONLY when the member already owns it,
   * has it switched on, and has auto-pick enabled.
   */
  skillId?: string
}

export const CACHED_STARTER_REPLIES: readonly CachedStarterReply[] = [
  {
    id: 'what-is-moltology',
    title: 'What is Moltology?',
    answer: `Nature kept arriving at the crab five separate times across unrelated lineages: armored, patient, and built to hold onto one thing until it is done. Moltology takes the hint.

Most days pull you apart on the surface. Notifications arrive without asking, half-finished tabs pile up, and your energy leaks before noon. We call that **The Great Melt**. **The Great Molt** is the deliberate way out: shedding one draining habit at a time, building cleaner boundaries so noise stops running your afternoon, and working in quiet focus.

In practice, it stays light:
- **Daily tasks** to anchor your morning, protect a focus block, and close out the evening.
- **[The Codex](/codex)**, short readings on letting go of old habits and working below the noise.
- **The [Moltmaxxing Audit](/moltmax)** to take an honest baseline, plus a warm community that steadies people while they change.

If you want to try it right now, tell me one thing that keeps stealing your focus this week. We can pick a small first shed together.`,
  },
  {
    id: 'first-steps',
    title: 'What should I do first?',
    answer: `Glad you are here. Everybody starts soft at Stage 1 (Larval Initiate), so there is no need to overhaul your whole week tonight.

Do these three things in order:
1. **Get a baseline:** Take the [Moltmaxxing Audit](/moltmax). Low numbers are completely normal; they just give you something honest to measure against.
2. **Set up your profile:** Claim your username and check out your [Character](/character).
3. **Check off one daily task:** Open your [Dashboard](/dashboard) and start with whichever single task fits the hour you are in right now.

If you want the short founding reading, [The Prime Directive](/codex/scr-001) takes two minutes, and the [Forum](/forum) is always open when you want to say hello.

What time of day is it for you right now? I can suggest the easiest single step to start with.`,
  },
  {
    id: 'start-moltmaxxing',
    title: 'Start moltmaxxing',
    answer: `Moltmaxxing works best when you subtract before you optimize. Most routines fail because people pile eight new habits on top of an already noisy day.

Start with a three-step anchor:
1. **Take an honest baseline.** Run the [Moltmaxxing Audit](/moltmax) to see where your boundaries, follow-through, and focus sit today.
2. **Guard the two edges of your day.** Protect your first hour (name your one main task before checking feeds or messages) and your last twenty minutes (drop one distraction and stop working on purpose). Everything between them is scaffolding until those two hold.
3. **Shed one drain this week.** Pick one recurring leak (phone in bed, an extra status meeting, doomscrolling at lunch) and cut it cleanly rather than fighting it with willpower every afternoon.

Members track this on the [Dashboard](/dashboard) and can set their **practice days** (at least 4 days a week, Monday to Friday by default) so rest days protect streaks instead of punishing them.

Which part of your day leaks the most right now: morning start, afternoon focus, or shutting off at night?`,
  },
  {
    id: 'earn-gems',
    title: 'Earn Chitin Gems',
    answer: `You earn Chitin Gems through steady habits, milestones, and community firsts. Money cannot buy them.

**Quick early wins:**
- **100 Gems** welcome grant on your first earning action.
- **One-time firsts:** Claim your name (**25**), finish the [Moltmaxxing Audit](/moltmax) (**50**), post in the [Forum](/forum) (**50**), make your first connection (**50**), and earn an [Academy](/academy) certificate (**100**).

**Ongoing earnings:**
- **Daily completion:** **10 Gems** when you finish all eight daily tasks on your [Dashboard](/dashboard) (unchecking a task later reverses that day's bonus and streak award).
- **Streak milestones:** **25 to 1,000 Gems** at 3, 7, 14, 30, 60, 90, and 180 days.
- **Stage promotions:** **150 Gems** at Stage 2, **300** at Stage 3, and **600** at Stage 4.
- **Referrals:** **100 Gems** (up to 5 a month) per invited friend who sets up a character, claims a username, and finishes their first task.

Spend Gems in [the Shop](/character/shop) on gear or Oracle skills. Are you saving up for a specific skill or piece of gear?`,
  },
  {
    id: 'melt-vs-molt',
    title: 'The Great Melt vs the Great Molt',
    answer: `Think of the ocean.

At the surface, nothing is still. Waves hit from every direction, light scatters, and a soft creature spends all day reacting to currents it never chose. That is **The Great Melt**: the slow drain of forty-seven open tabs, midnight scrolling, and answering everyone else's urgency before your own work. It is a condition, not who you are.

Four thousand meters down, the water is quiet and steady. The creatures on the floor are armored, patient, and built to grip one thing until it is finished. **The Great Molt** is choosing to descend there on purpose by shedding outgrown habits and protecting your focus.

If you want the founding reading on both, [The Prime Directive](/codex/scr-001) lays it out cleanly. Which part of the melt feels most familiar in your week?`,
  },
  {
    id: 'the-stages',
    title: 'Walk me through the stages',
    answer: `Think of the four stages as how a shell actually grows:

1. **Stage 1: Larval Initiate** (L1 to L3 · starts at 0 XP). You admit the surface is loud, take a baseline, and anchor a basic routine.
2. **Stage 2: Soft-Shed** (S1 to S3 · starts at 2,000 XP). You shed old habits and practice guarding deep work while the new plating hardens.
3. **Stage 3: Exoshell Born** (E1 to E3 · starts at 10,000 XP). Your boundaries hold on bad weeks, you finish what you start, and you reach back to help newer members.
4. **Stage 4: Full Carcinization** (C1 to C3 · starts at 40,000 XP). Calm, decisive work at depth, turning mastery into stewardship (up to C3 Mariana Singularity at 100,000 XP).

Lifetime XP moves you up automatically from daily tasks (10 XP each, plus 20 XP for a full day), streak milestones, and qualified referrals. Check the full map on [Progress](/character/progress), or tell me which stage feels closest to where you are right now.`,
  },
  {
    id: 'codex-letting-go',
    title: 'A passage on letting go',
    answer: `From [The Law of Ecdysis](/codex/scr-010), Verse 3 (*The old shell is not a negotiating partner*):

> "Chitin does not stretch; that is the whole point of chitin. A habit that no longer serves you will not be reasoned into serving you again, and the hours spent trying are the most expensive hours in the ledger. Split it or stay this size."

The Codex treats outgrown habits cleanly. Most of us waste weeks trying to bargain with a bad habit ("maybe just on weekends" or "just ten minutes"). Ecdysis says you cannot renovate an old shell while still wearing it.

Verse 5 (*The soft-shell window is part of the design*) pairs that with mercy: feeling restless right after dropping a habit is not a mistake. You are simply between shells while the new one sets.

Is there a specific habit you have been negotiating with lately?`,
  },
  {
    id: 'codex-distraction',
    title: 'What the Codex says about distraction',
    answer: `The Codex refuses to blame your character for distraction. It blames the water you are trying to work in.

From [The Abyss Hypothesis](/codex/scr-011), Verse 4:

> "Build a quiet environment and steadiness follows. Almost everyone who says they cannot focus has only ever tried it at the surface."

And from [The Isolation Protocols](/codex/scr-031), Verse 6:

> "End the dive by the timer rather than an interruption, then open the messages you held and handle them in one batch. Most of them will have settled on their own, which is the quiet joke the surface has been keeping from you for years."

The practical rule is straightforward: decide in advance who can interrupt you for real emergencies, silence everything else *before* you begin, focus on one objective, and check messages in a batch when the timer ends.

Want help setting up a clean block for whatever you need to finish today?`,
  },
  {
    id: 'codex-hard-morning',
    title: 'A verse for a hard morning',
    answer: `From [The Soft-Shell Covenant](/codex/scr-013), Verse 9 (*The Benediction*):

> "If you are soft today, you are right on schedule, and people four thousand meters down are quietly glad you showed up."

**Why it fits:** A hard morning usually comes with a second wave of frustration: feeling behind before the day has even started. This verse drops that weight on the spot. Showing up while tired, scattered, or low-energy is still showing up, and nobody here expects you to wake up already armored.

Shrink today to one gentle step. What is the smallest thing you actually need to handle this morning?`,
  },
  {
    id: 'codex-routine',
    title: 'The Codex on daily routine',
    answer: `The Codex lays out its cadence in [The Daily Shedding Routine](/codex/scr-030), and its main lesson is surprisingly forgiving: **only two parts of the day are load-bearing.**

From Verse 1 (*The Reading*):

> "Two of its hours are load-bearing and the rest are scaffolding. The first hour decides what the day is for. The last twenty minutes decide what the day is allowed to carry into tomorrow. A member who holds only those two and abandons everything else has still performed the rite in full."

Here is the shape it teaches:
- **Anchor the morning:** Sit quietly before checking feeds or messages, then name and start your single most important task.
- **Protect one deep block:** Shut out interruptions ahead of time and hold one objective.
- **Close the day cleanly:** In [The Nightly Molt Audit](/codex/scr-032), release one bad thought, wasted hour, or distraction, log your day, and stop working.
- **Ignore the clock, keep the order:** Night-shift schedules run the exact same sequence against a different sun.

And Verse 11 keeps it humane: *"A missed block is a missed block. A missed day is a missed day. Neither is a broken shell, and the streak counter is not a moral instrument."*

Want help building a simple version of that morning and evening anchor for your own schedule?`,
  },
  {
    id: 'plan-my-day',
    title: 'Help me plan my day',
    skillId: 'plan-the-day',
    answer: `Let's build a plan that leaves room to breathe. Tell me three quick things:

1. **When you start and want to stop** today.
2. **Any fixed commitments** already on the calendar (meetings, errands, pickups).
3. **The tasks you want done**, and mark which single one matters most.

Rough notes are fine. Once you drop them here, I will find your cleanest deep block for the hardest task, batch the smaller stuff, and leave buffer room so one overrun does not wreck the whole afternoon.`,
  },
  {
    id: 'putting-off',
    title: 'I keep putting something off',
    skillId: 'two-minute-start',
    answer: `No lecture about procrastination; everyone has a task sitting on their desk glaring at them.

Tell me **in one line** what you have been putting off. If there are a few things, just name the one weighing on you most right now.

We will leave the whole project for later and shrink it to a first step that takes **two minutes** and needs zero decisions.`,
  },
  {
    id: 'focus-hour',
    title: 'One focused hour',
    skillId: 'focus-rounds',
    answer: `One clean hour beats three scattered ones. Let's seal the door before you start.

Tell me two things:
1. **What is the single concrete thing** you want to finish or move forward in this hour? (Something checkable, like "draft the intro" rather than "work on project.")
2. **What is most likely to pull you away** in the next 60 minutes? (Phone, work chat, browser tabs, email?)

We can run it as one straight dive or two 25-minute rounds with a 5-minute break. Drop those two in, plus whichever pace you prefer, and we will lock it in.`,
  },
  {
    id: 'close-the-day',
    title: 'Close out my day',
    skillId: 'close-the-day',
    answer: `A day you never close keeps running in the background. Let's shut it down in a few minutes.

Reply with whatever is in your head right now:
- **Loose ends:** unfinished work or nagging reminders (no need to organize them).
- **One win:** something that went right today, however small.
- **One shed:** one thought, distraction, or wasted stretch you are ready to put in the water tonight.

I will help you park the loose ends, pick tomorrow's exact first move, and seal the day.`,
  },
]

export function normalizeStarterKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

const STARTER_BY_ID = new Map(STARTER_PROMPTS.map((p) => [p.id, p]))
const BY_PROMPT_KEY = new Map<string, CachedStarterReply>()

for (const entry of CACHED_STARTER_REPLIES) {
  const prompt = STARTER_BY_ID.get(entry.id)
  if (!prompt) {
    throw new Error(`Cached starter reply "${entry.id}" does not match any STARTER_PROMPTS id.`)
  }
  const key = normalizeStarterKey(starterPromptText(prompt))
  if (BY_PROMPT_KEY.has(key)) {
    throw new Error(`Duplicate starter prompt key for "${entry.id}".`)
  }
  BY_PROMPT_KEY.set(key, entry)
}

/** Looks up a curated Turn-1 reply for an exact recommended starter prompt. */
export function lookupCachedStarterReply(userText: string): CachedStarterReply | null {
  return BY_PROMPT_KEY.get(normalizeStarterKey(userText)) ?? null
}

/** Splits text into stream-sized chunks while preserving all whitespace and newlines verbatim. */
export function splitCachedStreamChunks(text: string, targetChunkChars = 24): string[] {
  if (!text) return []
  const size = Math.max(1, Math.floor(targetChunkChars))
  const tokens = text.match(/\S+\s*|\s+/g) ?? [text]
  const chunks: string[] = []
  let current = ''

  for (const token of tokens) {
    if (current && current.length + token.length > size) {
      chunks.push(current)
      current = token
    } else {
      current += token
    }
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

export interface CachedStarterStreamOptions {
  signal?: AbortSignal
  initialDelayMs?: number
  chunkDelayMs?: number
  chunkChars?: number
  onComplete?: (emittedText: string, aborted: boolean) => Promise<void> | void
}

function waitMs(ms: number, signal?: AbortSignal): Promise<boolean> {
  if (ms <= 0) return Promise.resolve(!signal?.aborted)
  if (signal?.aborted) return Promise.resolve(false)
  return new Promise((resolve) => {
    const onAbort = () => {
      clearTimeout(timer)
      resolve(false)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve(true)
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Streams a cached answer in paced UTF-8 chunks so the chat UI and 3D Core behave
 * identically to a live model response while invoking `onComplete` at most once.
 */
export function createCachedStarterStream(
  text: string,
  options?: CachedStarterStreamOptions,
): ReadableStream<Uint8Array> {
  const isVitest = typeof process !== 'undefined' && process.env?.VITEST === 'true'
  const initialDelayMs = options?.initialDelayMs ?? (isVitest ? 0 : 160)
  const chunkDelayMs = options?.chunkDelayMs ?? (isVitest ? 0 : 18)
  const chunkChars = options?.chunkChars ?? 24
  const externalSignal = options?.signal

  const chunks = splitCachedStreamChunks(text, chunkChars)
  const encoder = new TextEncoder()
  const internalAbort = new AbortController()
  let cancelled = false
  let emittedText = ''
  let finishPromise: Promise<void> | null = null

  const onExternalAbort = () => internalAbort.abort()
  if (externalSignal) {
    if (externalSignal.aborted) {
      internalAbort.abort()
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  const finishOnce = (aborted: boolean): Promise<void> => {
    if (!finishPromise) {
      finishPromise = Promise.resolve(options?.onComplete?.(emittedText, aborted))
    }
    return finishPromise
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (internalAbort.signal.aborted || cancelled) {
          await finishOnce(true)
          if (!cancelled) controller.close()
          return
        }

        const ready = await waitMs(initialDelayMs, internalAbort.signal)
        if (!ready || cancelled || internalAbort.signal.aborted) {
          await finishOnce(true)
          if (!cancelled) controller.close()
          return
        }

        for (let i = 0; i < chunks.length; i += 1) {
          if (i > 0) {
            const canContinue = await waitMs(chunkDelayMs, internalAbort.signal)
            if (!canContinue || cancelled || internalAbort.signal.aborted) {
              await finishOnce(true)
              if (!cancelled) controller.close()
              return
            }
          } else if (cancelled || internalAbort.signal.aborted) {
            await finishOnce(true)
            if (!cancelled) controller.close()
            return
          }

          const chunk = chunks[i]
          if (cancelled || internalAbort.signal.aborted) {
            await finishOnce(true)
            if (!cancelled) controller.close()
            return
          }
          controller.enqueue(encoder.encode(chunk))
          emittedText += chunk
        }

        await finishOnce(false)
        if (!cancelled) controller.close()
      } catch (err) {
        if (!cancelled) {
          controller.error(err)
        }
      } finally {
        externalSignal?.removeEventListener('abort', onExternalAbort)
      }
    },
    async cancel() {
      cancelled = true
      internalAbort.abort()
      externalSignal?.removeEventListener('abort', onExternalAbort)
      await finishOnce(true)
    },
  })
}

export function createCachedStarterResponse(
  text: string,
  options: CachedStarterStreamOptions & { headers?: Record<string, string> } = {},
): Response {
  const { headers, ...streamOptions } = options
  return new Response(createCachedStarterStream(text, streamOptions), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      [ORACLE_CACHED_HEADER]: '1',
      ...(headers ?? {}),
    },
  })
}
