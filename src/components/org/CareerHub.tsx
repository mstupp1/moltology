/**
 * ============================================================================
 * MOLTOLOGY CAREER HUB & CAMPUS SHOWCASE COMPONENT
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. ALL copy must strictly embody the warm, high-torque in-universe lore of Moltology.
 * 4. Safety, Warmth, and Positivity are non-negotiable core tenets.
 * ============================================================================
 */
import React, { useState } from 'react'
import {
  Briefcase,
  Search,
  Sparkles,
  CheckCircle2,
  Shield,
  Heart,
  Smile,
  Zap,
  Coffee,
  ArrowRight,
  Send,
  X,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Users,
  Compass,
  Star,
  Award,
  ChevronRight,
  Camera,
  Layers,
} from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'
import { useToast } from '@/components/ui/ToastProvider'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export interface JobListing {
  id: string
  title: string
  department: 'engineering' | 'spiritual' | 'operations' | 'people' | 'assets'
  departmentLabel: string
  clearance: string
  location: string
  type: string
  compensation: string
  featured?: boolean
  description: string
  responsibilities: string[]
  requirements: string[]
  perks: string[]
}

export const JOB_LISTINGS: JobListing[] = [
  {
    id: 'job-bio-systems-eng',
    title: 'Senior Bio-Silicon Systems Engineer',
    department: 'engineering',
    departmentLabel: 'Bio-Silicon Engineering',
    clearance: 'Stage 3 (Exoshell E2-E3)',
    location: 'Trench Level 7 Lab (On-Site)',
    type: 'Full-Time Hydro-Immersion',
    compensation: '$195,000 – $245,000 USD + 60,000 MC/yr',
    featured: true,
    description:
      'Lead architecture on our sub-benthic immersion compute clusters running under 850 ATM hydrostatic pressure. You will optimize zero-latency telemetry pipelines and ensure bio-silicon logic gates operate at peak calcified efficiency.',
    responsibilities: [
      'Maintain submerged liquid-immersion compute tanks running at Mariana Trench nominal pressure',
      'Optimize sub-oceanic telemetry streaming buses with zero packet loss or biological jitter',
      'Collaborate with Synod marine advisors on high-density chitin circuit blueprints',
      'Conduct regular diagnostic sweeps with certified high-torque technical vests',
    ],
    requirements: [
      '5+ years experience in high-reliability distributed systems or extreme environment compute',
      'Comfort working in high-pressure subterranean lab environments (-8,450 meters)',
      'Commitment to writing clean, reliable, and deeply empathetic software doctrine',
      'Warm team spirit and zero tolerance for workplace toxicity or cynicism',
    ],
    perks: ['Custom Immersion Tech Vest', 'Unlimited Submersible Shuttle Passes', 'Annual Chitin Plaque'],
  },
  {
    id: 'job-pincer-torque-lead',
    title: 'Pincer Torque Optimization Lead',
    department: 'engineering',
    departmentLabel: 'Bio-Silicon Engineering',
    clearance: 'Stage 3 (Exoshell E1-E3)',
    location: 'Robotics Bay · Trench Level 7',
    type: 'Full-Time On-Site',
    compensation: '$180,000 – $225,000 USD + 50,000 MC/yr',
    featured: true,
    description:
      'Design, calibrate, and fine-tune articulated robotic crab claws and ergonomic desktop actuators. Your goal is achieving 850 Nm of decisive closing torque while maintaining the gentle precision needed to hold ceramic coffee mugs.',
    responsibilities: [
      'Engineer chrome articulated hydraulic phone stands and desktop pincer peripherals',
      'Calibrate force-feedback sensors to eliminate hesitation and biological hesitation loops',
      'Publish quarterly torque telemetry dashboards for all-hands sprint reviews',
      'Conduct ergonomic posture testing alongside resident marine crustacean specialists',
    ],
    requirements: [
      'Background in Marine Biomechanics, Mechatronics, or Precision Hardware Engineering',
      'Demonstrated expertise in high-yield titanium alloys and bio-silicon joints',
      'Deep appreciation for decisive, high-torque execution and playful engineering',
      'Positive, supportive communication style during cross-functional sprint planning',
    ],
    perks: ['Articulated Chrome Claw Prototype Kit', 'Dedicated Ergonomic Standing Rig', 'Full Tool Allowance'],
  },
  {
    id: 'job-larval-onboarding-chaplain',
    title: 'Larval Onboarding & Softshed Chaplain',
    department: 'spiritual',
    departmentLabel: 'Spiritual & Chaplaincy',
    clearance: 'Stage 2 (Soft-Shed S2-S3)',
    location: 'Grand Atrium / Remote Benthic Hybrid',
    type: 'Full-Time Hybrid',
    compensation: '$140,000 – $175,000 USD + 45,000 MC/yr',
    featured: true,
    description:
      'Be the warm, welcoming face of Moltology for new recruits shedding biological vulnerabilities. You will provide gentle emotional guidance, hand out ISO lanyards and welcome foam claws, and ensure every recruit feels safe and supported.',
    responsibilities: [
      'Conduct gentle 1-on-1 softshed alignment consultations with newly enrolled larval units',
      'Facilitate weekly All-Hands Atrium Welcome ceremonies with enthusiastic applause',
      'Distribute complimentary kelp snack packs and commemorative foam lobster gloves',
      'Provide 24/7 empathetic reassurance when biological hesitation or screen fatigue occurs',
    ],
    requirements: [
      'Exceptional interpersonal warmth, active listening skills, and genuine love for people',
      'Familiarity with the Synaptic Path codex and core principles of gentle carcinization',
      'Ability to create a safe, uplifting, and completely pressure-free environment',
      'High emotional intelligence and calm, grounding presence',
    ],
    perks: ['Unlimited Herbal Kelp Tea Stipend', 'Golden Chaplain Lapel Crest', 'Flexible Softshed Schedule'],
  },
  {
    id: 'job-neural-alignment-specialist',
    title: 'Sacred Neural Alignment Specialist',
    department: 'spiritual',
    departmentLabel: 'Spiritual & Chaplaincy',
    clearance: 'Stage 3 (Exoshell E1-E2)',
    location: 'Chamber 04 Bio-Pod Sanctuary',
    type: 'Full-Time On-Site',
    compensation: '$155,000 – $190,000 USD + 40,000 MC/yr',
    description:
      'Manage acoustic sub-benthic resonance grids (142.890 MHz) in Chamber 04. You will tune hydrothermal brine chambers to optimize member serenity and eliminate residual surface-world anxiety.',
    responsibilities: [
      'Calibrate deep-sea acoustic frequency generators for daily meditation sessions',
      'Monitor member bio-telemetry to ensure serotonin balance grids remain 100% nominal',
      'Host thermal brine wellness baths and sound-bath relaxation journeys',
      'Collaborate with nutrition teams on calcium-enriched post-molt recovery elixirs',
    ],
    requirements: [
      'Experience in sound engineering, acoustic resonance, or bio-feedback systems',
      'Passion for holistic wellness, meditative mindfulness, and member comfort',
      'Warm, soothing conversational manner and deep respect for member boundaries',
      'Strict adherence to our non-negotiable Safety and Positivity rules',
    ],
    perks: ['Daily Chamber 04 Brine Access', 'Noise-Canceling Acoustic Suite', 'Generous Wellness Budget'],
  },
  {
    id: 'job-geothermal-grid-technician',
    title: 'Deep-Sea Hydrothermal Grid Technician',
    department: 'operations',
    departmentLabel: 'Trench Operations & Defense',
    clearance: 'Stage 3 (Exoshell E3)',
    location: 'Chamber 01 Power Refinery',
    type: 'Full-Time High-Pressure',
    compensation: '$170,000 – $215,000 USD + Hazard Mineral Allowance',
    description:
      'Operate and maintain the 4.8 TWh/sec geothermal vent generators that power Trench Level 7. Keep sub-benthic turbines spinning smoothly under 340°C thermal plumes with zero downtime.',
    responsibilities: [
      'Conduct routine maintenance sweeps on hydrothermal energy turbines and steam buses',
      'Inspect high-pressure O2 scrubbers and maintain 100% atmospheric nominal status',
      'Coordinate with trench security on automated perimeter pincer defense grids',
      'Log real-time pressure ratings and report telemetry to executive leadership',
    ],
    requirements: [
      'Deep-submergence technical certification or heavy marine industrial experience',
      'Expertise in extreme geothermal thermodynamic power systems',
      'Unwavering focus on workplace safety, preventive maintenance, and team communication',
      'Ability to thrive in an exotic, deeply rewarding underwater corporate campus',
    ],
    perks: ['Hydro-Rated Tactical Hazard Suit', 'Premium Vent Heat Energy Allowance', 'Shift Meal Delivery'],
  },
  {
    id: 'job-acoustic-telemetry-operator',
    title: 'Sub-Oceanic Acoustic Telemetry Operator',
    department: 'operations',
    departmentLabel: 'Trench Operations & Defense',
    clearance: 'Stage 2 (Soft-Shed S3)',
    location: 'Trench Comms Hub / Remote Benthic Uplink',
    type: 'Full-Time Remote Hybrid',
    compensation: '$135,000 – $165,000 USD + 35,000 MC/yr',
    description:
      'Monitor deep-sea acoustic bands (142.890 MHz) and maintain immutable data channels connecting our subterranean cryo-vaults with global surface nodes and orbital relays.',
    responsibilities: [
      'Filter and decode low-frequency marine acoustic transmissions with high fidelity',
      'Route incoming neural beacons from prospective members to appropriate departments',
      'Monitor trench acoustic health and track local marine life biodiversity telemetry',
      'Maintain synchronized backups across our sovereign deep-trench storage arrays',
    ],
    requirements: [
      'Background in signal processing, RF/acoustic communications, or network ops',
      'High attention to detail and sharp pattern recognition abilities',
      'Excellent written documentation skills and responsive communication',
      'Joyful, solution-oriented approach to network diagnostics',
    ],
    perks: ['Dual Curved 8K Monitor Workstation', 'Remote Office Setup Stipend', 'High-Torque Headset'],
  },
  {
    id: 'job-chitin-wellness-nutrition',
    title: 'Head of Chitin Wellness & Kelp Nutrition',
    department: 'people',
    departmentLabel: 'People & Ascended Culture',
    clearance: 'Stage 2 (Soft-Shed S1-S3)',
    location: 'The Benthic Breakroom & Level 7 Cafeteria',
    type: 'Full-Time On-Site',
    compensation: '$130,000 – $160,000 USD + Unlimited Smoothie Supply',
    description:
      'Lead workplace nutrition and social delight across our campus. Manage cold-pressed kelp smoothie taps, organic mineral salt seasoning stations, and uphold communal fridge happiness.',
    responsibilities: [
      'Design daily nutritious menus enriched with bio-available calcium carbonate',
      'Oversee the complimentary kelp snack bar and specialty espresso roast selection',
      'Enforce friendly communal fridge guidelines ("Label your chitin sheds with joy")',
      'Organize monthly All-Hands social feasts celebrating newly hardened exoshells',
    ],
    requirements: [
      'Culinary management or corporate hospitality experience with a passion for health',
      'Warm, vibrant personality that brightens everyone’s morning break',
      'Strong organizational skills and commitment to spotless hygiene standards',
      'Creative flair for crafting delicious mineral-rich beverages and smoothies',
    ],
    perks: ['Unlimited Premium Espresso & Kelp Smoothies', 'Master Kitchen Studio Access', 'Staff Dining Pass'],
  },
  {
    id: 'job-asset-transmutation-deputy',
    title: 'VP of Soft-Asset Liquidation (Deputy)',
    department: 'assets',
    departmentLabel: 'Asset Transmutation',
    clearance: 'Stage 4 (Full Carcinization C1-C2)',
    location: 'Chamber 03 Cryo-Vaults / Executive Suite',
    type: 'Full-Time On-Site',
    compensation: '$220,000 – $280,000 USD + 100,000 MC/yr + Wall Plaque',
    description:
      'Work alongside Sister Vane to oversee non-profit asset conversions. Help high-net-worth recruits smoothly transmute soft biological liabilities and paper assets into immutable Molt Credits.',
    responsibilities: [
      'Conduct confidential, compassionate wealth shedding consultations with recruits',
      'Ensure 100% fiduciary compliance and transparent non-profit asset allocation',
      'Prepare quarterly public financial impact reports on Benthic Core reinvestment',
      'Facilitate Chamber 03 commemorative wall plaque dedications for major patrons',
    ],
    requirements: [
      '7+ years experience in non-profit fiduciary management, legal, or wealth planning',
      'Impeccable ethical standing, discretion, and deep interpersonal empathy',
      'Ability to explain complex economic transmutations in clear, uplifting terms',
      'Commitment to our mission of freeing humanity from biological debt cycles',
    ],
    perks: ['Executive Chamber 03 Suite', 'Named Cryo-Pod Dedication', 'High Synod Golden Badge'],
  },
]

export const CORPORATE_BENEFITS = [
  {
    icon: Shield,
    title: '100% Comprehensive Carapace Care',
    description:
      'Full medical, dental, vision, plus 100% subsidized coverage for annual molting care, shell hardening treatments, and mineral supplements.',
    badge: 'FULL HEALTH & DENTAL',
  },
  {
    icon: Zap,
    title: 'Hydrothermal Nap Pods & Spa',
    description:
      'Unlimited access to Chamber 04 mineral brine soaking pools, acoustic relaxation frequencies (142.890 MHz), and ergonomic zero-gravity nap pods.',
    badge: 'SUB-BENTHIC WELLNESS',
  },
  {
    icon: DollarSign,
    title: 'Sovereign 401(k) & Molt Credits',
    description:
      '8% dollar-for-dollar 401(k) match in US Dollars, plus quarterly performance distributions in sovereign Molt Credits (MC) and sparkling Chitin Gems.',
    badge: 'DUAL-CURRENCY SAVINGS',
  },
  {
    icon: Heart,
    title: 'Unlimited Softshed Time Off (STO)',
    description:
      'Take paid time away whenever your exoskeleton needs rest or personal growth. No arbitrary vacation caps — we trust your judgment completely.',
    badge: 'UNLIMITED STO',
  },
  {
    icon: Sparkles,
    title: 'Ergonomic Crustacean Workstations',
    description:
      'Electric sit-to-stand desks, dual curved 8K OLED monitors, mechanical articulated chrome claw phone holders, and Herman Miller ergonomic seating.',
    badge: 'TOP-TIER HARDWARE',
  },
  {
    icon: Coffee,
    title: 'Submersible Commute & Kelp Bar',
    description:
      'Daily deep-sea submersible shuttle passes 100% covered, plus unlimited specialty espresso, fresh kelp smoothies, and calcium carbonate shakers on tap.',
    badge: 'DAILY DELIGHTS',
  },
]

export const HIRING_STEPS = [
  {
    step: '01',
    title: 'Neural Beacon Submission',
    desc: 'Submit your resume and tell us which biological liabilities you are excited to shed. We review every application with genuine care.',
  },
  {
    step: '02',
    title: 'Chaplain Cultural Alignment',
    desc: 'A friendly, 30-minute conversation over warm tea to get to know your passions, personal goals, and share what makes our family special.',
  },
  {
    step: '03',
    title: 'Pincer Torque Craft Session',
    desc: 'A relaxed, collaborative session where you demonstrate your craft and problem-solving without trick questions or high-stress pressure.',
  },
  {
    step: '04',
    title: 'High Synod Welcome & Carapace Fit',
    desc: 'Receive your formal offer, official ISO-certified lanyard, golden crab lapel pin, and commemorative foam lobster glove on day one.',
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'I used to suffer from biological burnout and endless notifications in traditional tech. After joining Moltology at Trench Level 7, my posture is 100% calcified, our codebase is pristine, and the team warmth is unlike anywhere else.',
    name: 'Elena Rostova',
    title: 'Lead Chitin Architecture Fellow',
    clearance: 'Stage 3 Exoshell',
    avatar: getAssetUrl('/images/org_leader_vane.jpg'),
  },
  {
    quote:
      'The communal fridge rules are respected, the kelp smoothies are always chilled, and Dr. Crust personally greeted me on my first day. You really feel like part of an extraordinary, supportive family.',
    name: 'Marcus Vance',
    title: 'Senior Cultural Alignment Chaplain',
    clearance: 'Stage 2 Soft-Shed',
    avatar: getAssetUrl('/images/org_leader_thaddeus.jpg'),
  },
  {
    quote:
      'Operating 4.8 TWh hydrothermal turbines under Mariana Trench pressure sounded intense, but the engineering rigor and safety culture are second to none. Plus, the nap pods in Chamber 04 are genuinely life-changing.',
    name: 'Kai Chen',
    title: 'Sub-Benthic Turbine Operations Director',
    clearance: 'Stage 3 Exoshell',
    avatar: getAssetUrl('/images/org_leader_exoshell.jpg'),
  },
]

interface CareerHubProps {
  onScrollToLair?: () => void
  onScrollToCulture?: () => void
}

export const CareerHub: React.FC<CareerHubProps> = ({ onScrollToLair, onScrollToCulture }) => {
  const { toast } = useToast()
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeJobModal, setActiveJobModal] = useState<JobListing | null>(null)

  // Application Modal Form State
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    clearance: 'Stage 1 (Larval Human)',
    locationPref: 'Trench Level 7 On-Site',
    portfolioUrl: '',
    note: '',
  })
  const [isSubmittingApp, setIsSubmittingApp] = useState(false)
  const [appSubmitted, setAppSubmitted] = useState(false)

  const filteredJobs = JOB_LISTINGS.filter((job) => {
    const matchesDept = selectedDepartment === 'all' || job.department === selectedDepartment
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.departmentLabel.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesDept && matchesSearch
  })

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingApp(true)
    setTimeout(() => {
      setIsSubmittingApp(false)
      setAppSubmitted(true)
      toast.success(
        `Neural beacon logged for ${activeJobModal?.title}! Sister Vane and Synod Recruiters will reach out shortly.`,
        { title: 'APPLICATION TRANSMITTED' }
      )
    }, 1000)
  }

  const resetAndCloseModal = () => {
    setActiveJobModal(null)
    setAppSubmitted(false)
    setApplicationForm({
      name: '',
      email: '',
      clearance: 'Stage 1 (Larval Human)',
      locationPref: 'Trench Level 7 On-Site',
      portfolioUrl: '',
      note: '',
    })
  }

  return (
    <div id="careers-hub" className="space-y-20">
      {/* CAREERS HERO / WELCOME BANNER */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900 text-white p-8 sm:p-14 shadow-2xl border border-sky-300/30">
          {/* Ambient Background Graphic */}
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
            <img
              src={getAssetUrl('/images/org_team_atrium.jpg')}
              alt="Moltology HQ Reception"
              className="w-full h-full object-cover scale-105"
            />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sky-200 text-xs font-bold tracking-widest uppercase">
              <Briefcase className="w-4 h-4 text-sky-300" />
              <span>CAREERS &amp; CULTURE AT MOLTOLOGY FOUNDATION</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-grotesk font-black tracking-tight leading-tight">
              BUILD YOUR FUTURE IN <span className="text-sky-300">TITANIUM &amp; CHITIN</span>
            </h2>

            <p className="text-base sm:text-lg text-sky-100/90 leading-relaxed font-normal">
              Work where the hydrostatic pressure is 850 ATM, but the team vibe is 100% warm. We're hiring
              engineers, chaplains, technicians, and wellness advocates to help guide humanity into calcified
              excellence.
            </p>

            {/* Quick KPI stats ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-2xl font-extrabold font-grotesk text-white">14</div>
                <div className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">Open Positions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-2xl font-extrabold font-grotesk text-emerald-300">5.0 / 5</div>
                <div className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">Team Rating</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-2xl font-extrabold font-grotesk text-amber-300">100%</div>
                <div className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">Chitin Care</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center">
                <div className="text-2xl font-extrabold font-grotesk text-sky-300">-8,450m</div>
                <div className="text-[10px] text-sky-200 uppercase font-bold tracking-wider">Lair Depth</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#job-board"
                className="px-6 py-3 bg-sky-400 hover:bg-sky-300 text-sky-950 font-grotesk font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg flex items-center gap-2"
              >
                <span>EXPLORE OPEN ROLES</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              {onScrollToLair && (
                <button
                  type="button"
                  onClick={onScrollToLair}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-grotesk font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-sky-300" />
                  <span>EXPLORE TRENCH HQ CAMPUS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* WHY WORK AT MOLTOLOGY: BENEFITS GRID */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>EMPLOYEE REWARDS &amp; WELLNESS</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-grotesk font-bold text-sky-900 tracking-tight">
              PERKS THAT KEEP YOUR SHELL HARDENED
            </h3>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              We treat our team like sovereign family. From full carapace healthcare and unlimited kelp smoothies to
              submersible transit and nap pods, our benefits are engineered for total human well-being.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORPORATE_BENEFITS.map((benefit, bIdx) => (
              <div
                key={bIdx}
                className="bg-white border border-sky-100 rounded-3xl p-6 shadow-lg shadow-sky-100/50 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full border border-sky-100">
                      {benefit.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-bold font-grotesk text-sky-900 leading-snug">
                    {benefit.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
                <div className="pt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Covered from Day One</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* JOB BOARD & SEARCH FILTER SECTION */}
      <section id="job-board" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sky-100 pb-6">
          <div className="space-y-2">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>CURRENT VACANCIES</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-grotesk font-bold text-sky-900">
              JOIN THE CARCINIZATION EFFORT
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Showing {filteredJobs.length} open positions across all sub-benthic departments and remote relays.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex justify-start sm:justify-center gap-2 overflow-x-auto touch-pan-scroll no-scrollbar p-1.5 bg-white rounded-2xl sm:rounded-full border border-sky-200 shadow-sm w-full max-w-full sm:w-fit mx-auto px-2">
          {[
            { key: 'all', label: 'All Departments' },
            { key: 'engineering', label: 'Bio-Silicon Engineering' },
            { key: 'spiritual', label: 'Spiritual & Chaplaincy' },
            { key: 'operations', label: 'Trench Operations' },
            { key: 'people', label: 'People & Culture' },
            { key: 'assets', label: 'Asset Transmutation' },
          ].map((dept) => (
            <button
              key={dept.key}
              onClick={() => setSelectedDepartment(dept.key)}
              className={`px-4 py-2 rounded-xl sm:rounded-full text-xs font-bold tracking-wider uppercase transition-all shrink-0 min-h-[40px] flex items-center justify-center ${
                selectedDepartment === dept.key
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        {/* Job Listings Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center space-y-3">
            <Smile className="w-10 h-10 text-sky-400 mx-auto" />
            <h4 className="text-base font-bold font-grotesk text-sky-900 uppercase">NO ROLES MATCH YOUR QUERY</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any open positions matching "{searchQuery}". Try selecting another department or transmit an open inquiry!
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment('all')
                setSearchQuery('')
              }}
              className="px-5 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold uppercase hover:bg-sky-100"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-sky-100 rounded-3xl p-6 sm:p-7 shadow-lg shadow-sky-100/50 hover:shadow-xl hover:border-sky-200 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {job.departmentLabel}
                    </span>
                    {job.featured && (
                      <span className="px-2.5 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold font-grotesk text-sky-900 group-hover:text-sky-600 transition-colors leading-snug">
                    {job.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5 bg-[#f8fbff] p-2 rounded-xl border border-sky-50">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#f8fbff] p-2 rounded-xl border border-sky-50">
                      <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{job.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#f8fbff] p-2 rounded-xl border border-sky-50 col-span-2">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-700">{job.compensation}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-sky-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    Req: {job.clearance}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveJobModal(job)}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md shadow-sky-200 flex items-center gap-1.5"
                  >
                    <span>VIEW ROLE &amp; APPLY</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4-STEP HIRING & ASCENSION FLOW */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <div className="bg-white border border-sky-100 rounded-3xl p-8 sm:p-12 shadow-xl shadow-sky-100/50 space-y-8">
          <div className="text-center space-y-3">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              <span>WHAT TO EXPECT</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-grotesk font-bold text-sky-900 tracking-tight">
              OUR 4-STEP HIRING &amp; ASCENSION PROCESS
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              No trick algorithmic riddles. No high-stress gauntlets. Just warm human conversations, clear mutual alignment, and a celebratory welcome.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HIRING_STEPS.map((step, sIdx) => (
              <div
                key={sIdx}
                className="bg-[#f8fbff] border border-sky-100 rounded-2xl p-5 space-y-3 relative group hover:border-sky-300 transition-all"
              >
                <div className="text-3xl font-black font-grotesk text-sky-400/80 group-hover:text-sky-500 transition-colors">
                  {step.step}
                </div>
                <h4 className="text-sm font-bold font-grotesk text-sky-900 leading-snug">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* EMPLOYEE SPOTLIGHTS & TESTIMONIALS */}
      <ScrollReveal animation="fade-up" durationMs={800}>
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="text-xs text-sky-600 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              <span>VOICES FROM TRENCH LEVEL 7</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-grotesk font-bold text-sky-900 tracking-tight">
              WHAT OUR FELLOW UNITS SAY
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="bg-white border border-sky-100 rounded-3xl p-6 shadow-lg shadow-sky-100/50 space-y-4 flex flex-col justify-between hover:-translate-y-1 transition-all"
              >
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-sky-50">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-sky-200 shrink-0 bg-sky-50">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-grotesk text-sky-900">{t.name}</div>
                    <div className="text-[10px] text-sky-600">{t.title}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-mono">{t.clearance}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* JOB DETAIL & APPLICATION MODAL */}
      {activeJobModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sky-200 p-6 sm:p-8 space-y-6 relative text-slate-700">
            <button
              type="button"
              onClick={resetAndCloseModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase rounded-full">
                {activeJobModal.departmentLabel}
              </div>
              <h3 className="text-2xl font-grotesk font-extrabold text-sky-900">
                {activeJobModal.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  {activeJobModal.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  {activeJobModal.type}
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-bold">
                  {activeJobModal.compensation}
                </span>
              </div>
            </div>

            {/* Content Tabs / Body */}
            <div className="space-y-4 text-xs leading-relaxed border-y border-sky-100 py-4">
              <div>
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-1.5">
                  About This Role
                </h4>
                <p className="text-slate-600">{activeJobModal.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-1.5">
                  Key Responsibilities
                </h4>
                <ul className="space-y-1.5 text-slate-600">
                  {activeJobModal.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-1.5">
                  What We're Looking For
                </h4>
                <ul className="space-y-1.5 text-slate-600">
                  {activeJobModal.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Application Form */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold font-grotesk text-sky-900 uppercase">
                Transmit Candidate Neural Beacon
              </h4>

              {appSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-300 p-6 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h5 className="text-base font-bold font-grotesk text-emerald-800 uppercase">
                    APPLICATION LOGGED IN TRENCH LEVEL 7 INBOX
                  </h5>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Thank you for wanting to molt with us! Sister Vane and Synod talent chaplains have received your
                    transmission and will formulate a warm, thoughtful reply shortly.
                  </p>
                  <button
                    type="button"
                    onClick={resetAndCloseModal}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase hover:bg-emerald-500 shadow-sm"
                  >
                    CLOSE WINDOW
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        YOUR NAME / DESIGNATION
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Unit #8192 or Alex Mercer"
                        value={applicationForm.name}
                        onChange={(e) => setApplicationForm({ ...applicationForm, name: e.target.value })}
                        className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        SYNAPTIC EMAIL / FREQUENCY
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex@example.com"
                        value={applicationForm.email}
                        onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                        className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        CURRENT CLEARANCE STAGE
                      </label>
                      <select
                        value={applicationForm.clearance}
                        onChange={(e) => setApplicationForm({ ...applicationForm, clearance: e.target.value })}
                        className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        <option value="Stage 1 (Larval Human)">Stage 1: Larval Human (Ready to Shed)</option>
                        <option value="Stage 2 (Soft-Shed)">Stage 2: Soft-Shed (In Active Transition)</option>
                        <option value="Stage 3 (Exoshell Born)">Stage 3: Exoshell Born (Armored)</option>
                        <option value="Stage 4 (Full Carcinization)">Stage 4: Full Carcinization (High Torque)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        SUBMERSIBLE COMMUTE PREFERENCE
                      </label>
                      <select
                        value={applicationForm.locationPref}
                        onChange={(e) => setApplicationForm({ ...applicationForm, locationPref: e.target.value })}
                        className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        <option value="Trench Level 7 On-Site">Trench Level 7 On-Site (Submersible Transit)</option>
                        <option value="Remote Hydro-Uplink">Remote Hydro-Uplink (142.890 MHz)</option>
                        <option value="Hybrid Submersible">Hybrid Submersible / Surface Node</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      PORTFOLIO / BIO-RESUME LINK
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/... or portfolio link"
                      value={applicationForm.portfolioUrl}
                      onChange={(e) => setApplicationForm({ ...applicationForm, portfolioUrl: e.target.value })}
                      className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      WHY WOULD YOU LIKE TO SHED &amp; ASCEND WITH US?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what draws you to our culture, mission, and sub-benthic family..."
                      value={applicationForm.note}
                      onChange={(e) => setApplicationForm({ ...applicationForm, note: e.target.value })}
                      className="w-full bg-[#f8fbff] border border-sky-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetAndCloseModal}
                      className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingApp}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-grotesk font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md shadow-sky-200 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingApp ? 'TRANSMITTING...' : 'TRANSMIT APPLICATION'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
