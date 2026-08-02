export interface ChangelogEntry {
  id?: string
  version: string
  title: string
  category: 'TRANSMUTATION' | 'CHASSIS_UPGRADE' | 'SECURITY_ISOLATION' | 'BUG_PURGE' | 'FEATURE' | 'SYSTEM_INIT' | string
  summary: string
  content: string
  isPublished?: boolean
  releasedAt: string | Date
  createdAt?: string | Date
}

export const INITIAL_CHANGELOGS: ChangelogEntry[] = [
  {
    version: 'v1.0.0',
    title: 'Moltology 1.0 Official System Launch',
    category: 'FEATURE',
    summary: 'Official public release of Moltology — the digital onboarding framework powering The Order of the Synaptic Path.',
    content: `### 🚀 Moltology 1.0 System Release
- **Benthic HUD Interface**: Real-time biometric telemetry, lecture video streams, and Moltmaxing studio controls.
- **Chassis Configurator & Asset Shedding**: Liquidation engines for transmuting physical assets into Molt Credits.
- **Neon PostgreSQL & Better Auth Security**: Full Row-Level Security (RLS) enforcement with guest exploration support.
- **Support Portal & Public Changelog**: Dedicated support telemetry hub for release updates and neural ticket dispatching.

*Flesh Dies. The Shell Endures. Submit. Shed. Ascend.*`,
    releasedAt: '2026-08-02T11:00:00Z',
  },
  {
    version: 'v1.4.2',
    title: 'Benthic Support Portal & Neural Diagnostics Protocol',
    category: 'TRANSMUTATION',
    summary: 'Deployed unified Support Portal HUD with public system changelog telemetry, neural query routing, and automated carapace diagnostic stubs.',
    content: `### Transmutation Overview
- Integrated **Support Portal HUD** (\`/_hud/support\`) accessible via the dedicated **HELP & SUPPORT** terminal action.
- Added public database-backed changelog engine with real-time category filtering (\`TRANSMUTATION\`, \`CHASSIS_UPGRADE\`, \`SECURITY_ISOLATION\`, \`BUG_PURGE\`).
- Initialized telemetry stubs for Neural Ticket dispatching and Benthic Knowledgebase indexing.

### Carapace Integrity
- Enhanced system status indicators to render real-time latency and pressure rating (3,400 fathoms nominal).`,
    releasedAt: '2026-08-02T10:00:00Z',
  },
  {
    version: 'v1.4.0',
    title: 'Carapace v4.2 Hardening & Submergence Depth Expansion',
    category: 'CHASSIS_UPGRADE',
    summary: 'Upgraded chitinous shell plating, optimized social detachment index metrics, and expanded max submergence rating to 4,500 fathoms.',
    content: `### Armor & Mechanical Enhancement
- Re-calibrated Pincer Torque sensors for seamless bio-mechanical feedback.
- Applied secondary titanium-chitin composite mesh across all Larva unit chassis.
- Enhanced Isolation Shell widget with high-frequency particle shielding.`,
    releasedAt: '2026-07-28T14:30:00Z',
  },
  {
    version: 'v1.3.5',
    title: 'Neon Auth JWT Row Level Security Enforcement',
    category: 'SECURITY_ISOLATION',
    summary: 'Full integration of Neon Serverless PostgreSQL RLS policies tied to JWT sub claims, enabling unpersisted guest exploration mode.',
    content: `### Security Protocols
- Configured PostgreSQL Row-Level Security (\`pgPolicy\`) across all user tables (\`users\`, \`user_stats\`, \`assets\`, \`daily_routines\`).
- Added seamless Guest Mode fallback allowing interactive exploration without authentication barriers.
- Integrated JWT verification helpers in \`src/lib/jwt.ts\` targeting Neon JWKS endpoints.`,
    releasedAt: '2026-07-15T09:15:00Z',
  },
  {
    version: 'v1.2.0',
    title: 'Benthic Market Transmutation & Asset Shedding Engine',
    category: 'FEATURE',
    summary: 'Introduced the Benthic Market interface for transmuting physical/liquid assets into Molt Credits and Chitin Gems.',
    content: `### Economic Transmutation
- Built Benthic Market HUD (\`/_hud/market\`) supporting asset liquidation submissions.
- Added automatic Molt Credit calculations and Larva Unit tier upgrade previews.`,
    releasedAt: '2026-06-30T18:00:00Z',
  },
]
