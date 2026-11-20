import { createFileRoute, redirect } from '@tanstack/react-router'
import { parseLogicAtlasSearch } from '@/lib/logic-atlas/search'

// The Logic Atlas is now the Logic Atlas tab of /admin. This keeps saved /admin/logic links
// working, including their rule or decision (the old `tab=map|timeline` is now `view`).
export const Route = createFileRoute('/_hud/admin/logic')({
  beforeLoad: ({ search }) => {
    const raw = search as Record<string, unknown>
    throw redirect({
      to: '/admin',
      search: { tab: 'logic', ...parseLogicAtlasSearch({ ...raw, view: raw.view ?? raw.tab }) },
      replace: true,
    })
  },
})
