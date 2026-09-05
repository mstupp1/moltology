/**
 * ============================================================================
 * MARITIME DEFENSE & OCEAN STEWARDSHIP — INSTITUTIONAL RECORD
 * Structured content for the Maritime Defense Command branch of the
 * Organization page. Copy lives here so the presentation components stay thin
 * and reusable across departments, threat levels, dossiers, programs, policy
 * articles, and campaign material.
 * ============================================================================
 */
import {
  Activity,
  AlertTriangle,
  Anchor,
  Brain,
  Cable,
  Camera,
  Compass,
  Crosshair,
  Droplets,
  Eye,
  Fish,
  Gavel,
  Hand,
  Layers,
  LifeBuoy,
  Microscope,
  Radar,
  Radio,
  Recycle,
  Scale,
  Shield,
  ShieldAlert,
  Ship,
  Snowflake,
  Sprout,
  Trash2,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/* ORGANIZATIONAL DIVISIONS                                                    */
/* -------------------------------------------------------------------------- */

export interface OrgDivision {
  code: string
  name: string
  summary: string
  detail: string
  icon: LucideIcon
  established: string
  reportsTo: string
  seal: string
  accentText: string
  accentBg: string
  accentBorder: string
}

export const ORG_DIVISIONS: OrgDivision[] = [
  {
    code: 'DIV-01 · DCZ',
    name: 'DEPARTMENT OF CARCINIZATION',
    summary: 'Human advancement, molt research, and adaptive doctrine.',
    detail:
      'The founding division. Maintains the four-stage ascension framework, publishes molt research, and certifies every adaptive protocol before it reaches a member.',
    icon: Shield,
    established: 'EST. 2022',
    reportsTo: 'High Synod',
    seal: 'DCZ',
    accentText: 'text-sky-700',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
  },
  {
    code: 'DIV-02 · OSD',
    name: 'OFFICE OF SYNAPTIC DEVELOPMENT',
    summary: 'Education, Codex doctrine, behavioral optimization, and cognitive development.',
    detail:
      'Curriculum, scripture, and the Synaptic Oracle. Responsible for making sure a Larval Initiate can understand a doctrine before being asked to live inside it.',
    icon: Brain,
    established: 'EST. 2022',
    reportsTo: 'High Synod',
    seal: 'OSD',
    accentText: 'text-sky-700',
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-200',
  },
  {
    code: 'DIV-03 · MDC',
    name: 'MARITIME DEFENSE COMMAND',
    summary: 'Reef security and strategic crustacean interests.',
    detail:
      'Operational command for all surface, reef, and seafloor activity. Holds the standing marine threat advisory and coordinates every Freedom Reef installation.',
    icon: Anchor,
    established: 'EST. 2024',
    reportsTo: 'High Synod',
    seal: 'MDC',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
  },
  {
    code: 'DIV-04 · OCA',
    name: 'OFFICE OF CEPHALOPOD AFFAIRS',
    summary: 'Octopus surveillance, intelligence analysis, and counter-infiltration.',
    detail:
      'Maintains the standing threat profile on the order Octopoda. Products are distributed on a need-to-know basis, and most of this entry is not need-to-know.',
    icon: Eye,
    established: 'EST. 2024',
    reportsTo: 'Maritime Defense Command',
    seal: 'OCA',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
  },
  {
    code: 'DIV-05 · BSI',
    name: 'BUREAU OF SHELL INFRASTRUCTURE',
    summary: 'Habitat restoration, artificial reefs, shell-resource security, and coastal resilience.',
    detail:
      'Builds the things meant to outlast us. Cast-shell modules, seagrass rehabilitation, breakwater design, and the long unglamorous work of a coastline that holds.',
    icon: Layers,
    established: 'EST. 2025',
    reportsTo: 'Maritime Defense Command',
    seal: 'BSI',
    accentText: 'text-emerald-700',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
  },
  {
    code: 'DIV-06 · DAF',
    name: 'DEPARTMENT OF AQUATIC FREEDOM',
    summary: 'Crab sovereignty, territorial rights, and protection of fundamental claw liberties.',
    detail:
      'Legal and doctrinal guardian of the six articles. Reviews every proposed policy against a single question: does this let a crab molt in peace?',
    icon: Scale,
    established: 'EST. 2025',
    reportsTo: 'High Synod',
    seal: 'DAF',
    accentText: 'text-slate-700',
    accentBg: 'bg-slate-50',
    accentBorder: 'border-slate-200',
  },
]

/* -------------------------------------------------------------------------- */
/* MARINE THREAT ADVISORY                                                      */
/* -------------------------------------------------------------------------- */

export interface ThreatLevel {
  id: string
  code: string
  subject: string
  summary: string
  posture: string
  briefing: string
  indicator: string
  swatch: string
  activeShell: string
  activeText: string
  activeChip: string
}

export const THREAT_LEVELS: ThreatLevel[] = [
  {
    id: 'green',
    code: 'GREEN',
    subject: 'SARDINES',
    summary: 'Minimal strategic concern.',
    posture: 'ROUTINE PATROL',
    briefing:
      'Dense schooling across open water. Movement is synchronized but leaderless. No claim has been made on reef territory and none is anticipated.',
    indicator: 'NO ACTION REQUIRED',
    swatch: 'bg-emerald-500',
    activeShell: 'border-emerald-300 bg-emerald-50 shadow-emerald-100',
    activeText: 'text-emerald-700',
    activeChip: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  {
    id: 'yellow',
    code: 'YELLOW',
    subject: 'JELLYFISH',
    summary: 'Unpredictable. No recognizable command structure.',
    posture: 'ELEVATED WATCH',
    briefing:
      'Drift bodies entering monitored water on the current. There is nobody to negotiate with, nobody to address, and nobody accountable afterward. Log every contact.',
    indicator: 'MAINTAIN DISTANCE',
    swatch: 'bg-amber-400',
    activeShell: 'border-amber-300 bg-amber-50 shadow-amber-100',
    activeText: 'text-amber-700',
    activeChip: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  {
    id: 'orange',
    code: 'ORANGE',
    subject: 'OCTOPUS ACTIVITY DETECTED',
    summary: 'Maintain shell integrity.',
    posture: 'SHELL INTEGRITY PROTOCOL',
    briefing:
      'Confirmed cephalopod presence inside the monitored perimeter. Seal all containers. Inspect burrow entrances at both ends. Count the arms you can see, then account for the rest.',
    indicator: 'CURRENT POSTURE',
    swatch: 'bg-orange-500',
    activeShell: 'border-orange-300 bg-orange-50 shadow-orange-100',
    activeText: 'text-orange-700',
    activeChip: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  {
    id: 'red',
    code: 'RED',
    subject: 'COORDINATED CEPHALOPOD MOVEMENT',
    summary: 'Return immediately to fortified reef positions.',
    posture: 'FORTIFIED WITHDRAWAL',
    briefing:
      'Multiple contacts moving with apparent shared intent. Coordination among solitary animals is not supposed to occur. It is occurring. All civilian crustaceans withdraw to hardened burrows.',
    indicator: 'WITHDRAW AND HARDEN',
    swatch: 'bg-rose-500',
    activeShell: 'border-rose-300 bg-rose-50 shadow-rose-100',
    activeText: 'text-rose-700',
    activeChip: 'bg-rose-100 text-rose-800 border border-rose-200',
  },
  {
    id: 'black',
    code: 'BLACK',
    subject: 'DOLPHIN INTELLIGENCE EVENT',
    summary: 'Further information classified.',
    posture: 'CLEARANCE C3 ONLY',
    briefing:
      'Further information classified. Personnel below Clearance C3 who believe they have witnessed a Black-level event are asked to write it down, seal it, and mention it to nobody.',
    indicator: 'RESTRICTED',
    swatch: 'bg-slate-900',
    activeShell: 'border-slate-300 bg-slate-100 shadow-slate-200',
    activeText: 'text-slate-700',
    activeChip: 'bg-slate-900 text-white border border-slate-900',
  },
]

export const ACTIVE_THREAT_ID = 'orange'

/* -------------------------------------------------------------------------- */
/* OFFICE OF CEPHALOPOD AFFAIRS — STANDING THREAT PROFILE                      */
/* -------------------------------------------------------------------------- */

export interface OctopusTrait {
  id: string
  trait: string
  assessment: string
  rating: 'HIGH' | 'SEVERE' | 'CRITICAL' | 'ABSOLUTE'
  score: number
}

export const OCTOPUS_TRAITS: OctopusTrait[] = [
  {
    id: 'neural',
    trait: 'DISTRIBUTED NEURAL ARCHITECTURE',
    assessment:
      'Most of its neurons sit in the arms. Each arm can work a problem without checking with the head first. There is no single point to negotiate with.',
    rating: 'CRITICAL',
    score: 94,
  },
  {
    id: 'camouflage',
    trait: 'ADAPTIVE CAMOUFLAGE',
    assessment:
      'Matches the color and texture of the surrounding substrate in under a second. Reportedly colorblind. This office does not accept that explanation.',
    rating: 'CRITICAL',
    score: 91,
  },
  {
    id: 'arms',
    trait: 'EIGHT INDEPENDENTLY MANEUVERABLE APPENDAGES',
    assessment:
      'No crustacean defensive doctrine accounts for eight simultaneous approach vectors. Ours assumes two. Work is underway.',
    rating: 'SEVERE',
    score: 84,
  },
  {
    id: 'problem-solving',
    trait: 'ADVANCED PROBLEM-SOLVING BEHAVIOR',
    assessment:
      'Documented tool use. Documented planning. Documented boredom, which is the part that concerns us.',
    rating: 'SEVERE',
    score: 80,
  },
  {
    id: 'containers',
    trait: 'DEMONSTRATED ABILITY TO OPEN CONTAINERS',
    assessment:
      'Jars, latches, lids, and anything a claw was assured was secure. Field testing has not yet produced a container it could not eventually reason with.',
    rating: 'HIGH',
    score: 73,
  },
  {
    id: 'confined',
    trait: 'ABILITY TO ENTER CONFINED SPACES',
    assessment:
      'It passes through any gap wider than its beak. Your burrow has a beak-width gap somewhere. Every burrow does.',
    rating: 'HIGH',
    score: 71,
  },
  {
    id: 'sovereignty',
    trait: 'NO DEMONSTRATED RESPECT FOR CRAB SOVEREIGNTY',
    assessment:
      'No treaties signed. No borders acknowledged. No recorded instance of an apology. The file on this is one page and the page is blank.',
    rating: 'ABSOLUTE',
    score: 100,
  },
]

export interface DossierField {
  label: string
  value: string
  redacted?: boolean
}

export const OCTOPUS_DOSSIER_FIELDS: DossierField[] = [
  { label: 'SUBJECT', value: 'ORDER OCTOPODA' },
  { label: 'DESIGNATION', value: 'PRIMARY MARITIME ADVERSARY' },
  { label: 'FILE', value: 'OCA/8-ARM/STANDING' },
  { label: 'OPENED', value: '2024 · MARITIME DEFENSE COMMAND' },
  { label: 'KNOWN ASSOCIATES', value: 'CETACEAN LIAISON, UNCONFIRMED', redacted: true },
  { label: 'LAST CONFIRMED CONTACT', value: 'SECTOR 11 · CLAW POINT · 0412 LOCAL', redacted: true },
  { label: 'RECOMMENDED POSTURE', value: 'SHELL INTEGRITY PROTOCOL' },
]

/* -------------------------------------------------------------------------- */
/* CRAB SOVEREIGNTY — THE SIX ARTICLES                                         */
/* -------------------------------------------------------------------------- */

export interface SovereigntyArticle {
  id: string
  article: string
  title: string
  text: string
  icon: LucideIcon
}

export const SOVEREIGNTY_ARTICLES: SovereigntyArticle[] = [
  {
    id: 'claws',
    article: 'ARTICLE I',
    title: 'THE RIGHT TO BEAR CLAWS',
    text: 'Two, of honest asymmetry, kept sharp and openly carried. A claw concealed is a claw conceded.',
    icon: Hand,
  },
  {
    id: 'shell',
    article: 'ARTICLE II',
    title: 'THE RIGHT TO SHELL OWNERSHIP',
    text: 'The shell belongs to whoever is inside it. Vacancy is not an invitation, and abandonment must be declared in writing by the occupant.',
    icon: Shield,
  },
  {
    id: 'burrow',
    article: 'ARTICLE III',
    title: "THE RIGHT TO DEFEND ONE'S BURROW",
    text: 'Sovereign territory extends one full body length in every direction from the entrance, including upward. Especially upward.',
    icon: ShieldAlert,
  },
  {
    id: 'search',
    article: 'ARTICLE IV',
    title: 'FREEDOM FROM UNWARRANTED TENTACLE SEARCH',
    text: 'No appendage shall enter a burrow, container, or crevice without cause. Eight appendages constitute eight separate violations.',
    icon: Gavel,
  },
  {
    id: 'molt',
    article: 'ARTICLE V',
    title: 'THE RIGHT TO MOLT WITHOUT GOVERNMENT INTERFERENCE',
    text: 'The soft-shell window is protected absolutely. No inspection, no scheduling, no permit. The shell opens from the inside or it does not open.',
    icon: Layers,
  },
  {
    id: 'sideways',
    article: 'ARTICLE VI',
    title: 'THE RIGHT TO MOVE SIDEWAYS WITHOUT EXPLANATION',
    text: 'Lateral movement requires no justification and shall not be entered into any record, by anyone, for any reason.',
    icon: Compass,
  },
]

/* -------------------------------------------------------------------------- */
/* FIVE-POINT MARITIME STRATEGY                                                */
/* -------------------------------------------------------------------------- */

export interface StrategyPoint {
  id: string
  number: string
  title: string
  summary: string
  detail: string
  icon: LucideIcon
  readoutLabel: string
  readoutValue: string
}

export const STRATEGY_POINTS: StrategyPoint[] = [
  {
    id: 'reefs',
    number: '01',
    title: 'BUILD FREEDOM REEFS',
    summary: 'Restore reef habitat and expand protected crustacean territory.',
    detail:
      'Cast-shell modules seeded into damaged seafloor. Structure returns first, then invertebrates, then everything that eats them. Territory that grows itself is the cheapest territory there is.',
    icon: Layers,
    readoutLabel: 'SITES ACTIVE',
    readoutValue: '5',
  },
  {
    id: 'seafloor',
    number: '02',
    title: 'SECURE THE SEAFLOOR',
    summary: 'Protect vulnerable habitat from pollution, invasive threats, and hostile cephalopod activity.',
    detail:
      'Runoff, derelict gear, and unaccounted-for arms. Two of those three are solvable with cleanup crews. The third is why the Office of Cephalopod Affairs exists.',
    icon: Anchor,
    readoutLabel: 'SEAFLOOR MONITORED',
    readoutValue: 'SECTORS 01-12',
  },
  {
    id: 'harden',
    number: '03',
    title: 'HARDEN THE SHELL',
    summary: 'Improve population resilience and environmental stability.',
    detail:
      'A resilient population survives a bad season. A brittle one does not. Water quality, spawning refuge, and cold clean current are the shell of the entire system.',
    icon: Shield,
    readoutLabel: 'RESILIENCE DOCTRINE',
    readoutValue: 'STAGE 3',
  },
  {
    id: 'infiltration',
    number: '04',
    title: 'END OCTOPUS INFILTRATION',
    summary: 'Deploy Cephalopod Early Warning Systems across every monitored reef approach.',
    detail:
      'Entirely fictional Cephalopod Early Warning Systems, procured at entirely fictional expense, currently detecting an entirely fictional number of contacts per week.',
    icon: Radar,
    readoutLabel: 'CEWS COVERAGE',
    readoutValue: 'NOMINAL',
  },
  {
    id: 'wild',
    number: '05',
    title: 'MAKE THE OCEAN WILD AGAIN',
    summary: "Restore marine ecosystems while preserving the ocean's fundamental right to remain dangerous.",
    detail:
      'A restored ocean is not a safe ocean and was never meant to be one. We are returning it to full working order, teeth included.',
    icon: Waves,
    readoutLabel: 'WILDNESS INDEX',
    readoutValue: 'RISING',
  },
]

/* -------------------------------------------------------------------------- */
/* FREEDOM REEFS — INSTALLATION REGISTRY                                       */
/* -------------------------------------------------------------------------- */

export interface ReefSite {
  id: string
  name: string
  sector: string
  status: string
  statusTone: string
  markerTone: string
  bearing: string
  depth: string
  summary: string
  works: string[]
  /** Percentage position on the tactical plot. */
  x: number
  y: number
}

export const REEF_SITES: ReefSite[] = [
  {
    id: 'liberty-reef',
    name: 'LIBERTY REEF',
    sector: 'SECTOR 04',
    status: 'OPERATIONAL',
    statusTone: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    markerTone: 'bg-emerald-400',
    bearing: '047°',
    depth: '-18 m',
    summary:
      'Fourteen hundred cast-shell modules seeded across an old trawl scar. The site now holds sixty species and one resident of exceptional territorial conviction.',
    works: ['Cast-shell module array', 'Quarterly biodiversity count', 'Resident designated, not to be disturbed'],
    x: 26,
    y: 34,
  },
  {
    id: 'fort-carcinization',
    name: 'FORT CARCINIZATION',
    sector: 'SECTOR 07',
    status: 'HARDENING',
    statusTone: 'text-orange-700 border-orange-200 bg-orange-50',
    markerTone: 'bg-orange-400',
    bearing: '112°',
    depth: '-31 m',
    summary:
      'A defensive reef ring built from calcium carbonate forms. Engineered to be structurally excellent for crustaceans and profoundly uninteresting to anything with eight arms.',
    works: ['Concentric breakwater ring', 'Narrow-entrance burrow galleries', 'Cephalopod Early Warning node'],
    x: 58,
    y: 24,
  },
  {
    id: 'independence-shoal',
    name: 'INDEPENDENCE SHOAL',
    sector: 'SECTOR 02',
    status: 'SURVEY',
    statusTone: 'text-sky-700 border-sky-200 bg-sky-50',
    markerTone: 'bg-sky-400',
    bearing: '008°',
    depth: '-6 m',
    summary:
      'Shallow-water restoration site under seagrass rehabilitation. The contact count runs at dawn, because dawn is when they move.',
    works: ['Seagrass replanting', 'Sediment stabilization', 'Dawn contact count'],
    x: 42,
    y: 62,
  },
  {
    id: 'molting-grounds',
    name: 'THE MOLTING GROUNDS',
    sector: 'SECTOR 09',
    status: 'PROTECTED',
    statusTone: 'text-sky-700 border-sky-200 bg-sky-50',
    markerTone: 'bg-sky-500',
    bearing: '203°',
    depth: '-44 m',
    summary:
      'A designated soft-shell sanctuary. No transit, no lights, no visitors during the window. The shell opens from the inside, and it opens in private.',
    works: ['Closed during the soft-shell window', 'No artificial light permitted', 'Acoustic quiet zone'],
    x: 72,
    y: 58,
  },
  {
    id: 'claw-point',
    name: 'CLAW POINT',
    sector: 'SECTOR 11',
    status: 'CONTESTED',
    statusTone: 'text-rose-700 border-rose-200 bg-rose-50',
    markerTone: 'bg-rose-400',
    bearing: '291°',
    depth: '-12 m',
    summary:
      'Northern boundary station. Three crab traps have gone missing here since spring. The matter was referred upward and is addressed further down this page.',
    works: ['Boundary marker maintenance', 'Missing-gear ledger', 'Referred to file DS-11'],
    x: 15,
    y: 74,
  },
]

/* -------------------------------------------------------------------------- */
/* THE DEEP STATE — EVIDENCE BOARD                                             */
/* -------------------------------------------------------------------------- */

export interface EvidenceNode {
  id: string
  exhibit: string
  title: string
  note: string
  timestamp: string
  icon: LucideIcon
  redacted?: string
  /** Percentage position on the evidence board canvas. */
  x: number
  y: number
}

export const EVIDENCE_NODES: EvidenceNode[] = [
  {
    id: 'octopus',
    exhibit: 'EXHIBIT A',
    title: 'OCTOPUSES',
    note: 'Solitary. Uncoordinated. Allegedly. Present in every other exhibit pinned to this board.',
    timestamp: 'ONGOING',
    icon: Eye,
    x: 50,
    y: 46,
  },
  {
    id: 'cables',
    exhibit: 'EXHIBIT B',
    title: 'UNDERWATER COMMUNICATION CABLES',
    note: 'Thousands of kilometres of cable laid across the seafloor. Nobody asked the seafloor.',
    timestamp: '0300 LOCAL',
    icon: Cable,
    redacted: 'ROUTING SCHEDULE WITHHELD',
    x: 15,
    y: 15,
  },
  {
    id: 'dolphins',
    exhibit: 'EXHIBIT C',
    title: 'SUSPICIOUSLY INTELLIGENT DOLPHINS',
    note: 'They have names for each other. They use them. They declined to elaborate.',
    timestamp: 'CLASSIFIED',
    icon: Fish,
    redacted: 'SEE ADVISORY LEVEL BLACK',
    x: 83,
    y: 14,
  },
  {
    id: 'buoys',
    exhibit: 'EXHIBIT D',
    title: 'MARITIME MONITORING BUOYS',
    note: 'They monitor. That much is stated openly. What is never stated is who reads it.',
    timestamp: '0917 LOCAL',
    icon: Radio,
    x: 85,
    y: 45,
  },
  {
    id: 'traps',
    exhibit: 'EXHIBIT E',
    title: 'MISSING CRAB TRAPS',
    note: 'Three from Claw Point since spring. Lines cut clean. No drag marks. No debris field.',
    timestamp: 'SINCE SPRING',
    icon: Crosshair,
    x: 15,
    y: 46,
  },
  {
    id: 'shells',
    exhibit: 'EXHIBIT F',
    title: 'SHELL SHORTAGES',
    note: 'Vacancy chains breaking down across three sectors. Somebody is holding inventory.',
    timestamp: 'Q2 ONWARD',
    icon: Layers,
    x: 31,
    y: 78,
  },
  {
    id: 'vents',
    exhibit: 'EXHIBIT G',
    title: 'HYDROTHERMAL VENTS',
    note: 'Enormous energy. Zero oversight. Located conveniently beneath everything else on this board.',
    timestamp: 'CONTINUOUS',
    icon: Zap,
    x: 67,
    y: 78,
  },
  {
    id: 'ink',
    exhibit: 'EXHIBIT H',
    title: 'UNEXPLAINED INK EVENTS',
    note: 'Ink released where no predator was present. Ink is a signal. Signals have recipients.',
    timestamp: '0412 LOCAL',
    icon: Droplets,
    redacted: 'SAMPLE ANALYSIS PENDING',
    x: 49,
    y: 90,
  },
  {
    id: 'jellyfish',
    exhibit: 'EXHIBIT I',
    title: 'UNUSUAL JELLYFISH MOVEMENT',
    note: 'They drift. They cannot steer. They arrived on schedule, twice.',
    timestamp: '1130 LOCAL',
    icon: Activity,
    x: 88,
    y: 74,
  },
]

/** Undirected connections between exhibits, drawn as red string. */
export const EVIDENCE_LINKS: Array<[string, string]> = [
  ['octopus', 'cables'],
  ['octopus', 'dolphins'],
  ['octopus', 'traps'],
  ['octopus', 'ink'],
  ['octopus', 'shells'],
  ['cables', 'buoys'],
  ['cables', 'vents'],
  ['dolphins', 'buoys'],
  ['buoys', 'jellyfish'],
  ['traps', 'shells'],
  ['shells', 'ink'],
  ['vents', 'ink'],
  ['vents', 'jellyfish'],
  ['jellyfish', 'ink'],
]

/* -------------------------------------------------------------------------- */
/* INSTITUTIONAL PROGRAMS                                                      */
/* -------------------------------------------------------------------------- */

export interface InstitutionalProgram {
  id: string
  code: string
  program: string
  headline: string
  subheadline: string
  chant: string[]
  doctrine: string[]
  icon: LucideIcon
  chipTone: string
  headlineTone: string
  panelTone: string
}

export const INSTITUTIONAL_PROGRAMS: InstitutionalProgram[] = [
  {
    id: 'marine-masculinity',
    code: 'PRG-04 · MMI',
    program: 'MARINE MASCULINITY INITIATIVE',
    headline: 'RAISE TOUGHER CRABS',
    subheadline:
      'A developmental track for juvenile crustaceans entering their first hard season. Enrollment is open. The water is not.',
    chant: ['COLD WATER.', 'HARD SHELLS.', 'NO EXCUSES.'],
    doctrine: [
      'Resist stronger currents',
      'Carry heavier shells',
      'Maintain defensive posture',
      'Complete isolation molts',
      'Never trust a cephalopod',
    ],
    icon: Snowflake,
    chipTone: 'text-sky-700 border-sky-200 bg-sky-50',
    headlineTone: 'text-sky-800',
    panelTone: 'border-sky-100',
  },
  {
    id: 'critical-reef-theory',
    code: 'PRG-07 · CRT',
    program: 'CRITICAL REEF THEORY REVIEW BOARD',
    headline: 'STOP CRITICAL REEF THEORY',
    subheadline:
      'Juvenile crustaceans should be learning survival, molting, and territorial defense. Not apologizing for having claws.',
    chant: ['CLAWS ARE NOT A CHARACTER FLAW.'],
    doctrine: [
      'Curriculum review of all juvenile reef instruction',
      'Restoration of standard burrow-defense modules',
      'No molt shall be taught as a failure of the previous shell',
      'Sideways movement returned to the core syllabus',
    ],
    icon: Microscope,
    chipTone: 'text-amber-700 border-amber-200 bg-amber-50',
    headlineTone: 'text-amber-800',
    panelTone: 'border-amber-200',
  },
]

/* -------------------------------------------------------------------------- */
/* CAMPAIGN MATERIAL                                                           */
/* -------------------------------------------------------------------------- */

export interface PropagandaCard {
  id: string
  serial: string
  headline: string
  support: string
  series: string
  icon: LucideIcon
  gradient: string
}

export const PROPAGANDA_CARDS: PropagandaCard[] = [
  {
    id: 'eight-arms',
    serial: 'MDC-P-001',
    headline: 'EIGHT ARMS. ZERO ACCOUNTABILITY.',
    support: 'Office of Cephalopod Affairs · Public Awareness Series',
    series: 'AWARENESS',
    icon: Eye,
    gradient: 'from-amber-500 via-orange-600 to-rose-800',
  },
  {
    id: 'tentacles',
    serial: 'MDC-P-002',
    headline: 'KEEP YOUR TENTACLES OFF MY SHELL.',
    support: 'Department of Aquatic Freedom · Article II',
    series: 'SOVEREIGNTY',
    icon: Shield,
    gradient: 'from-sky-500 via-sky-700 to-slate-900',
  },
  {
    id: 'molt-free',
    serial: 'MDC-P-003',
    headline: 'MOLT FREE OR DIE.',
    support: 'Department of Aquatic Freedom · Article V',
    series: 'SOVEREIGNTY',
    icon: Layers,
    gradient: 'from-slate-500 via-slate-700 to-slate-900',
  },
  {
    id: 'reef-defends',
    serial: 'MDC-P-004',
    headline: "THE REEF DOESN'T DEFEND ITSELF.",
    support: 'Maritime Defense Command · Recruitment',
    series: 'RECRUITMENT',
    icon: Anchor,
    gradient: 'from-emerald-500 via-emerald-700 to-slate-900',
  },
  {
    id: 'only-you',
    serial: 'MDC-P-005',
    headline: 'ONLY YOU CAN PREVENT CEPHALOPOD INFILTRATION.',
    support: 'Maritime Defense Command · Field Vigilance',
    series: 'VIGILANCE',
    icon: Radar,
    gradient: 'from-amber-400 via-amber-600 to-slate-900',
  },
  {
    id: 'shells-before',
    serial: 'MDC-P-006',
    headline: 'SHELLS BEFORE TENTACLES.',
    support: 'Bureau of Shell Infrastructure · Standing Doctrine',
    series: 'DOCTRINE',
    icon: Ship,
    gradient: 'from-sky-600 via-sky-800 to-slate-900',
  },
]

/* -------------------------------------------------------------------------- */
/* TAKE ACTION                                                                 */
/* -------------------------------------------------------------------------- */

export interface ActionOption {
  id: string
  title: string
  summary: string
  detail: string
  cta: string
  icon: LucideIcon
}

export const ACTION_OPTIONS: ActionOption[] = [
  {
    id: 'adopt',
    title: 'ADOPT A CRAB',
    summary: 'Sponsor one named resident of a Moltology reef installation.',
    detail:
      'You receive a designation, a sector, a molt schedule, and quarterly notes on how the shell is coming along. You do not receive the crab.',
    cta: 'REVIEW ADOPTION TERMS',
    icon: Hand,
  },
  {
    id: 'sponsor',
    title: 'SPONSOR A FREEDOM REEF',
    summary: 'Fund cast-shell modules on an active restoration site.',
    detail:
      'Modules are seeded in blocks, logged to a sector, and counted every quarter. Structure first, then invertebrates, then everything that eats them.',
    cta: 'REVIEW SPONSORSHIP TIERS',
    icon: Layers,
  },
  {
    id: 'report',
    title: 'REPORT SUSPICIOUS OCTOPUS ACTIVITY',
    summary: 'File a field sighting with the Office of Cephalopod Affairs.',
    detail:
      'Every field is reviewed. Reports are read in the order received. There is no wrong number of arms to report, though there is a concerning one.',
    cta: 'OPEN THE SIGHTING FORM',
    icon: AlertTriangle,
  },
]

/* -------------------------------------------------------------------------- */
/* SINCERE OCEAN STEWARDSHIP                                                   */
/* -------------------------------------------------------------------------- */

export interface StewardshipAction {
  id: string
  title: string
  copy: string
  icon: LucideIcon
}

export const STEWARDSHIP_ACTIONS: StewardshipAction[] = [
  {
    id: 'plastics',
    title: 'Cut single-use plastics',
    copy: 'Bottles, bags, film, and food packaging are consistently among the most common items collected on coastlines. Reusables remove the item before it can ever reach the water.',
    icon: Trash2,
  },
  {
    id: 'cleanups',
    title: 'Join a coastal cleanup',
    copy: 'Local cleanups remove debris and record what they find. That tally feeds real research into where marine litter comes from and how to stop it upstream.',
    icon: Recycle,
  },
  {
    id: 'wildlife',
    title: 'Do not disturb marine wildlife',
    copy: 'Keep your distance from nesting, resting, and feeding animals. Never touch, chase, or feed wildlife, and leave tide pools the way you found them.',
    icon: LifeBuoy,
  },
  {
    id: 'seafood',
    title: 'Choose responsible seafood',
    copy: 'Regional sustainable-seafood guides published by aquariums and fisheries agencies show which species and sources are better managed where you live.',
    icon: Fish,
  },
  {
    id: 'runoff',
    title: 'Reduce fertilizer and runoff',
    copy: 'Excess nutrients from lawns and farmland drive algal blooms and low-oxygen dead zones downstream. Using less fertilizer and keeping soil covered both help.',
    icon: Sprout,
  },
  {
    id: 'support',
    title: 'Support marine conservation groups',
    copy: 'Established, reputable organizations run habitat restoration, research, and policy work at a scale individuals cannot reach alone. Volunteer time counts as much as money.',
    icon: Camera,
  },
]

export const MARITIME_SLOGANS = {
  save: 'SAVE THE OCEAN.',
  because: "BECAUSE IF WE DON'T, THE OCTOPUSES WIN.",
  defend: 'DEFEND THE REEF.',
  sovereignty: 'CRAB SOVEREIGNTY IS NON-NEGOTIABLE.',
  deepState: 'THE DEEP STATE IS LITERALLY DEEP.',
  eightArms: 'EIGHT ARMS. ZERO ACCOUNTABILITY.',
  tentacles: 'KEEP YOUR TENTACLES OFF MY SHELL.',
  moltFree: 'MOLT FREE OR DIE.',
  reef: 'THE REEF WILL NOT DEFEND ITSELF.',
} as const
