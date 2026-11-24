import React, { Suspense, lazy, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, Gamepad2, Play } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { CharacterStill } from '@/components/hud/avatar3d/CharacterStill'
import { HUDSpinner } from '@/components/ui/HUDSpinner'
import { getAssetUrl, getMediaPath } from '@/lib/assets'
import { useHydrated } from '@/hooks/useHydrated'
import { cn } from '@/lib/utils'
import { ARCADE_GAMES, ARCADE_MIN_REWARD_SCORE, ARCADE_XP_PER_RUN, ARCADE_XP_RUNS_PER_DAY } from '@/lib/arcade'
import { ArcadeBoard, useArcadeBoard } from './ArcadeBoard'
import { usePlayerCharacter } from './usePlayerCharacter'

const LazyRiptideGame = lazy(() => import('./RiptideGame'))

const riptide = ARCADE_GAMES.riptide

/** The arcade's front page: every game, with the player's own character on its card. */
export function ArcadeHome() {
  const player = usePlayerCharacter()
  const board = useArcadeBoard('riptide', 'all', player.userId)
  const yourBest = board.data?.viewerBest ?? null
  const hydrated = useHydrated()
  const [cardArt, setCardArt] = useState(false)
  const [heroArt, setHeroArt] = useState(false)

  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5 font-sans">
      <HudTitlePanel
        treatment="band"
        title="Arcade"
        description="Short games starring your own character. Top scores each week win Chitin Gems."
        hideDescriptionOnPhone
      />

      {/* The arcade hall: art behind a short welcome. Plain dark ground until the art arrives. */}
      <section aria-label="Welcome" className="relative overflow-hidden rounded-card border border-line-subtle bg-surface-1">
        {hydrated && (
          <img
            src={getAssetUrl('images/arcade/v1/arcade-hero.jpg')}
            alt=""
            className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', heroArt ? 'opacity-100' : 'opacity-0')}
            onLoad={() => setHeroArt(true)}
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-abyss/85 via-abyss/40 to-transparent" />
        <div className="relative flex min-h-36 sm:min-h-52 lg:min-h-60 flex-col justify-end gap-1 p-4 sm:p-5 lg:p-6">
          <p className="font-grotesk text-xl sm:text-2xl font-semibold tracking-tight text-ink">Your character, in every game</p>
          <p className="max-w-md text-sm text-ink-body">Whatever you wear in Customize comes with you into the water.</p>
        </div>
      </section>

      <section
        aria-label="Riptide"
        className="relative overflow-hidden rounded-card border border-line-subtle bg-surface-1"
      >
        {hydrated && (
          <img
            src={getMediaPath('images/arcade/v1/riptide-card.jpg')}
            alt=""
            className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-500', cardArt ? 'opacity-100' : 'opacity-0')}
            onLoad={() => setCardArt(true)}
          />
        )}
        {/* Water behind the art (and in place of it until it loads), darker where the words sit. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-abyss/90 via-abyss/55 to-transparent" />
        {/* On phones the words run across the whole picture, so it is dimmed throughout. */}
        <div aria-hidden className="absolute inset-0 bg-abyss/55 sm:hidden" />
        <div className="relative grid gap-2 sm:gap-4 p-4 sm:p-5 lg:p-6 sm:grid-cols-[1fr_auto] items-center">
          <div className="max-w-md space-y-3">
            <p className="eyebrow">New game</p>
            <h2 className="font-grotesk text-2xl font-semibold tracking-tight text-ink">{riptide.title}</h2>
            <p className="text-md text-ink-body">{riptide.tagline}</p>
            <p className="text-sm text-ink-muted">{riptide.howTo}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/arcade/riptide"
                className="inline-flex min-h-10 items-center gap-2 rounded-control bg-cyan-glow px-4 text-ui font-medium text-abyss hover:bg-cyan-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                Play
              </Link>
              {yourBest !== null && <span className="text-sm text-ink-muted tabular-nums">Your best {yourBest}</span>}
            </div>
          </div>
          <div className="relative hidden sm:block w-48 lg:w-56 aspect-square" aria-hidden="true">
            {player.config && <CharacterStill config={player.config} px={512} shot="full" alt="" imgClassName="object-contain" />}
          </div>
        </div>
      </section>

      <div className="grid gap-2 sm:gap-4 lg:gap-5 lg:grid-cols-[1fr_22rem] items-start">
        <section className="rounded-card border border-line-subtle bg-surface-1 p-3 sm:p-4 space-y-2">
          <h2 className="flex items-center gap-2 text-md font-semibold text-ink">
            <Gamepad2 className="w-4 h-4 text-ink-muted" aria-hidden="true" />
            How rewards work
          </h2>
          <ul className="space-y-1.5 text-sm text-ink-body">
            <li>
              A run that scores {ARCADE_MIN_REWARD_SCORE} or more earns {ARCADE_XP_PER_RUN} XP, up to {ARCADE_XP_RUNS_PER_DAY} runs a day.
            </li>
            <li>Each Monday the top 10 of every game's weekly board win Chitin Gems.</li>
            <li>Guests can play every game. Sign up to save your scores and climb the boards.</li>
            <li>Gear changes how your character looks in the water, never how well it scores.</li>
          </ul>
          <p className="pt-1 text-xs text-ink-muted">More games are on the way.</p>
        </section>
        <ArcadeBoard game="riptide" userId={player.userId} />
      </div>
    </div>
  )
}

/** Riptide's own page: the game alone, full screen. Its leaderboard is on the arcade page. */
export function RiptidePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[100050] flex items-center justify-center bg-abyss">
          <HUDSpinner />
        </div>
      }
    >
      <LazyRiptideGame />
    </Suspense>
  )
}
