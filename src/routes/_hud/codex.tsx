import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SacredCodexReader } from '@/components/codex/SacredCodexReader'

function CodexRoute() {
  return <SacredCodexReader />
}

export const Route = createFileRoute('/_hud/codex')({
  component: CodexRoute,
})
