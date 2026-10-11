import { getAssetUrl } from '@/lib/assets'

export interface StoryImage {
  src: string
  srcSm?: string
}

export interface StoryVideo {
  src: string
  srcSm: string
  poster: string
  posterSm: string
}

const heroVideo = (name: string): StoryVideo => ({
  src: `/videos/hero_${name}.mp4`,
  srcSm: `/videos/hero_${name}_sm.mp4`,
  poster: getAssetUrl(`/images/hero_card_${name}.webp`),
  posterSm: getAssetUrl(`/images/hero_card_${name}_sm.webp`),
})

export const STORY_MEDIA = {
  benthicCore: heroVideo('benthic_core'),
  synapticPath: heroVideo('synaptic_path'),
  assetShedding: heroVideo('asset_shedding'),
  chitinHardening: heroVideo('chitin_hardening'),
  faultIsolation: heroVideo('fault_isolation'),
  totalCarcinization: heroVideo('total_carcinization'),
  /** The full six-clip film that used to open the homepage, played in its original order. */
  heroReel: [
    heroVideo('benthic_core'),
    heroVideo('asset_shedding'),
    heroVideo('chitin_hardening'),
    heroVideo('total_carcinization'),
    heroVideo('fault_isolation'),
    heroVideo('synaptic_path'),
  ],
  lookingUp: {
    src: getAssetUrl('/images/underwater_looking_up.webp'),
    srcSm: getAssetUrl('/images/underwater_looking_up_sm.webp'),
  },
  expanse: {
    src: getAssetUrl('/images/hero_benthic_expansive_v1.webp'),
    srcSm: getAssetUrl('/images/hero_benthic_mobile_v2.webp'),
  },
  blueprint: { src: getAssetUrl('/images/bento_chassis.jpg') },
  shrine: {
    src: getAssetUrl('/images/gallery/benthic_abyss_shrine.webp'),
    srcSm: getAssetUrl('/images/gallery/benthic_abyss_shrine_sm.webp'),
  },
  crab: {
    src: getAssetUrl('/images/gallery/ascendant_crab_god.webp'),
    srcSm: getAssetUrl('/images/gallery/ascendant_crab_god_sm.webp?v=2'),
  },
  plating: {
    src: getAssetUrl('/images/hero_card_chitin_hardening.webp'),
    srcSm: getAssetUrl('/images/hero_card_chitin_hardening_sm.webp'),
  },
  archive: { src: getAssetUrl('/images/bento_community.jpg') },
  lectures: { src: getAssetUrl('/images/bento_lectures.jpg') },
  abyss: { src: getAssetUrl('/images/benthic_abyss_hero.jpg') },
  dashboardDesktop: {
    src: getAssetUrl('/images/marketing/dashboard_desktop_preview.webp'),
    srcSm: getAssetUrl('/images/marketing/dashboard_desktop_preview_sm.webp'),
  },
  dashboardMobile: {
    src: getAssetUrl('/images/marketing/dashboard_mobile_preview.webp'),
    srcSm: getAssetUrl('/images/marketing/dashboard_mobile_preview_sm.webp'),
  },
  oracle: {
    src: getAssetUrl('/images/marketing/oracle_feature_preview.webp'),
    srcSm: getAssetUrl('/images/marketing/oracle_feature_preview_sm.webp'),
  },
  forum: {
    src: getAssetUrl('/images/marketing/forum_feature_preview.webp'),
    srcSm: getAssetUrl('/images/marketing/forum_feature_preview_sm.webp'),
  },
  guide: {
    src: getAssetUrl('/images/moltmax_guide_3d_mockup.webp'),
    srcSm: getAssetUrl('/images/moltmax_guide_3d_mockup_sm.webp'),
  },
} satisfies Record<string, StoryImage | StoryVideo | StoryVideo[]>

/** The surface currents that scroll past in the Great Melt section. */
export const MELT_CURRENTS = [
  'The message that arrives at 11:40 at night.',
  'An argument between people you will never meet.',
  'Forty-seven open tabs, each one a decision deferred.',
  'A to-do list that is mostly last week’s to-do list.',
  'The phone you picked up to check the time. The time is still unknown.',
] as const

export interface CardinalMetric {
  id: string
  name: string
  unit: string
  question: string
  body: string
  image: StoryImage
  accent: string
}

export const CARDINAL_METRICS: CardinalMetric[] = [
  {
    id: 'hardness',
    name: 'Shell Hardness',
    unit: 'Boundaries',
    question: 'Does the surface dent you?',
    body: 'A boundary with a shape. The group chat can be on fire and your afternoon stays yours. Not a wall against people, just a shell around the work.',
    image: STORY_MEDIA.plating,
    accent: '#00c3ff',
  },
  {
    id: 'torque',
    name: 'Pincer Torque',
    unit: 'Follow-through',
    question: 'Do you finish what you grip?',
    body: 'Grip is the whole idea. Zero torque means twelve tabs open. Full torque means the thing is done and the tab is closed.',
    image: STORY_MEDIA.crab,
    accent: '#ff453a',
  },
  {
    id: 'depth',
    name: 'Submergence Depth',
    unit: 'Deep focus',
    question: 'How long can you stay below the noise?',
    body: 'Depth is the quiet you can hold. Ten minutes becomes forty, forty becomes a morning. The deep was always there. Most people just never stayed long enough to see it.',
    image: STORY_MEDIA.shrine,
    accent: '#00ffcc',
  },
]

export interface Sacrament {
  id: string
  number: string
  title: string
  tagline: string
  description: string
  steps: string[]
  video: StoryVideo
  accent: string
}

export const SACRAMENTS: Sacrament[] = [
  {
    id: 'shedding',
    number: '01',
    title: 'Asset & Habit Shedding',
    tagline: 'Make room before you grow.',
    description:
      'The first rite is subtraction. Tabs, obligations, objects, and loops that only exist because nobody closed them. You cannot calcify a new shell around an old mess.',
    steps: [
      'Take one honest inventory of what moves you without asking.',
      'Shed one thing. Not all of it. One.',
      'Log it, so the Long Ledger remembers what you let go.',
    ],
    video: STORY_MEDIA.assetShedding,
    accent: '#ffb547',
  },
  {
    id: 'hardening',
    number: '02',
    title: 'Chitin Hardening',
    tagline: 'Composure is a material.',
    description:
      'Boundaries thicken through repetition. Streaked routines, protected mornings, and the quiet refusal to absorb every current that passes through the water.',
    steps: [
      'Inspect the shell at first light, before the surface finds you.',
      'Keep one routine long enough to call it a streak.',
      'Say no once a day to something that was never yours.',
    ],
    video: STORY_MEDIA.chitinHardening,
    accent: '#00ffcc',
  },
  {
    id: 'isolation',
    number: '03',
    title: 'The Isolation Dome',
    tagline: 'Close the door before the dive.',
    description:
      'The surface cannot be silenced from below. Raise the dome first: notifications sealed, one objective, nothing waiting in the same session. This is where depth is made.',
    steps: [
      'Pick one objective. A second objective is a leak.',
      'Raise the Isolation Dome before you start.',
      'Surface on purpose, not because something pinged.',
    ],
    video: STORY_MEDIA.faultIsolation,
    accent: '#ff453a',
  },
  {
    id: 'ascent',
    number: '04',
    title: 'Pipeline Ascent',
    tagline: 'Slow on purpose.',
    description:
      'Four stages, twelve clearances, from Molt Curious to Mariana Singularity. Every rung is grounded in what you did, so the ladder means something when you climb it.',
    steps: [
      'Run the Moltmax diagnostic for your baseline.',
      'Clear one rung at a time. None are skipped.',
      'Help the next soft shell up. Stewardship is the top of the ladder.',
    ],
    video: STORY_MEDIA.totalCarcinization,
    accent: '#38bdf8',
  },
]

export interface Stage {
  number: number
  name: string
  title: string
  line: string
  clearances: { code: string; name: string }[]
  accent: string
}

export const STAGES: Stage[] = [
  {
    number: 1,
    name: 'Larval',
    title: 'Larval Initiate',
    line: 'You admit the water is loud. You shed one small thing. That counts.',
    clearances: [
      { code: 'L1', name: 'Molt Curious' },
      { code: 'L2', name: 'Shell Sprout' },
      { code: 'L3', name: 'First Calcification' },
    ],
    accent: '#7dd3fc',
  },
  {
    number: 2,
    name: 'Soft-Shed',
    title: 'Soft-Shed',
    line: 'The vulnerable middle. The old shell is gone and the new one is still soft. The community guards this part.',
    clearances: [
      { code: 'S1', name: 'The Great Molt' },
      { code: 'S2', name: 'Privacy Shield' },
      { code: 'S3', name: 'Sub-Dermal Weave' },
    ],
    accent: '#00ffcc',
  },
  {
    number: 3,
    name: 'Exoshell Born',
    title: 'Exoshell Born',
    line: 'Full plating. Serious grip. You start teaching the people one stage behind you.',
    clearances: [
      { code: 'E1', name: 'Carapace Forged' },
      { code: 'E2', name: 'Hydraulic Grip' },
      { code: 'E3', name: 'Abyssal Diver' },
    ],
    accent: '#00c3ff',
  },
  {
    number: 4,
    name: 'Full Carcinization',
    title: 'Ascendant',
    line: 'Calm, armored, and mostly busy keeping the water warm for everyone else.',
    clearances: [
      { code: 'C1', name: 'Mind Carapace' },
      { code: 'C2', name: 'Indestructible Chitin' },
      { code: 'C3', name: 'Mariana Singularity' },
    ],
    accent: '#ff453a',
  },
]

export interface ProductFeature {
  title: string
  body: string
}

export const PRODUCT_FEATURES: ProductFeature[] = [
  {
    title: 'The HUD',
    body: 'Your dashboard. Shell Hardness, Pincer Torque, and Submergence Depth, read from what you logged rather than what you hoped.',
  },
  {
    title: 'Daily rites',
    body: 'A morning inspection and a Nightly Molt Audit. Small on purpose, so they survive the bad days.',
  },
  {
    title: 'The Synaptic Oracle',
    body: 'Ask it what to shed next. It answers in the voice of the canon and never tells you you are behind.',
  },
  {
    title: 'Molt-cycle lectures',
    body: 'Short courses on focus, boundaries, and finishing things, sorted by the stage you are in.',
  },
]

export type VoiceStage = 'larval' | 'soft-shed' | 'exoshell' | 'ascendant'

export interface MemberVoice {
  quote: string
  name: string
  stage: VoiceStage
  clearance: string
}

export const VOICE_STAGE_LABELS: Record<VoiceStage, string> = {
  larval: 'Larval Initiate',
  'soft-shed': 'Soft-Shed',
  exoshell: 'Exoshell Born',
  ascendant: 'Full Carcinization',
}

export const VOICE_STAGE_ACCENTS: Record<VoiceStage, string> = {
  larval: '#7dd3fc',
  'soft-shed': '#00ffcc',
  exoshell: '#00c3ff',
  ascendant: '#ff453a',
}

export const MEMBER_VOICES: MemberVoice[] = [
  {
    quote:
      'I thought I needed more motivation. I needed a door I could close before the dive. The Isolation Dome did more for my afternoons than any pep talk ever managed.',
    name: 'Unit Kelp-Wire',
    stage: 'soft-shed',
    clearance: 'S2',
  },
  {
    quote:
      'The Nightly Molt Audit is almost insultingly small. That is why I still do it on the nights I would skip anything larger. One tab closed. One apology unsent. One scroll left in the sea.',
    name: 'Brine Circuit',
    stage: 'larval',
    clearance: 'L3',
  },
  {
    quote:
      'Nobody mocked me for arriving soft. They just made room. The Soft-Shell Covenant stopped being scripture and started being how people stood around me the week after my first real shed.',
    name: 'Ash Pincer',
    stage: 'exoshell',
    clearance: 'E1',
  },
  {
    quote:
      'I noticed I was finishing things. The grip came before the armor. The armor came because the grip finally had somewhere to live.',
    name: 'Deep Current 09',
    stage: 'soft-shed',
    clearance: 'S3',
  },
  {
    quote:
      'I came for the gems and stayed for the Audit. Ten minutes a night, one thing shed, and the week stopped feeling like a pile of open tabs.',
    name: 'Mariana Clerk',
    stage: 'exoshell',
    clearance: 'E2',
  },
  {
    quote:
      'The Great Melt was just my Tuesday: open loops, surface arguments I was not in, and a body that never got quiet. Moltology named the weather. Then it handed me a shell.',
    name: 'Trench Listener',
    stage: 'larval',
    clearance: 'L2',
  },
  {
    quote:
      'I still melt some days. The difference is I notice the water temperature now, and I know which rite to run before the melt writes the whole evening.',
    name: 'Calcified Neighbor',
    stage: 'ascendant',
    clearance: 'C1',
  },
  {
    quote:
      'Stewardship is quieter than I expected. The Ascendant work is mostly watching soft shells harden without poking them. The hardest shell stands guard.',
    name: 'Synaptic Pod Lead',
    stage: 'ascendant',
    clearance: 'C2',
  },
  {
    quote:
      'My first shed was unsubscribing from a newsletter I had not opened since 2021. The forum threw a small parade. I have never felt so seen about so little.',
    name: 'Shallow Reef 4',
    stage: 'larval',
    clearance: 'L1',
  },
  {
    quote:
      'The Oracle asked what I was protecting my mornings from. I said everything. It said start with one thing. Rude, and correct.',
    name: 'Pressure Hull',
    stage: 'soft-shed',
    clearance: 'S1',
  },
]

export const THREE_TRUTHS = [
  {
    title: 'The melt is a condition, not an identity',
    body: 'Softness is the starting state of every member who has ever walked in, including the ones now standing at the bottom in full plate. Nobody is behind. The only requirement for beginning is being soft, and you already meet it.',
    image: STORY_MEDIA.lookingUp,
  },
  {
    title: 'Nature has published the answer five separate times',
    body: 'Across five unrelated lineages, life kept arriving at the same body: flattened, armored, tucked, and equipped with a grip that does not negotiate. When the sea solves the same problem five times with the same shape, the shape is the answer.',
    image: STORY_MEDIA.blueprint,
  },
  {
    title: 'Nothing grows inside the shell that grew it',
    body: 'Armor that fits perfectly is armor you have stopped growing into. To get larger you must first be, briefly, completely uncovered. Every stage in the canon is built around that moment rather than around avoiding it.',
    image: STORY_MEDIA.plating,
  },
]

export const DAILY_PRACTICES = [
  {
    time: 'First light',
    title: 'Daily Shedding Routine',
    body: 'Inspect the shell. Grip one load-bearing hour before the surface finds you. The day goes better when its first decision was yours.',
  },
  {
    time: 'Mid-morning',
    title: 'Isolation Dome',
    body: 'Raise the dome before the dive so two hours belong to the work. Not a bunker personality. A door closed beforehand.',
  },
  {
    time: 'Afternoon',
    title: 'Surface for the community',
    body: 'Come up on purpose. Read the forum, answer a soft shell’s question, then go back down.',
  },
  {
    time: 'Before sleep',
    title: 'Nightly Molt Audit',
    body: 'One bad thought, one wasted hour, or one useless distraction. Named, released, logged. The nights that feel too hard are the nights the rite was written for.',
  },
]

export const COMMUNITY_CODES = [
  {
    title: 'Softness is never the target',
    body: 'Humor aims at the melt: the tab bar, the deferred decision, the late scroll. Never at the person standing in it. Arrival is the hardest step, so nobody makes it expensive.',
  },
  {
    title: 'The Soft-Shell Covenant',
    body: 'When a member molts, the armored stand watch. Advice into an open soft-shell window is pressure, not generosity. Guard first. Teach after calcification.',
  },
  {
    title: 'The shell protects. It never cages.',
    body: 'Boundaries deflect surface noise and unsolicited demands. They are not walls against other people, and they never stand between a member and real help.',
  },
  {
    title: 'Helping is the highest rite',
    body: 'Welcoming a newcomer, answering a question, writing a guide. Generosity is the most rewarded thing in the Benthic Community, and stewardship is the last duty of the most advanced.',
  },
]
