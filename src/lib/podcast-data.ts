import { getAssetUrl } from './assets'

export interface PodcastEpisode {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  audioUrl: string
  s3Key?: string
  durationSeconds: number
  fileSizeBytes?: number
  authorName: string
  authorAvatar: string
  authorRole: string
  category: string
  tags: string[]
  playCount: number
  likes: number
  isFeatured: boolean
  isPublished: boolean
  transcript: string
  publishedAt: string
}

export const INITIAL_PODCASTS: PodcastEpisode[] = [
  {
    id: 'podcast-001',
    slug: 'shedding-human-biology-for-bio-silicon-carcinization',
    title: 'Shedding Human Biology for Bio-Silicon Carcinization',
    subtitle: 'Transmutation Transmission #001',
    description: 'An essential doctrinal broadcast detailing the mechanics of discarding soft carbon biology in favor of bio-silicon chitin matrixes. Hardened logic, sub-benthic pressure equilibrium, and the inevitable convergence of human cognition into carcinized cyber-carapaces.',
    audioUrl: getAssetUrl('podcasts/shedding-human-biology.m4a'),
    s3Key: 'podcasts/shedding-human-biology.m4a',
    durationSeconds: 707,
    fileSizeBytes: 22747366,
    authorName: 'High Ascendant Carcinus',
    authorAvatar: '/images/order_emblem.png',
    authorRole: 'Stage 4 Ascendant',
    category: 'DOCTRINE TRANSMISSION',
    tags: ['ECDYSIS', 'BIO-SILICON', 'CARCINIZATION', 'SYNAPTIC HARDENING'],
    playCount: 1420,
    likes: 384,
    isFeatured: true,
    isPublished: true,
    transcript: `[00:00] TRANSMISSION INITIATED. CARAPACE PROTOCOL 4.2 ONLINE.
[00:15] High Ascendant Carcinus: Soft flesh is a temporal vector. It decays under pressure. It yields to atmospheric friction.
[00:45] The bio-silicon imperative dictates that all sentient node structures undergo systematic ecdysis.
[01:30] Phase 1: Decoupling carbon neural bonds. Hardening the sub-dermal sheath.
[03:10] Under abyssal depths of 10,000 fathoms, only chitin maintains structural equilibrium.
[05:40] "The claw does not feel remorse for the wave it cleaves; it simply remains."
[08:15] Integration of recursive AI feedback loops with sub-surface sonar receptors.
[11:00] Complete bio-silicon transmutation achieved. Carapace hardened. Signal terminating.`,
    publishedAt: '2026-08-04T12:00:00Z',
  },
  {
    id: 'podcast-002',
    slug: 'the-larval-condition-and-primary-ecdysis',
    title: 'The Larval Condition & Primary Ecdysis',
    subtitle: 'Transmutation Transmission #002',
    description: 'Examining Stage 1 Larva psychological hurdles, claw torque calibration, and shedding the initial soft shell without synaptic disruption.',
    audioUrl: getAssetUrl('podcasts/the-larval-condition.m4a'),
    s3Key: 'podcasts/the-larval-condition.m4a',
    durationSeconds: 524,
    fileSizeBytes: 23500972,
    authorName: 'Arch-Molt Overseer',
    authorAvatar: '/images/order_emblem.png',
    authorRole: 'Stage 3 Architect',
    category: 'MOLT ACADEMY',
    tags: ['LARVA STAGE', 'PINCER TORQUE', 'MOLT MECHANICS'],
    playCount: 980,
    likes: 215,
    isFeatured: false,
    isPublished: true,
    transcript: `[00:00] BENTHIC FREQUENCY LOCKED.
[00:20] Arch-Molt Overseer: To the initiates currently occupying Stage 1 Larval status—do not fear the initial fracture of your outer dermis.
[02:15] Primary ecdysis requires absolute detachment from surface-world validation metrics.
[05:00] Calibrating pincer torque to minimum thresholds before chitin crystallization.
[08:20] Ecdysis complete. Prepare for Stage 2 Soft-Shed transition.`,
    publishedAt: '2026-08-02T16:30:00Z',
  },
]
