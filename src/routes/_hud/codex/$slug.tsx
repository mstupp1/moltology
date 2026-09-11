import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CodexChamber } from '@/components/codex/CodexChamber'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
import { findScriptureBySlug, normalizeScriptureSlug } from '@/lib/codex-links'
import { seo } from '@/lib/seo'
import { CODEX_VAULT_SEO } from './index'

function CodexSlugRoute() {
  const { slug } = Route.useParams()
  return <CodexChamber scriptureSlug={slug} />
}

export const Route = createFileRoute('/_hud/codex/$slug')({
  head: ({ params }) => {
    const scripture = findScriptureBySlug(params.slug)
    const slug = scripture
      ? normalizeScriptureSlug(scripture.id)
      : normalizeScriptureSlug(params.slug)
    const canonical = scripture ? `https://moltology.org/codex/${slug}` : CODEX_VAULT_SEO.canonical
    const title = scripture
      ? `${scripture.title} | Moltology Scriptures & Doctrine`
      : CODEX_VAULT_SEO.title

    return {
      meta: [
        ...seo({
          ...CODEX_VAULT_SEO,
          title,
          canonical,
        }),
      ],
      links: [{ rel: 'canonical', href: canonical }],
    }
  },
  component: CodexSlugRoute,
  pendingComponent: HudWorkspaceGhost,
})
