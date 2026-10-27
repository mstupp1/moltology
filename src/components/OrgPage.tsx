/**
 * ============================================================================
 * MOLTOLOGY.ORG - OFFICIAL ORGANIZATION PAGE
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. Narrative copy stays in the world (STYLE_GUIDE.md); form and error copy is plain English.
 * 4. Safety and Positivity are non-negotiable core tenets of Moltology.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Shield, CheckCircle2, Mail, Send, Users, Smile, Sparkles, Briefcase } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { MainFooter } from '@/components/MainFooter'
import { getAssetUrl } from '@/lib/assets'
import { useToast } from '@/components/ui/ToastProvider'
import { PublicHeader } from '@/components/PublicHeader'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { HudButton } from '@/components/ui/HudButton'
import { CareerHub, type JobListing } from '@/components/org/CareerHub'
import { submitContactFormFn } from '@/lib/server/api'
import { LEAD_CAPTURE_CHECK_PENDING } from '@/lib/lead-capture'
import {
  CONTACT_COPY,
  CONTACT_HONEYPOT_FIELD,
  CONTACT_TOPICS,
  CONTACT_TOPIC_LABELS,
  CONTACT_TURNSTILE_ACTION,
  validateContactFields,
} from '@/lib/contact-form'
import { SUPPORT_INBOX } from '@/lib/support-tickets'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'

type ViewMode = 'overview' | 'careers'

const VIEW_TABS: { id: ViewMode; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'About us', icon: Users },
  { id: 'careers', label: 'Careers', icon: Briefcase },
]

const values = [
  {
    icon: Smile,
    title: 'People first',
    copy: 'Your comfort and consent come before everything else.',
  },
  {
    icon: Shield,
    title: 'Safety always',
    copy: 'No hostility and no pressure. Warmth is the rule.',
  },
  {
    icon: Users,
    title: 'Nobody molts alone',
    copy: 'Someone is always in your corner, cheering you on.',
  },
  {
    icon: Sparkles,
    title: 'Every step counts',
    copy: 'Small wins get celebrated here, loudly.',
  },
]

const leadership = [
  {
    name: 'Dr. Thaddeus Crust',
    title: 'Chief Executive',
    bio: 'A former deep-sea engineer who heard the signal from the trench floor and never came back up.',
    image: getAssetUrl('/images/org_leader_thaddeus.jpg'),
  },
  {
    name: 'Sister Vane',
    title: 'Head of Member Care',
    bio: 'Makes sure every new member feels welcome. Her tea is famous on every floor.',
    image: getAssetUrl('/images/org_leader_vane.jpg'),
  },
  {
    name: 'Exoshell 9',
    title: 'Director of Safety',
    bio: 'Keeps the building sealed, pressurized and running. Has never lost a submarine.',
    image: getAssetUrl('/images/org_leader_exoshell.jpg'),
  },
  {
    name: 'Brother Nautilus',
    title: 'Lead Chaplain',
    bio: 'Wrote most of the codex. Answers hard questions gently and easy ones at length.',
    image: getAssetUrl('/images/org_leader_nautilus.jpg'),
  },
]

const places = [
  {
    id: 'atrium',
    title: 'The atrium',
    image: getAssetUrl('/images/org_team_atrium.jpg'),
    description: 'Reception and all-hands meetings. Every new member starts here, to a cheering crowd.',
    highlights: ['Free kelp snack bar', 'Foam claws at every all-hands', 'Glass elevators and a crab fountain'],
  },
  {
    id: 'meeting-room',
    title: 'Meeting room',
    image: getAssetUrl('/images/org_boardroom_meeting.jpg'),
    description: 'Where the leadership team plans each quarter. The water pressure keeps meetings short.',
    highlights: ['A map of the whole trench', 'Strong coffee', 'A lobster who sits in on every meeting'],
  },
  {
    id: 'work-floor',
    title: 'Work floor',
    image: getAssetUrl('/images/org_open_office.jpg'),
    description: 'Where the team builds the app and answers your messages.',
    highlights: ['Standing desks', 'Salt-water drinks station', 'Claw-shaped phone stands'],
  },
  {
    id: 'breakroom',
    title: 'Breakroom',
    image: getAssetUrl('/images/org_cafeteria_break.jpg'),
    description: 'Team lunches and kelp smoothies. House rule: label your shed shell before it goes in the fridge.',
    highlights: ['Kelp smoothies on tap', 'Calcium shakers on every table', 'A clearly labeled shared fridge'],
  },
  {
    id: 'power-room',
    title: 'Power and servers',
    image: getAssetUrl('/images/org_server_lab.jpg'),
    description: 'Heat from the hydrothermal vents powers the building. The servers sit in cooling tanks next door.',
    highlights: ['Vent-powered generators', 'Liquid-cooled server tanks', 'Bright safety vests, always'],
  },
]

const milestones = [
  {
    year: '2021',
    title: 'We heard a signal',
    description:
      'A deep-sea microphone picked up a steady clicking from the trench floor. Our founders listened for a year and decided it was advice.',
  },
  {
    year: '2022',
    title: 'The foundation opens',
    description: 'Moltology.org starts with one goal: help people shed the habits that slow them down.',
  },
  {
    year: '2023',
    title: 'Our headquarters is built',
    description: 'The building on the trench floor is finished. The coffee machine goes in first.',
  },
  {
    year: '2025',
    title: 'The app goes live',
    description: 'Members can molt from home. The submarine commute becomes optional.',
  },
]

const EMPTY_CONTACT_FORM = {
  name: '',
  email: '',
  topic: 'general',
  message: '',
  emailOptIn: false,
}

const sectionLabel = 'font-grotesk text-[11px] sm:text-xs font-bold tracking-[0.08em] uppercase text-cyan-glow'
const sectionTitle = 'mt-3 font-grotesk font-bold tracking-tight text-ink text-3xl sm:text-4xl leading-tight [text-wrap:balance]'
const sectionLede = 'mt-4 text-base text-ink-muted leading-relaxed max-w-2xl [text-wrap:pretty]'
const card = 'rounded-card border border-line-subtle bg-surface-1'
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow'
const tileBase = `inline-flex items-center justify-center gap-2 min-h-10 px-4 rounded-control font-grotesk font-bold text-xs uppercase tracking-wider transition-colors shrink-0 ${focusRing}`
const tileOn = 'bg-surface-3 shadow-nav-current text-ink'
const tileOff = 'text-ink-muted hover:text-ink hover:bg-surface-2'
const fieldLabel = 'block text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-1.5'
const fieldClass =
  'w-full min-h-10 bg-surface-2 text-ink placeholder:text-ink-muted/70 text-sm rounded-control border border-line py-2 px-3 transition-[border-color,box-shadow] duration-200 outline-hidden hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus'

export const OrgPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const onNavigate = (path: string) => navigate({ to: path })

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [activePlace, setActivePlace] = useState(0)

  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM)
  const [contactHoneypot, setContactHoneypot] = useState('')
  const [contactTurnstileToken, setContactTurnstileToken] = useState<string | null>(null)
  const [contactError, setContactError] = useState<string | null>(null)
  const contactTurnstileRef = React.useRef<TurnstileWidgetRef>(null)
  const [isContactSubmitting, setIsContactSubmitting] = useState(false)
  const [contactSentTo, setContactSentTo] = useState<string | null>(null)
  const [contactOptInPending, setContactOptInPending] = useState(false)

  // Result of the news-email confirmation link (/api/email/confirm redirects here).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const status = params.get('email')
    if (!status) return
    if (status === 'confirmed') toast.success(CONTACT_COPY.emailConfirmed, { id: 'org-email-confirm' })
    else if (status === 'expired') toast.warning(CONTACT_COPY.emailConfirmExpired, { id: 'org-email-confirm' })
    else toast.error(CONTACT_COPY.emailConfirmError, { id: 'org-email-confirm' })
    params.delete('email')
    const query = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
  }, [])

  // Old careers links (#careers, ?tab=careers) open the Careers view.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    const search = window.location.search
    if (
      hash === '#careers' ||
      hash === '#careers-hub' ||
      hash === '#job-board' ||
      search.includes('tab=careers') ||
      search.includes('view=careers')
    ) {
      setViewMode('careers')
    }
  }, [])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  const scrollToElement = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showCareers = () => {
    setViewMode('careers')
    setTimeout(() => scrollToElement('org-views'), 50)
  }

  // Applying fills the contact form instead of a separate application form, so it reaches support@.
  const applyForJob = (job: JobListing) => {
    setContactSentTo(null)
    setContactError(null)
    setContactForm((form) => ({
      ...form,
      topic: 'careers',
      message: form.message.trim() ? form.message : `I'd like to apply for the ${job.title} role.\n\nA little about me: `,
    }))
    setTimeout(() => {
      scrollToElement('contact')
      document.getElementById('org-contact-name')?.focus({ preventScroll: true })
    }, 50)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validated = validateContactFields(contactForm)
    if (!validated.ok) {
      setContactError(validated.error)
      return
    }
    if (!contactTurnstileToken) {
      setContactError(LEAD_CAPTURE_CHECK_PENDING)
      return
    }
    setContactError(null)
    setIsContactSubmitting(true)
    try {
      const result = await submitContactFormFn({
        data: {
          name: validated.name,
          email: validated.email,
          topic: contactForm.topic,
          message: validated.message,
          emailOptIn: contactForm.emailOptIn,
          turnstileToken: contactTurnstileToken,
          [CONTACT_HONEYPOT_FIELD]: contactHoneypot,
        },
      })
      setContactOptInPending(result.marketingStatus === 'pending')
      if (result.marketingStatus === 'error') toast.warning('Your message was sent, but we could not send your subscription confirmation. Please try subscribing again.')
    } catch (error) {
      setIsContactSubmitting(false)
      setContactTurnstileToken(null)
      contactTurnstileRef.current?.reset()
      const message = error instanceof Error && error.message ? error.message : CONTACT_COPY.genericError
      toast.error(message, { id: 'org-contact' })
      return
    }
    setIsContactSubmitting(false)
    setContactTurnstileToken(null)
    setContactSentTo(validated.email)
    setContactForm(EMPTY_CONTACT_FORM)
    toast.success(CONTACT_COPY.toastSent, { id: 'org-contact' })
  }

  const place = places[activePlace]

  return (
    <div className="min-h-screen bg-abyss text-ink-body font-sans relative flex flex-col overflow-x-hidden">
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      <PublicHeader activePage="org" onOpenAuth={openAuth} />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative isolate overflow-hidden min-h-[560px] sm:min-h-[640px] flex items-end pt-28 pb-14 sm:pb-20">
          <img
            src={getAssetUrl('/images/org_team_atrium.jpg')}
            alt=""
            className="absolute inset-0 -z-20 w-full h-full object-cover object-[center_18%]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-abyss/70 via-abyss/55 to-abyss" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-abyss/85 via-abyss/30 to-transparent" />

          <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
            <p className={sectionLabel}>The organization</p>
            <h1 className="mt-4 max-w-3xl font-grotesk font-bold tracking-tight text-ink text-[2.5rem] leading-[1.04] sm:text-6xl [text-wrap:balance]">
              The people behind Moltology
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-ink-body leading-relaxed [text-wrap:pretty]">
              A small foundation at the bottom of the Pacific. We build the app, write the codex and read every
              message you send.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <HudButton variant="primary" size="lg" icon={<Mail className="w-4 h-4" />} onClick={() => scrollToElement('contact')}>
                Say hello
              </HudButton>
              <HudButton variant="secondary" size="lg" icon={<Briefcase className="w-4 h-4" />} onClick={showCareers}>
                See open roles
              </HudButton>
            </div>
          </div>
        </section>

        {/* VIEW SWITCHER */}
        <div id="org-views" className="max-w-6xl mx-auto px-4 sm:px-8 scroll-mt-24">
          <div
            role="group"
            aria-label="Page sections"
            className="inline-flex gap-1 p-1 rounded-card border border-line-subtle bg-surface-1"
          >
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={viewMode === tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`${tileBase} ${viewMode === tab.id ? tileOn : tileOff}`}
              >
                <tab.icon className={`w-4 h-4 ${viewMode === tab.id ? 'text-cyan-glow' : ''}`} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'careers' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-12 pb-20">
            <CareerHub onApply={applyForJob} />
          </div>
        ) : (
          <>
            {/* VALUES */}
            <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-14 pb-16 sm:pb-20" aria-labelledby="org-values-title">
              <ScrollReveal>
                <p className={sectionLabel}>What we care about</p>
                <h2 id="org-values-title" className={sectionTitle}>
                  Four things we never compromise on
                </h2>
              </ScrollReveal>
              <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {values.map((value, index) => (
                  <ScrollReveal key={value.title} delayMs={index * 60}>
                    <div className={`${card} h-full p-5`}>
                      <value.icon className="w-5 h-5 text-cyan-glow" aria-hidden="true" />
                      <h3 className="mt-4 font-grotesk font-bold text-lg text-ink">{value.title}</h3>
                      <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">{value.copy}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </section>

            {/* TEAM */}
            <section className="border-y border-line-subtle bg-surface-1/40" aria-labelledby="org-team-title">
              <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
                <ScrollReveal>
                  <p className={sectionLabel}>The team</p>
                  <h2 id="org-team-title" className={sectionTitle}>
                    Who runs the place
                  </h2>
                </ScrollReveal>
                <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {leadership.map((leader, index) => (
                    <ScrollReveal key={leader.name} delayMs={index * 60}>
                      <article className={`${card} h-full overflow-hidden`}>
                        <div className="aspect-square bg-surface-2 overflow-hidden">
                          <img src={leader.image} alt={leader.name} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 sm:p-5">
                          <h3 className="font-grotesk font-bold text-base sm:text-lg text-ink">{leader.name}</h3>
                          <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.08em] text-cyan-glow">{leader.title}</p>
                          <p className="mt-2 text-sm text-ink-muted leading-relaxed">{leader.bio}</p>
                        </div>
                      </article>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {/* WHERE WE WORK */}
            <section className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20" aria-labelledby="org-places-title">
              <ScrollReveal>
                <p className={sectionLabel}>Where we work</p>
                <h2 id="org-places-title" className={sectionTitle}>
                  Headquarters, 8,450 meters down
                </h2>
                <p className={sectionLede}>Our building sits on the floor of the Mariana Trench. Here is a look around.</p>
              </ScrollReveal>

              <div className="mt-8 flex gap-1 overflow-x-auto touch-pan-scroll no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Rooms">
                {places.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={activePlace === index}
                    onClick={() => setActivePlace(index)}
                    className={`${tileBase} ${activePlace === index ? tileOn : tileOff}`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div className={`${card} mt-4 overflow-hidden grid lg:grid-cols-12`}>
                <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto lg:min-h-[380px] bg-surface-2 overflow-hidden">
                  <img key={place.id} src={place.image} alt={place.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="lg:col-span-5 p-5 sm:p-7 flex flex-col">
                  <h3 className="font-grotesk font-bold text-2xl text-ink">{place.title}</h3>
                  <p className="mt-3 text-sm sm:text-base text-ink-body leading-relaxed">{place.description}</p>
                  <ul className="mt-5 space-y-2.5">
                    {place.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2.5 text-sm text-ink-muted">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-cyan-glow shrink-0" aria-hidden="true" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6 grid grid-cols-5 gap-2">
                    {places.map((thumb, index) => (
                      <button
                        key={thumb.id}
                        type="button"
                        aria-label={`Show ${thumb.title}`}
                        onClick={() => setActivePlace(index)}
                        className={`relative aspect-video rounded-control overflow-hidden border transition-opacity ${focusRing} ${
                          activePlace === index ? 'border-cyan-glow' : 'border-line-subtle opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={thumb.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* HISTORY */}
            <section className="border-t border-line-subtle" aria-labelledby="org-history-title">
              <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16">
                <ScrollReveal>
                  <p className={sectionLabel}>Our story</p>
                  <h2 id="org-history-title" className={sectionTitle}>
                    How we got here
                  </h2>
                </ScrollReveal>
                <ScrollReveal>
                  <ol className="border-l border-line-subtle">
                    {milestones.map((item) => (
                      <li key={item.year} className="relative pl-6 sm:pl-8 pb-8 last:pb-0">
                        <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-glow" aria-hidden="true" />
                        <p className="font-grotesk text-xs font-bold tracking-[0.08em] text-ink-muted">{item.year}</p>
                        <h3 className="mt-1 font-grotesk font-bold text-lg text-ink">{item.title}</h3>
                        <p className="mt-1.5 text-sm text-ink-muted leading-relaxed max-w-xl">{item.description}</p>
                      </li>
                    ))}
                  </ol>
                </ScrollReveal>
              </div>
            </section>
          </>
        )}

        {/* CONTACT */}
        <section id="contact" className="border-t border-line-subtle bg-surface-1/40 scroll-mt-20" aria-labelledby="org-contact-title">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <p className={sectionLabel}>Contact</p>
            <h2 id="org-contact-title" className={sectionTitle}>
              Get in touch
            </h2>
            <p className={sectionLede}>
              Questions, job applications, press or anything else. Every message goes to our support inbox and a person
              replies by email.
            </p>

            <div className="mt-10 grid md:grid-cols-12 gap-4 sm:gap-6">
              <div className={`${card} md:col-span-4 p-5 sm:p-6 space-y-5 text-sm self-start`}>
                <div>
                  <p className={fieldLabel}>Email</p>
                  <a
                    href={`mailto:${SUPPORT_INBOX}`}
                    className={`text-cyan-glow font-bold hover:text-cyan-hover rounded-control ${focusRing}`}
                  >
                    {SUPPORT_INBOX}
                  </a>
                </div>
                <div>
                  <p className={fieldLabel}>Address</p>
                  <p className="text-ink-body leading-relaxed">
                    Trench Level 7
                    <br />
                    Mariana Trench, Pacific Ocean
                  </p>
                </div>
                <div>
                  <p className={fieldLabel}>Visiting</p>
                  <p className="text-ink-body leading-relaxed">Always open. The kettle never switches off.</p>
                </div>
              </div>

              <div className={`${card} md:col-span-8 p-5 sm:p-7`}>
                {contactSentTo ? (
                  <div className="py-10 text-center" role="status">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" aria-hidden="true" />
                    <h3 className="mt-4 font-grotesk font-bold text-xl text-ink">Message sent</h3>
                    <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
                      Thanks for reaching out. We'll reply to {contactSentTo} as soon as we can.
                    </p>
                    {contactOptInPending && (
                      <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">{CONTACT_COPY.optInPending}</p>
                    )}
                    <div className="mt-6 flex justify-center">
                      <HudButton variant="secondary" onClick={() => setContactSentTo(null)}>
                        Send another
                      </HudButton>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="org-contact-name" className={fieldLabel}>
                          Name
                        </label>
                        <input
                          id="org-contact-name"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="Your name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="org-contact-email" className={fieldLabel}>
                          Email
                        </label>
                        <input
                          id="org-contact-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="org-contact-topic" className={fieldLabel}>
                        Topic
                      </label>
                      <select
                        id="org-contact-topic"
                        value={contactForm.topic}
                        onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                        className={fieldClass}
                      >
                        {CONTACT_TOPICS.map((topic) => (
                          <option key={topic} value={topic}>
                            {CONTACT_TOPIC_LABELS[topic]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="org-contact-message" className={fieldLabel}>
                        Message
                      </label>
                      <textarea
                        id="org-contact-message"
                        required
                        rows={5}
                        placeholder="How can we help?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className={`${fieldClass} resize-none`}
                      />
                    </div>

                    {/* Honeypot: hidden from people, filled by bots */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="org-contact-bait">Leave this empty</label>
                      <input
                        id="org-contact-bait"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        name={CONTACT_HONEYPOT_FIELD}
                        value={contactHoneypot}
                        onChange={(e) => setContactHoneypot(e.target.value)}
                      />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={contactForm.emailOptIn}
                        onChange={(e) => setContactForm({ ...contactForm, emailOptIn: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded-chip cursor-pointer accent-cyan-glow"
                      />
                      <span className="text-sm text-ink-muted leading-tight">Email me Moltology news and releases.</span>
                    </label>

                    <TurnstileWidget
                      ref={contactTurnstileRef}
                      action={CONTACT_TURNSTILE_ACTION}
                      theme="dark"
                      size="flexible"
                      onVerify={(token) => setContactTurnstileToken(token)}
                      onExpire={() => setContactTurnstileToken(null)}
                    />

                    {contactError && (
                      <p className="text-sm text-crimson-text" role="alert">
                        {contactError}
                      </p>
                    )}

                    <HudButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={isContactSubmitting}
                      icon={<Send className="w-4 h-4" />}
                    >
                      {isContactSubmitting ? 'Sending...' : 'Send message'}
                    </HudButton>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MainFooter />
    </div>
  )
}
