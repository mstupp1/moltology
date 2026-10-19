import { createFileRoute } from '@tanstack/react-router'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { seo } from '@/lib/seo'

export const CODEX_VAULT_SEO = {
  title: 'The Sacred Codex | Moltology Scriptures & Doctrine',
  description:
    'Read the official liturgical scriptures, ecdysis directives, and benthic ascendance formulas of Moltology.',
  keywords:
    'Sacred Codex, Moltology Scriptures, Ecdysis Directives, Benthic Ascension, Carcinization Liturgy',
  canonical: 'https://moltology.org/codex',
  siteName: 'Moltology Codex',
  twitterSite: '@moltology',
} as const

export const Route = createFileRoute('/_hud/codex/')({
  head: () => ({
    meta: [...seo(CODEX_VAULT_SEO)],
    links: [{ rel: 'canonical', href: CODEX_VAULT_SEO.canonical }],
  }),
  // The reader lives in ./route.tsx so it stays mounted while the address changes.
  component: () => null,
  pendingComponent: HudWorkspaceGhost,
})
