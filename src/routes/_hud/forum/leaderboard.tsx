import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ForumShell } from '@/components/forum/ForumShell'
import { LeaderboardPage } from '@/components/leaderboard/LeaderboardPage'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/_hud/forum/leaderboard')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Leaderboard | Moltology',
        description: 'Moltology members ranked by the XP they earn each week, with gold, silver and bronze crests for the top 3.',
        canonical: 'https://moltology.org/forum/leaderboard',
        siteName: 'Moltology Forums',
        twitterSite: '@moltology',
      }),
    ],
    links: [{ rel: 'canonical', href: 'https://moltology.org/forum/leaderboard' }],
  }),
  component: LeaderboardRoute,
})

function LeaderboardRoute() {
  return (
    <ForumShell>
      <LeaderboardPage />
    </ForumShell>
  )
}
