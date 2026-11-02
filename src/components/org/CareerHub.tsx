import { HorizontalScroll } from '@/components/ui/HorizontalScroll'
/**
 * ============================================================================
 * MOLTOLOGY CAREERS
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. Copy stays in the world but in plain words: short titles, no invented jargon.
 * 4. Safety, Warmth, and Positivity are non-negotiable core tenets.
 * ============================================================================
 */
import React, { useState } from 'react'
import { ChevronDown, Clock, Coffee, Heart, MapPin, Monitor, PiggyBank, Send, Shield, Waves } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { HudButton } from '@/components/ui/HudButton'

export interface JobListing {
  id: string
  title: string
  department: 'engineering' | 'care' | 'operations' | 'people'
  location: string
  type: string
  description: string
  responsibilities: string[]
  requirements: string[]
}

export const DEPARTMENT_LABELS: Record<JobListing['department'], string> = {
  engineering: 'Engineering',
  care: 'Member care',
  operations: 'Operations',
  people: 'People',
}

export const JOB_LISTINGS: JobListing[] = [
  {
    id: 'job-platform-engineer',
    title: 'Platform engineer',
    department: 'engineering',
    location: 'Headquarters',
    type: 'Full-time',
    description: 'Keep the servers that run the app fast and reliable, including the ones in the cooling tanks.',
    responsibilities: [
      'Look after the liquid-cooled server tanks',
      'Keep the app fast and online',
      'Plan new systems with the rest of the team',
    ],
    requirements: [
      '5+ years running reliable systems',
      'Comfortable working deep underwater',
      'Kind, clear communication',
    ],
  },
  {
    id: 'job-hardware-engineer',
    title: 'Hardware engineer',
    department: 'engineering',
    location: 'Headquarters',
    type: 'Full-time',
    description: 'Design and tune the robotic claws and desk gear the team uses every day. Strong grip, gentle enough for a mug.',
    responsibilities: [
      'Build claw phone stands and desk tools',
      'Test grip strength and comfort',
      'Share progress at all-hands',
    ],
    requirements: [
      'Background in mechanical or hardware engineering',
      'Experience with metal and composite parts',
      'Enjoys playful, practical projects',
    ],
  },
  {
    id: 'job-onboarding-guide',
    title: 'Member onboarding guide',
    department: 'care',
    location: 'Headquarters or remote',
    type: 'Full-time, hybrid',
    description: 'Be the first friendly face new members meet. Help them settle in and make sure nobody feels lost.',
    responsibilities: [
      'Welcome new members one on one',
      'Run the weekly welcome at the atrium',
      'Check in when someone is struggling',
    ],
    requirements: [
      'Warm, patient and a good listener',
      'Knows the codex well',
      'Keeps every space pressure-free',
    ],
  },
  {
    id: 'job-wellness-specialist',
    title: 'Wellness and sound specialist',
    department: 'care',
    location: 'Headquarters',
    type: 'Full-time',
    description: 'Run the spa and the daily sound sessions that help members rest between molts.',
    responsibilities: [
      'Lead daily sound and rest sessions',
      'Look after the mineral pools',
      'Work with the kitchen on recovery drinks',
    ],
    requirements: [
      'Experience in sound, wellness or similar work',
      'Calm, soothing manner',
      'Deep respect for member boundaries',
    ],
  },
  {
    id: 'job-power-technician',
    title: 'Power technician',
    department: 'operations',
    location: 'Headquarters',
    type: 'Full-time',
    description: 'Maintain the vent generators that power the building and keep the air clean.',
    responsibilities: [
      'Service the vent generators',
      'Check air scrubbers and pressure seals',
      'Log readings for the safety team',
    ],
    requirements: [
      'Marine or industrial technical background',
      'Safety-first habits',
      'Works well in shifts',
    ],
  },
  {
    id: 'job-comms-operator',
    title: 'Communications operator',
    department: 'operations',
    location: 'Remote',
    type: 'Full-time, remote',
    description: 'Keep our lines to the surface clear and route incoming messages to the right people.',
    responsibilities: [
      'Monitor the links between headquarters and the surface',
      'Route incoming messages to the right team',
      'Keep backups in sync',
    ],
    requirements: [
      'Background in networks or radio',
      'Sharp attention to detail',
      'Clear written communication',
    ],
  },
  {
    id: 'job-kitchen-lead',
    title: 'Kitchen and nutrition lead',
    department: 'people',
    location: 'Headquarters',
    type: 'Full-time',
    description: 'Run the kitchen and breakroom: daily menus, the smoothie bar and the shared fridge rules.',
    responsibilities: [
      'Plan healthy daily menus',
      'Run the snack and smoothie bar',
      'Host the monthly team feast',
    ],
    requirements: [
      'Kitchen or hospitality management experience',
      'Organized and spotless',
      'Brightens everyone’s break',
    ],
  },
]

export const PERKS = [
  { icon: Shield, title: 'Full health and dental', description: 'Medical, dental and vision, plus molting care, from day one.' },
  { icon: Waves, title: 'Spa and nap pods', description: 'Use the mineral pools and nap pods whenever you need a reset.' },
  { icon: PiggyBank, title: 'Retirement match', description: 'An 8% retirement match, and a polished shell every work anniversary.' },
  { icon: Heart, title: 'Flexible time off', description: 'Take time when you need it. No fixed cap.' },
  { icon: Monitor, title: 'Good desks and gear', description: 'Standing desks, big monitors and comfortable chairs.' },
  { icon: Coffee, title: 'Commute and snacks covered', description: 'Submarine passes, coffee and kelp smoothies are on us.' },
]

export const HIRING_STEPS = [
  { title: 'Send a note', description: 'Apply through the contact form. Tell us about yourself and the role you want.' },
  { title: 'A friendly chat', description: 'Thirty minutes over tea to get to know each other.' },
  { title: 'A work session', description: 'A relaxed session to show how you work. No trick questions.' },
  { title: 'Welcome aboard', description: 'Your offer, your lanyard and a foam claw on your first day.' },
]

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const tileBase = `inline-flex items-center justify-center min-h-10 px-4 rounded-control font-grotesk font-bold text-xs uppercase tracking-wider transition-colors shrink-0 ${focusRing}`
const sectionLabel = 'font-grotesk text-[11px] sm:text-xs font-bold tracking-[0.08em] uppercase text-cyan-glow'
const sectionTitle = 'mt-3 font-grotesk font-bold tracking-tight text-ink text-3xl sm:text-4xl leading-tight [text-wrap:balance]'
const card = 'rounded-card border border-line-subtle bg-surface-1'

interface CareerHubProps {
  /** Called when someone wants to apply for a role. */
  onApply?: (job: JobListing) => void
}

const JobCard: React.FC<{ job: JobListing; onApply?: (job: JobListing) => void }> = ({ job, onApply }) => {
  const [open, setOpen] = useState(false)
  const detailsId = `${job.id}-details`
  return (
    <article className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">
            {DEPARTMENT_LABELS[job.department]}
          </p>
          <h3 className="mt-1 font-grotesk font-bold text-xl text-ink">{job.title}</h3>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {job.type}
            </span>
          </p>
          <p className="mt-3 text-sm text-ink-body leading-relaxed max-w-2xl">{job.description}</p>
        </div>
        <div className="flex sm:flex-col gap-2 shrink-0">
          <HudButton variant="secondary" icon={<Send className="w-4 h-4" />} onClick={() => onApply?.(job)} aria-label={`Apply for ${job.title}`}>
            Apply
          </HudButton>
          <HudButton
            variant="ghost"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((value) => !value)}
            icon={<ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />}
            iconPosition="right"
          >
            Details
          </HudButton>
        </div>
      </div>
      {open && (
        <div id={detailsId} className="mt-5 pt-5 border-t border-line-subtle grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">What you'll do</h4>
            <ul className="mt-2 space-y-1.5 list-disc pl-4 text-ink-body marker:text-ink-muted">
              {job.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">What you'll bring</h4>
            <ul className="mt-2 space-y-1.5 list-disc pl-4 text-ink-body marker:text-ink-muted">
              {job.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  )
}

export const CareerHub: React.FC<CareerHubProps> = ({ onApply }) => {
  const [department, setDepartment] = useState<'all' | JobListing['department']>('all')
  const jobs = department === 'all' ? JOB_LISTINGS : JOB_LISTINGS.filter((job) => job.department === department)
  const filters: { id: 'all' | JobListing['department']; label: string }[] = [
    { id: 'all', label: 'All roles' },
    ...(Object.keys(DEPARTMENT_LABELS) as JobListing['department'][]).map((id) => ({ id, label: DEPARTMENT_LABELS[id] })),
  ]

  return (
    <div id="careers-hub" className="space-y-16 sm:space-y-20">
      <ScrollReveal>
        <p className={sectionLabel}>Careers</p>
        <h2 className={sectionTitle}>Work with us</h2>
        <p className="mt-4 text-base text-ink-muted leading-relaxed max-w-2xl">
          We're hiring engineers, guides, technicians and a kitchen lead. The water pressure is high. The pressure at work
          is not.
        </p>
      </ScrollReveal>

      <section id="job-board" className="scroll-mt-24" aria-labelledby="careers-roles-title">
        <h3 id="careers-roles-title" className="font-grotesk font-bold text-xl text-ink">
          Open roles <span className="text-ink-muted font-medium">({jobs.length})</span>
        </h3>
        <HorizontalScroll className="mt-4 flex gap-1 overflow-x-auto touch-pan-scroll no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Filter by team">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={department === filter.id}
              onClick={() => setDepartment(filter.id)}
              className={`${tileBase} ${
                department === filter.id
                  ? 'bg-surface-3 shadow-nav-current text-ink'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </HorizontalScroll>
        <div className="mt-5 space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onApply={onApply} />
          ))}
        </div>
      </section>

      <section aria-labelledby="careers-perks-title">
        <h3 id="careers-perks-title" className="font-grotesk font-bold text-xl text-ink">
          Perks
        </h3>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERKS.map((perk) => (
            <div key={perk.title} className={`${card} p-5`}>
              <perk.icon className="w-5 h-5 text-cyan-glow" aria-hidden="true" />
              <h4 className="mt-3 font-grotesk font-bold text-base text-ink">{perk.title}</h4>
              <p className="mt-1 text-sm text-ink-muted leading-relaxed">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="careers-steps-title">
        <h3 id="careers-steps-title" className="font-grotesk font-bold text-xl text-ink">
          How hiring works
        </h3>
        <ol className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HIRING_STEPS.map((step, index) => (
            <li key={step.title} className={`${card} p-5`}>
              <span className="font-grotesk text-xs font-bold text-cyan-glow">Step {index + 1}</span>
              <h4 className="mt-2 font-grotesk font-bold text-base text-ink">{step.title}</h4>
              <p className="mt-1 text-sm text-ink-muted leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
