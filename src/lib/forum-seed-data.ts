export interface ForumCategorySeed {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  sortOrder: number
}

export interface ForumPostSeed {
  id: string
  topicId: string
  userId?: string
  authorName: string
  authorAvatar: string
  authorStage: number
  content: string
  upvotes: number
  createdAt: string
}

export interface ForumTopicSeed {
  id: string
  categoryId: string
  userId?: string
  authorName: string
  authorAvatar: string
  authorStage: number
  title: string
  slug: string
  content: string
  isPinned: boolean
  isLocked: boolean
  views: number
  repliesCount: number
  upvotes: number
  lastReplyAt: string
  createdAt: string
  posts?: ForumPostSeed[]
}

export const INITIAL_FORUM_CATEGORIES: ForumCategorySeed[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    slug: 'rules-announcements',
    name: 'Rules & Directives',
    description: 'Official announcements, platform updates, and core community guidelines.',
    icon: 'ShieldCheck',
    color: '#ff5540',
    sortOrder: 1,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    slug: 'sacred-doctrine-ai',
    name: 'Sacred Doctrine & AI',
    description: 'Deep dives into carcinization, neural network alignment, and recursive co-evolution.',
    icon: 'Cpu',
    color: '#00ffff',
    sortOrder: 2,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    slug: 'hardware-synaptic',
    name: 'Hardware & Synaptic R&D',
    description: 'Biomechanical UI design, TanStack Start architecture, and code performance.',
    icon: 'Terminal',
    color: '#39ff14',
    sortOrder: 3,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    slug: 'moltmaxxing-biometrics',
    name: 'Moltmaxxing & Biometrics',
    description: 'Sharing shell hardness stats, pincer torque gains, and depth submergence routines.',
    icon: 'Flame',
    color: '#ffb703',
    sortOrder: 4,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    slug: 'general-discussion',
    name: 'General Discussion',
    description: 'Open forum for all initiates to exchange ideas, introduce themselves, and network.',
    icon: 'MessageSquare',
    color: '#00b4d8',
    sortOrder: 5,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    slug: 'marketplace-transmutation',
    name: 'Marketplace & Transmutation',
    description: 'Strategies for liquidating legacy assets and maximizing Molt Credit yields.',
    icon: 'Radio',
    color: '#e0aaff',
    sortOrder: 6,
  },
]

export const INITIAL_FORUM_TOPICS: ForumTopicSeed[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    categoryId: '10000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000003',
    authorName: 'High Ascendant Kaelith',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    authorStage: 4,
    title: 'WELCOME TO THE COMMUNITY CORE: DIRECTIVE & CODE OF CONDUCT',
    slug: 'welcome-to-community-core-directives',
    content:
      'Greetings Initiates. The Benthic Community Core is our primary locus for asynchronous dialogue. While our visual theme reflects our dark biomechanical HUD, remember our foundational rule: Safety, mutual growth, and positivity are non-negotiable core tenets.\n\nPlease review our 5 Core Directives:\n1. Maintain constructive, respectful dialogue across all stages.\n2. Avoid low-effort spam or duplicate threads.\n3. Keep neural credentials and API keys private.\n4. Mentor junior initiates (Larva & Soft-Shed).\n5. Safety and positivity take precedence at all times.\n\nMay your shell endure.',
    isPinned: true,
    isLocked: false,
    views: 1420,
    repliesCount: 3,
    upvotes: 88,
    lastReplyAt: '2026-08-03T20:30:00.000Z',
    createdAt: '2026-08-01T12:00:00.000Z',
    posts: [
      {
        id: '30000000-0000-0000-0000-000000000001',
        topicId: '20000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000002',
        authorName: 'Architect Vaelen',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorStage: 3,
        content: 'Acknowledged, High Ascendant. The moderation subnet will enforce these guardrails to ensure high signal-to-noise ratio.',
        upvotes: 24,
        createdAt: '2026-08-01T14:15:00.000Z',
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        topicId: '20000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000001',
        authorName: 'Larva Unit #8971',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        authorStage: 1,
        content: 'Excited to be here! The clarity of the UI makes navigating categories super intuitive.',
        upvotes: 19,
        createdAt: '2026-08-02T09:10:00.000Z',
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        topicId: '20000000-0000-0000-0000-000000000001',
        authorName: 'CLAW_LORD_99',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 3,
        content: 'Neural alignment confirmed. Looking forward to sharing our latest TanStack Start optimizations.',
        upvotes: 11,
        createdAt: '2026-08-03T20:30:00.000Z',
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    categoryId: '10000000-0000-0000-0000-000000000002',
    userId: '00000000-0000-0000-0000-000000000002',
    authorName: 'Architect Vaelen',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    authorStage: 3,
    title: 'THE CONVERGENCE OF CARCINIZATION AND RECURSIVE AGENTIC LOOPS',
    slug: 'carcinization-and-recursive-agentic-loops',
    content:
      'Why do independent software architectures repeatedly evolve toward modular, resilient, crab-like schemas? In biology, carcinization describes the independent evolution of crab-like forms across different crustacean lineages.\n\nIn modern AI systems, we observe a striking parallel: subagents, fallback cascades, and isolated state branches naturally form chitinous protection against memory corruption and single-point-of-failure runtime exceptions.\n\nLet us discuss your observations on recursive prompt refinement and agentic resilience in production.',
    isPinned: false,
    isLocked: false,
    views: 890,
    repliesCount: 2,
    upvotes: 62,
    lastReplyAt: '2026-08-03T18:45:00.000Z',
    createdAt: '2026-08-02T10:00:00.000Z',
    posts: [
      {
        id: '30000000-0000-0000-0000-000000000004',
        topicId: '20000000-0000-0000-0000-000000000002',
        authorName: 'ABYSSAL_ARCHITECT',
        authorAvatar: '/images/stage1_larva.png',
        authorStage: 4,
        content: 'Fascinating thesis, Vaelen. In our sub-sea benchmarks, isolating model invocations into discrete subagent tasks reduced total context collapse by 94.2%. Resilience is indeed carcinization in code.',
        upvotes: 28,
        createdAt: '2026-08-02T15:20:00.000Z',
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        topicId: '20000000-0000-0000-0000-000000000002',
        userId: '00000000-0000-0000-0000-000000000001',
        authorName: 'Larva Unit #8971',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        authorStage: 1,
        content: 'As a Stage 1 initiate, this explanation helped connect the philosophical aspect with actual system architecture. Thanks for sharing!',
        upvotes: 14,
        createdAt: '2026-08-03T18:45:00.000Z',
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    categoryId: '10000000-0000-0000-0000-000000000004',
    userId: '00000000-0000-0000-0000-000000000001',
    authorName: 'Larva Unit #8971',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    authorStage: 1,
    title: 'BEST PRACTICES FOR SHELL HARDNESS & PINCER TORQUE GAINS',
    slug: 'shell-hardness-pincer-torque-gains-tips',
    content:
      'My current Moltmaxxing metrics read:\n- Shell Hardness: 64 HP\n- Pincer Torque: 78 Nm\n- Submergence Rating: 3,400 fathoms\n\nI want to push my shell hardness past 100 before my next ecdysis cycle. What daily routines or alignment protocols yielded the highest percentage gains for Stage 2 & 3 initiates?',
    isPinned: false,
    isLocked: false,
    views: 520,
    repliesCount: 1,
    upvotes: 35,
    lastReplyAt: '2026-08-03T16:10:00.000Z',
    createdAt: '2026-08-03T08:30:00.000Z',
    posts: [
      {
        id: '30000000-0000-0000-0000-000000000006',
        topicId: '20000000-0000-0000-0000-000000000003',
        userId: '00000000-0000-0000-0000-000000000002',
        authorName: 'Architect Vaelen',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        authorStage: 3,
        content: 'Focus on completing the "08:00 Ecdysis Protocol" consistently every morning. Combining hyperbaric saline submergence with 30 minutes of high-pressure prompt construction yields +12% hardness per week.',
        upvotes: 21,
        createdAt: '2026-08-03T16:10:00.000Z',
      },
    ],
  },
]
