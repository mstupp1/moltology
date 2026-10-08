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
import {
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  ChevronRight,
  Compass,
  History,
  Mail,
  Send,
  Award,
  Users,
  Smile,
  ThumbsUp,
  Target,
  Coffee,
  Anchor,
  Gauge,
  Camera,
  Briefcase,
  Layers,
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { MainFooter } from '@/components/MainFooter'
import { getAssetUrl } from '@/lib/assets'
import { RollingNumber } from '@/components/ui/RollingNumber'
import { useToast } from '@/components/ui/ToastProvider'
import { PublicHeader } from '@/components/PublicHeader'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { CareerHub } from '@/components/org/CareerHub'
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

type AboutTab = 'mission' | 'vision' | 'safety'

const ABOUT_TABS: { id: AboutTab; label: string }[] = [
  { id: 'mission', label: 'OUR MISSION' },
  { id: 'vision', label: 'THE ROADMAP' },
  { id: 'safety', label: 'SAFETY FIRST' },
]

const values = [
  {
    icon: Smile,
    title: 'People First',
    copy: 'Every member is family. Your comfort and consent come before everything else.',
  },
  {
    icon: Shield,
    title: 'Safety Always',
    copy: 'Under the shell, warmth is the rule. No hostility, no pressure, ever.',
  },
  {
    icon: ThumbsUp,
    title: 'Growth Together',
    copy: 'Nobody molts alone. Someone is always cheering you on.',
  },
  {
    icon: Sparkles,
    title: 'Positivity Forever',
    copy: 'Every shed is worth celebrating, and we will clap very enthusiastically.',
  },
]

const chambers = [
  {
    id: 'chamber-1',
    title: 'CHAMBER 01: THE VENT POWER PLANT',
    depth: '-8,450 Meters',
    status: 'OPERATIONAL',
    image: getAssetUrl('/images/org_server_lab.jpg'),
    description:
      'Hydrothermal vents heat the water down here to 340°C. We use that heat to power the lair, grow new shell, and keep the coffee hot.',
    features: ['Geothermal vent generators', 'Shell growth tanks', 'Very hot coffee'],
  },
  {
    id: 'chamber-2',
    title: 'CHAMBER 02: THE COUNCIL ROOM',
    depth: '-8,520 Meters',
    status: 'COUNCIL ONLY',
    image: getAssetUrl('/images/org_boardroom_meeting.jpg'),
    description:
      'Where the leadership council plans the next molt. The pressure is 850 atmospheres, which keeps meetings short.',
    features: ['Holographic trench map', 'A very long table', 'Strict 20-minute meetings'],
  },
  {
    id: 'chamber-3',
    title: 'CHAMBER 03: THE WORK FLOOR',
    depth: '-8,600 Meters',
    status: 'OPEN PLAN',
    image: getAssetUrl('/images/org_open_office.jpg'),
    description:
      'Where the team builds the portal, answers your messages, and labels everything in the shared fridge.',
    features: ['Standing desks', 'Salt-water hydration station', 'Clearly labeled fridge'],
  },
  {
    id: 'chamber-4',
    title: 'CHAMBER 04: THE THERMAL SPA',
    depth: '-8,380 Meters',
    status: 'OPEN TO ALL MEMBERS',
    image: getAssetUrl('/images/org_cafeteria_break.jpg'),
    description:
      'Warm mineral pools and a low, steady sea hum. Members rest here between molts and let the day dissolve.',
    features: ['Mineral brine pools', 'Deep-sea hum on loop', 'Nap pods'],
  },
]

const milestones = [
  {
    year: '2021',
    title: 'THE MARIANA SIGNAL',
    description:
      'A deep-sea microphone picked up a steady clicking from the trench floor. Our founders listened for a year and decided it was advice.',
  },
  {
    year: '2022',
    title: 'THE FOUNDATION OPENS',
    description: 'Moltology.org is founded with one goal: help people shed the habits that slow them down.',
  },
  {
    year: '2023',
    title: 'LAIR ALPHA IS BUILT',
    description: 'Trench Level 7 finishes construction. The coffee machine is the first thing installed.',
  },
  {
    year: '2025',
    title: 'THE PORTAL GOES LIVE',
    description: 'Members can now molt from home. The submarine commute becomes optional.',
  },
]

const leadership = [
  {
    name: 'Dr. Thaddeus Crust',
    title: 'Chief Executive',
    bio: 'A former deep-sea engineer who heard the Mariana Signal and never came back up.',
    image: getAssetUrl('/images/org_leader_thaddeus.jpg'),
  },
  {
    name: 'Sister Vane',
    title: 'Head of Member Care',
    bio: 'Makes sure every new member feels welcome and nobody molts alone. Her tea is famous at three depths.',
    image: getAssetUrl('/images/org_leader_vane.jpg'),
  },
  {
    name: 'Exoshell 9',
    title: 'Director of Lair Safety',
    bio: 'Keeps the lair sealed, pressurized, and running. Has never once lost a submarine.',
    image: getAssetUrl('/images/org_leader_exoshell.jpg'),
  },
  {
    name: 'Brother Nautilus',
    title: 'Lead Chaplain',
    bio: 'Wrote most of the codex. Answers hard questions gently and easy ones at length.',
    image: getAssetUrl('/images/org_leader_nautilus.jpg'),
  },
]

const galleryItems = [
  {
    id: 'gallery-atrium',
    tag: 'ALL-HANDS',
    title: 'The Grand Atrium',
    subtitle: 'Reception and all-hands · Level 7',
    image: getAssetUrl('/images/org_team_atrium.jpg'),
    description:
      'Every new member starts here: free kelp snacks, friendly lanyards, and a crowd in foam claws cheering you in.',
    highlights: ['Free kelp snack bar', 'Foam claws for every all-hands', 'Glass elevators and a bronze crab fountain'],
  },
  {
    id: 'gallery-boardroom',
    tag: 'PLANNING',
    title: 'Conference Room Delta',
    subtitle: 'Where the roadmap gets made',
    image: getAssetUrl('/images/org_boardroom_meeting.jpg'),
    description:
      'Planning the quarter over posture diagrams and strong coffee. The aquarium on the sideboard is technically a team member.',
    highlights: ['Human-to-crab posture whiteboard', 'Gold-crested coffee mugs', 'Resident lobster morale advisor'],
  },
  {
    id: 'gallery-office',
    tag: 'ENGINEERING',
    title: 'The Engineering Floor',
    subtitle: 'Where the portal gets built',
    image: getAssetUrl('/images/org_open_office.jpg'),
    description: 'Standing desks, filtered daylight, and a salt-water station that keeps engineers focused and shipping.',
    highlights: ['Robotic claw phone mounts', '"Shed the cold, embrace the shell" posters', 'Salt-water hydration station'],
  },
  {
    id: 'gallery-breakroom',
    tag: 'BREAKROOM',
    title: 'The Breakroom',
    subtitle: 'Smoothies and team lunches',
    image: getAssetUrl('/images/org_cafeteria_break.jpg'),
    description: 'Coworkers bond over kelp smoothies. House rule: label your shed shell before it goes in the shared fridge.',
    highlights: ['Kelp smoothies on tap', 'Calcium shakers on every table', 'Shared-fridge labeling rules'],
  },
  {
    id: 'gallery-server-lab',
    tag: 'SERVER LAB',
    title: 'The Immersion Lab',
    subtitle: 'The machines that run the portal',
    image: getAssetUrl('/images/org_server_lab.jpg'),
    description:
      'Engineers check on servers submerged in cooling fluid at trench pressure. Safety vests are mandatory and very flattering.',
    highlights: ['Pressure-rated diagnostic tablets', 'Liquid-cooled server tanks', 'High-visibility safety vests'],
  },
]

const EMPTY_CONTACT_FORM = {
  name: '',
  email: '',
  topic: 'general',
  message: '',
  emailOptIn: false,
}

export const OrgPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const onNavigate = (path: string) => navigate({ to: path })

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Top Page View Switcher (Overview vs Careers Hub)
  const [viewMode, setViewMode] = useState<'overview' | 'careers'>('overview')
  const [activeTab, setActiveTab] = useState<AboutTab>('mission')
  const [activeChamber, setActiveChamber] = useState(0)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0)

  // Contact Form State
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM)
  const [contactHoneypot, setContactHoneypot] = useState('')
  const [contactTurnstileToken, setContactTurnstileToken] = useState<string | null>(null)
  const [contactError, setContactError] = useState<string | null>(null)
  const contactTurnstileRef = React.useRef<TurnstileWidgetRef>(null)
  const [isContactSubmitting, setIsContactSubmitting] = useState(false)
  const [contactSentTo, setContactSentTo] = useState<string | null>(null)

  // Sync hash/URL query on initial client load
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, [])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
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
      await submitContactFormFn({
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

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const inputClass =
    'w-full bg-[#f8fbff] border border-sky-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100'

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-700 font-sans relative flex flex-col justify-between overflow-x-hidden">
      {/* Soft Friendly Corporate Ambient Backdrops */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute top-1/3 -left-48 w-[520px] h-[520px] rounded-full bg-amber-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[500px] rounded-full bg-teal-100/50 blur-3xl" />
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => onNavigate('/dashboard')}
      />

      {/* Shared Navigation Header */}
      <PublicHeader activePage="org" variant="corporate" onOpenAuth={openAuth} />

      {/* FRIENDLY WELCOME RIBBON */}
      <div className="relative z-10 w-full bg-sky-500 text-white text-center text-[11px] sm:text-xs font-bold tracking-wider uppercase px-4 py-2 mt-20 sm:mt-24">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          SO GLAD YOU'RE HERE. WELCOME TO THE FAMILY.
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 w-full overflow-hidden pt-12 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-8 min-h-[560px] sm:min-h-[660px] lg:min-h-[740px] flex flex-col justify-end items-center">
        <img
          src={getAssetUrl('/images/org_team_atrium.jpg')}
          alt="Moltology Team in Grand Atrium"
          className="absolute inset-0 w-full h-full object-cover object-[center_18%] pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/25 via-transparent to-[#f4f7f9] z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-[#f4f7f9]/90 z-0 pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10 text-center w-full pb-4 sm:pb-6">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-white/95 backdrop-blur-md border-2 border-sky-200 text-sky-900 text-xs sm:text-sm md:text-base font-extrabold tracking-wider uppercase rounded-full shadow-xl hover:bg-white transition-all">
              <img
                src={getAssetUrl('/images/order_emblem.png')}
                alt="Moltology Emblem"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              />
              <span>MOLTOLOGY FOUNDATION · EST. 2022</span>
            </div>

            <a
              href="#contact"
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-xs sm:text-sm md:text-base uppercase tracking-wider rounded-full transition-all shadow-xl shadow-sky-500/30 flex items-center gap-2.5 hover:-translate-y-0.5"
            >
              <Mail className="w-5 h-5" />
              <span>SAY HELLO</span>
            </a>
          </div>
        </div>
      </section>

      {/* KEY READOUTS (BELOW HERO) */}
      <section className="relative z-10 w-full px-6 sm:px-12 -mt-2 sm:-mt-4 mb-8 max-w-[1200px] mx-auto">
        <ScrollReveal animation="fade-up" durationMs={800}>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-white rounded-3xl border border-sky-100 shadow-xl shadow-sky-100/60 p-4 sm:p-6 text-center space-y-1.5 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="text-[10px] sm:text-xs text-sky-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Anchor className="w-4 h-4 hidden sm:block" />
                LAIR DEPTH
              </div>
              <div className="text-xl sm:text-4xl font-black text-sky-600 font-grotesk tracking-tight whitespace-nowrap">
                <RollingNumber value={8450} duration={2000} prefix="-" suffix="m" triggerOnView={true} />
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500">Mariana Trench</div>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-100/60 p-4 sm:p-6 text-center space-y-1.5 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Gauge className="w-4 h-4 hidden sm:block" />
                PRESSURE
              </div>
              <div className="text-xl sm:text-4xl font-black text-emerald-600 font-grotesk tracking-tight whitespace-nowrap">
                <RollingNumber value={850} duration={2000} suffix=" atm" triggerOnView={true} />
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500">Cozy, honestly</div>
            </div>

            <div className="bg-white rounded-3xl border border-amber-100 shadow-xl shadow-amber-100/60 p-4 sm:p-6 text-center space-y-1.5 hover:-translate-y-1 hover:shadow-2xl transition-all">
              <div className="text-[10px] sm:text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Coffee className="w-4 h-4 hidden sm:block" />
                COFFEE
              </div>
              <div className="text-xl sm:text-4xl font-black text-amber-600 font-grotesk tracking-tight whitespace-nowrap">24/7</div>
              <div className="text-[10px] sm:text-xs text-slate-500">On the house</div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* TOP SUB-NAVIGATION MODE SWITCHER */}
      <section className="relative z-10 w-full px-6 sm:px-12 mb-10 max-w-[1200px] mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-2 p-2 bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-full border border-sky-200 shadow-lg shadow-sky-100/60 max-w-fit mx-auto">
          <button
            type="button"
            onClick={() => setViewMode('overview')}
            className={`px-5 py-2.5 rounded-xl sm:rounded-full text-xs font-grotesk font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
              viewMode === 'overview'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ABOUT US</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('careers')}
            className={`px-5 py-2.5 rounded-xl sm:rounded-full text-xs font-grotesk font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
              viewMode === 'careers'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>CAREERS</span>
          </button>
        </div>
      </section>

      {viewMode === 'careers' ? (
        <div className="relative z-10 w-full px-6 sm:px-12 max-w-[1200px] mx-auto space-y-20 pb-16">
          <CareerHub onScrollToCulture={() => scrollToElement('culture')} />

          {/* LIFE AT HQ GALLERY */}
          <div id="culture" className="space-y-8 pt-10 border-t border-sky-200">
            <div className="text-center space-y-3">
              <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                <Camera className="w-4 h-4" />
                <span>LIFE AT HEADQUARTERS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-grotesk font-bold text-sky-900 tracking-tight">
                A DAY AT TRENCH LEVEL 7
              </h3>
            </div>

            <div className="flex justify-start sm:justify-center gap-2 overflow-x-auto touch-pan-scroll no-scrollbar p-1.5 bg-white rounded-2xl sm:rounded-full border border-sky-200 shadow-sm w-full max-w-full sm:w-fit mx-auto px-2">
              {galleryItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[44px] flex items-center justify-center gap-1.5 ${
                    activeGalleryIndex === idx
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
                  }`}
                >
                  <span>{item.tag}</span>
                </button>
              ))}
            </div>

            <div className="bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xl shadow-sky-100 grid lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto min-h-[340px] bg-slate-900 overflow-hidden group">
                <img
                  key={galleryItems[activeGalleryIndex].id}
                  src={galleryItems[activeGalleryIndex].image}
                  alt={galleryItems[activeGalleryIndex].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="font-bold text-base font-grotesk">{galleryItems[activeGalleryIndex].title}</div>
                  <div className="text-sky-200 text-xs">{galleryItems[activeGalleryIndex].subtitle}</div>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xl sm:text-2xl font-grotesk font-bold text-sky-900 leading-tight">
                    {galleryItems[activeGalleryIndex].title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {galleryItems[activeGalleryIndex].description}
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {galleryItems[activeGalleryIndex].highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2 bg-[#f8fbff] p-2.5 rounded-xl border border-sky-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="leading-snug">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-4 border-t border-sky-100">
                  {galleryItems.map((thumb, tIdx) => (
                    <button
                      key={thumb.id}
                      type="button"
                      aria-label={`Show ${thumb.title}`}
                      onClick={() => setActiveGalleryIndex(tIdx)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        activeGalleryIndex === tIdx
                          ? 'border-sky-500 ring-2 ring-sky-300 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={thumb.image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* OUR VALUES */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <section className="relative z-10 w-full py-16 px-6 sm:px-12 max-w-[1200px] mx-auto">
              <div className="text-center space-y-4 mb-12">
                <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  <span>WHAT WE BELIEVE</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
                  OUR VALUES, IN PLAIN WORDS
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value) => (
                  <div
                    key={value.title}
                    className="bg-white rounded-3xl border border-sky-100 shadow-lg shadow-sky-100 p-6 space-y-3 hover:-translate-y-1 hover:shadow-xl transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                      <value.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold font-grotesk text-sky-900">{value.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{value.copy}</p>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* ABOUT US */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <section className="relative z-10 w-full py-16 px-6 sm:px-12 max-w-[1200px] mx-auto">
              <div className="text-center space-y-4 mb-10">
                <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>ABOUT MOLTOLOGY.ORG</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
                  WHAT WE'RE HERE TO DO
                </h2>
                <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  We're a friendly foundation with one simple idea: you'd be happier with a shell.
                </p>
              </div>

              <div className="flex justify-start sm:justify-center gap-1.5 sm:gap-2 mb-10 overflow-x-auto touch-pan-scroll no-scrollbar p-1.5 bg-white rounded-2xl sm:rounded-full border border-sky-200 shadow-sm w-full max-w-full sm:w-fit mx-auto px-2">
                {ABOUT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[44px] flex items-center justify-center ${
                      activeTab === tab.id
                        ? tab.id === 'safety'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-sky-500 text-white shadow-md'
                        : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white border border-sky-100 p-8 sm:p-12 rounded-3xl shadow-xl shadow-sky-100">
                {activeTab === 'mission' && (
                  <div className="space-y-5 max-w-3xl">
                    <h3 className="text-2xl font-grotesk font-bold text-sky-700 uppercase">
                      HELP PEOPLE SHED WHAT SLOWS THEM DOWN
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Soft tissue is lovely but drafty. It hesitates, it gets distracted, and it keeps forty-seven
                      tabs open. We give every member a community and small daily practices to drop those habits and
                      grow a tougher shell, at whatever pace feels right.
                    </p>
                    <ul className="space-y-2 text-xs text-sky-700">
                      {[
                        'Small daily practices, not big promises',
                        'A community that cheers for every molt',
                        'Your pace, always',
                      ].map((line) => (
                        <li key={line} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'vision' && (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-grotesk font-bold text-sky-700 uppercase">
                      THE CARCINIZATION ROADMAP
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                      Evolution keeps turning unrelated animals into crabs. Scientists call it carcinization. We think
                      nature is onto something, and we'd like to help it along, kindly.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-6 pt-2">
                      {[
                        {
                          title: 'PHASE 1: SHED THE HABITS',
                          copy: 'Members drop one soft habit at a time and grow a harder one in its place.',
                        },
                        {
                          title: 'PHASE 2: BUILD THE TRENCH',
                          copy: 'We expand the lair so there is room for everyone who wants to come down.',
                        },
                        {
                          title: 'PHASE 3: TOTAL SYNAPSE',
                          copy: 'Everyone focused, nobody hesitating, and every shell built to last.',
                        },
                      ].map((phase) => (
                        <div key={phase.title} className="bg-[#f8fbff] p-5 border border-sky-100 rounded-3xl">
                          <Target className="w-6 h-6 text-sky-500 mb-3" />
                          <div className="text-sky-700 font-bold text-lg font-grotesk mb-2">{phase.title}</div>
                          <p className="text-xs text-slate-500">{phase.copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'safety' && (
                  <div className="space-y-6 border-l-4 border-emerald-300 pl-6">
                    <h3 className="text-2xl font-grotesk font-bold text-emerald-600 uppercase flex items-center gap-2">
                      <Shield className="w-6 h-6" />
                      SAFETY AND POSITIVITY, ALWAYS
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      The shell protects; it never cages. Hostility, pressure, and coercion are not allowed here.
                      Everyone is a friend.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl text-emerald-800">
                        <strong>Your pace, your call.</strong> Every step happens when you're ready, with full consent.
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl text-emerald-800">
                        <strong>Chaplains on call.</strong> Someone is always around to listen, reassure, and put the
                        kettle on.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </ScrollReveal>

          {/* OUR UNDERGROUND LAIR SECTION */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <section id="lair" className="relative z-10 w-full py-20 px-6 sm:px-12 bg-white border-y border-sky-100">
              <div className="max-w-[1200px] mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                    <Compass className="w-4 h-4" />
                    <span>HEADQUARTERS</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
                    OUR UNDERGROUND LAIR: TRENCH LEVEL 7
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl mx-auto">
                    Come say hi! HQ is a short submarine ride below the Pacific. It's cozy, warmly lit, and built to
                    handle crushing pressure. The coffee's on us.
                  </p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-4 space-y-3">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                      PICK A CHAMBER TO PEEK INSIDE:
                    </div>
                    {chambers.map((chamber, index) => (
                      <button
                        key={chamber.id}
                        type="button"
                        onClick={() => setActiveChamber(index)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between shadow-sm ${
                          activeChamber === index
                            ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-200'
                            : 'bg-white border-sky-100 text-slate-600 hover:border-sky-300 hover:text-sky-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold font-grotesk uppercase">{chamber.title.split(':')[0]}</div>
                          <div
                            className={`text-[11px] truncate max-w-[240px] ${
                              activeChamber === index ? 'text-sky-100' : 'text-slate-400'
                            }`}
                          >
                            {chamber.title.split(':')[1]}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeChamber === index ? 'rotate-90' : ''}`} />
                      </button>
                    ))}

                    <div className="bg-[#f8fbff] border border-sky-100 p-5 rounded-3xl text-xs space-y-2 mt-6">
                      <div className="text-sky-700 font-bold uppercase flex items-center justify-between border-b border-sky-100 pb-2">
                        <span>TODAY IN THE LAIR</span>
                        <span className="text-[10px] text-emerald-600">ALL GOOD</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Air scrubbers:</span>
                        <span className="text-emerald-600 font-bold">RUNNING</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Vent water:</span>
                        <span className="text-amber-600 font-bold">340°C</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Nap pods:</span>
                        <span className="text-emerald-600 font-bold">AVAILABLE</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Team morale:</span>
                        <span className="text-emerald-600 font-bold">VERY HIGH</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 bg-white border border-sky-100 rounded-3xl overflow-hidden shadow-xl shadow-sky-100 flex flex-col justify-between">
                    <div className="relative h-64 sm:h-80 overflow-hidden border-b border-sky-100 bg-slate-900">
                      <img
                        key={chambers[activeChamber].id}
                        src={chambers[activeChamber].image}
                        alt={chambers[activeChamber].title}
                        className="w-full h-full object-cover transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 border border-sky-200 rounded-full text-sky-700 text-xs font-bold shadow-sm">
                          {chambers[activeChamber].depth}
                        </div>
                        <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-sm">
                          {chambers[activeChamber].status}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                      <h3 className="text-xl sm:text-2xl font-grotesk font-bold text-sky-900 uppercase">
                        {chambers[activeChamber].title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{chambers[activeChamber].description}</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {chambers[activeChamber].features.map((feat) => (
                          <div
                            key={feat}
                            className="bg-[#f8fbff] border border-sky-100 p-3 rounded-2xl text-xs text-slate-700 flex items-center gap-2"
                          >
                            <Zap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* FRIENDLY BANNER */}
          <ScrollReveal animation="fade-in" durationMs={900}>
            <div className="relative z-10 w-full py-16 bg-gradient-to-r from-sky-500 via-sky-400 to-teal-400 overflow-hidden">
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
              <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center space-y-3">
                <h2 className="font-grotesk font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">
                  "WHERE THE SOFT STUFF COMES OFF AND THE SHELL GROWS IN."
                </h2>
                <p className="text-white/90 text-sm">And where every new friend is welcomed with open pincers.</p>
              </div>
            </div>
          </ScrollReveal>

          {/* HISTORY & TIMELINE SECTION */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <section className="relative z-10 w-full py-20 px-6 sm:px-12 max-w-[1200px] mx-auto">
              <div className="text-center space-y-4 mb-14">
                <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                  <History className="w-4 h-4" />
                  <span>OUR STORY</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
                  HOW WE GOT HERE
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {milestones.map((item) => (
                  <div
                    key={item.year}
                    className="bg-white border border-sky-100 p-6 rounded-3xl shadow-lg shadow-sky-100 space-y-3 relative hover:-translate-y-1 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold font-grotesk text-sky-600 group-hover:text-sky-500">
                        {item.year}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 group-hover:scale-150 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold font-grotesk text-sky-900 uppercase">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* LEADERSHIP SECTION */}
          <ScrollReveal animation="fade-up" durationMs={800}>
            <section id="leadership" className="relative z-10 w-full py-20 px-6 sm:px-12 bg-white border-y border-sky-100">
              <div className="max-w-[1200px] mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>MEET THE FAMILY</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
                    OUR LEADERSHIP
                  </h2>
                  <p className="text-sm text-slate-600 max-w-2xl mx-auto">
                    Marine engineers, chaplains, and one fully armored safety director, all of whom would love to
                    meet you.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {leadership.map((member) => (
                    <div
                      key={member.name}
                      className="bg-[#f8fbff] border border-sky-100 rounded-3xl p-6 flex flex-col items-center text-center hover:-translate-y-1 hover:shadow-xl transition-all group"
                    >
                      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-sky-200 bg-sky-50 mb-4">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <h3 className="text-lg font-bold font-grotesk text-sky-900 group-hover:text-sky-600 transition-colors">
                        {member.name}
                      </h3>
                      <div className="text-[11px] text-sky-600 font-bold uppercase mb-2">{member.title}</div>
                      <p className="text-xs text-slate-500 leading-relaxed">{member.bio}</p>
                    </div>
                  ))}
                </div>

                {/* CAREERS CTA */}
                <div className="bg-gradient-to-r from-sky-500 to-teal-400 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-sky-200">
                  <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-2xl font-grotesk font-bold uppercase tracking-tight">
                      JOIN OUR GROWING FAMILY!
                    </h3>
                    <p className="text-sm text-white/90 max-w-xl">
                      We're hiring friendly humans (and gentle crustaceans) at Trench Level 7. Good pay, unlimited
                      warm tea, and a short commute by submarine.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('careers')
                      setTimeout(() => scrollToElement('careers-hub'), 50)
                    }}
                    className="shrink-0 px-7 py-3.5 bg-white text-sky-600 font-grotesk font-extrabold text-sm uppercase tracking-wider rounded-full shadow-lg hover:bg-sky-50 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    VIEW OPEN ROLES
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </ScrollReveal>
        </>
      )}

      {/* CONTACT SECTION */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <section id="contact" className="relative z-10 w-full py-20 px-6 sm:px-12 bg-white border-t border-sky-100">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                <span>CONTACT</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
                GET IN TOUCH
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Questions about careers, visiting the lair, press, or anything else? Send us a note and we'll reply by
                email.
              </p>
            </div>

            <div className="grid md:grid-cols-12 gap-8">
              <div className="md:col-span-5 bg-[#f8fbff] border border-sky-100 p-6 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold font-grotesk text-sky-700 uppercase border-b border-sky-100 pb-3">
                  HEADQUARTERS
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">ADDRESS</div>
                    <div className="text-slate-700 font-bold mt-1">
                      Lair Alpha, Trench Level 7
                      <br />
                      Mariana Trench, Pacific Ocean
                      <br />
                      8,450 meters down
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">VISITING HOURS</div>
                    <div className="text-slate-700 mt-1">Always open. The vents never switch off, and neither does the kettle.</div>
                  </div>

                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">EMAIL</div>
                    <a href={`mailto:${SUPPORT_INBOX}`} className="text-sky-600 font-bold mt-1 inline-block hover:underline">
                      {SUPPORT_INBOX}
                    </a>
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-sky-100 p-6 sm:p-8 rounded-3xl shadow-xl shadow-sky-100">
                {contactSentTo ? (
                  <div className="py-12 text-center space-y-4" role="status">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="text-xl font-grotesk font-bold text-sky-900 uppercase">MESSAGE SENT</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Thanks for reaching out. We'll reply to {contactSentTo} as soon as we can.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSentTo(null)}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase rounded-full shadow-md"
                    >
                      SEND ANOTHER
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="org-contact-name" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                          NAME
                        </label>
                        <input
                          id="org-contact-name"
                          type="text"
                          required
                          autoComplete="name"
                          placeholder="Your name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="org-contact-email" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                          EMAIL
                        </label>
                        <input
                          id="org-contact-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="org-contact-topic" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        TOPIC
                      </label>
                      <select
                        id="org-contact-topic"
                        value={contactForm.topic}
                        onChange={(e) => setContactForm({ ...contactForm, topic: e.target.value })}
                        className={inputClass}
                      >
                        {CONTACT_TOPICS.map((topic) => (
                          <option key={topic} value={topic}>
                            {CONTACT_TOPIC_LABELS[topic]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="org-contact-message" className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        MESSAGE
                      </label>
                      <textarea
                        id="org-contact-message"
                        required
                        rows={4}
                        placeholder="How can we help?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className={`${inputClass} resize-none`}
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

                    <button
                      type="submit"
                      disabled={isContactSubmitting}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-grotesk font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg shadow-sky-200 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isContactSubmitting ? 'SENDING...' : 'SEND MESSAGE'}</span>
                    </button>

                    <label className="flex items-start gap-2.5 cursor-pointer group select-none pt-1">
                      <input
                        type="checkbox"
                        checked={contactForm.emailOptIn}
                        onChange={(e) => setContactForm({ ...contactForm, emailOptIn: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded border-sky-300 bg-[#f8fbff] text-sky-500 focus:ring-sky-400 focus:ring-offset-0 cursor-pointer accent-sky-500"
                      />
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors font-sans leading-tight">
                        Email me Moltology news and releases.
                      </span>
                    </label>

                    <TurnstileWidget
                      ref={contactTurnstileRef}
                      action={CONTACT_TURNSTILE_ACTION}
                      theme="light"
                      size="flexible"
                      onVerify={(token) => setContactTurnstileToken(token)}
                      onExpire={() => setContactTurnstileToken(null)}
                    />

                    {contactError && (
                      <p className="text-xs text-red-600 font-sans" role="alert">
                        {contactError}
                      </p>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <MainFooter
        variant="corporate"
        brandTitle="MOLTOLOGY.ORG FOUNDATION"
        brandTagline="A friendly foundation at the bottom of the Pacific."
        copyrightText="© 2026 MOLTOLOGY.ORG FOUNDATION. ALL RIGHTS RESERVED."
      />
    </div>
  )
}
