import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'libido',
  topic: 'Libido',
  kit: 'clinic',
  query: 'low libido and low drive',
  title: 'Libido and low drive: a daily plan | Moltology',
  description:
    'Low drive often follows bad days, not bad genes. Take a free three minute assessment and get eight small daily tasks that bring your focus and energy back.',
  keywords: 'low libido, low drive, how to get your drive back, low motivation, daily routine, focus plan',
  indexed: true,
  updated: '2026-11-22',
  disclaimer:
    'Moltology is a free practice and community, not a medical service. If a change in libido is sudden or worrying, talk to a doctor.',
  shareImage: {
    src: '/images/benefits/libido/share.jpg',
    alt: 'A crab in a clinic coat beside the words "Get your drive back"',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Grip, from the Codex',
    href: '/codex/scr-030#verse-3',
    text: 'The plan follows the Daily Shedding Routine. Its first-hour step, The Grip, asks you to name the one thing that matters today and start on it before anything else gets a say.',
  },
  reveal: {
    headline: 'Your plan lives in a real app.',
    body: 'The assessment is the Moltmax quiz, and the plan is the eight daily tasks.',
    screenshot: 'dashboard',
  },
  related: ['energy-drinks', 'spirituality'],
  faqs: [
    {
      question: 'Can Moltology increase my libido?',
      answer:
        'Not directly. It works on the everyday things that often flatten drive, like short sleep, constant phone use and days with no clear goal. If a drop in libido is sudden or worrying, see a doctor.',
    },
    {
      question: 'Is this a medical service?',
      answer: 'No. There are no doctors, prescriptions or supplements. Moltology is a free daily practice and community.',
    },
    {
      question: 'What is the assessment?',
      answer:
        'The Moltmax quiz: 15 questions that score your boundaries, follow-through, focus, adaptability and calm under pressure. It takes about three minutes and needs no account.',
    },
    {
      question: 'What does the daily plan involve?',
      answer:
        'Eight short tasks from early morning to evening, such as sitting quietly before you open your phone, one block of deep work and letting one thing go at night. Most take a few minutes.',
    },
    {
      question: 'What causes low libido?',
      answer:
        'Many things, including stress, short sleep, relationship strain, hormones, medicines and other health conditions. If it changed suddenly or worries you, talk to a doctor first. Moltology only works on the everyday habits part.',
    },
    {
      question: 'Can sleep and stress affect sex drive?',
      answer:
        'Both are commonly linked to lower desire. Getting to bed on time and having fewer frantic days are reasonable places to start, alongside any medical advice.',
    },

  ],
  content: {
    hero: {
      eyebrow: 'Online assessment · free',
      headline: 'Low libido? Start with the ordinary things.',
      sub: 'Short nights, endless feeds and days with no point to them can flatten drive. Moltology gives you a three minute assessment and a daily plan for that part.',
      checks: ['Free, no card', 'About three minutes', 'Plan ready the same day'],
      cta: 'Get your free plan',
      image: {
        src: '/images/benefits/libido/hero.jpg',
        alt: 'A calm crab in a pale clinic coat holding a clipboard, soft daylight',
        width: 1024,
        height: 1280,
      },
    },
    trust: ['Free to join', 'No pills or prescriptions', '8 small daily tasks', 'Nothing to cancel'],
    signs: {
      title: 'Sound familiar?',
      intro: 'These are the common signs. None of them need a prescription.',
      items: [
        'You reach for your phone before you are fully awake',
        'Evenings vanish into a feed you will not remember',
        'Nothing on today’s list feels like yours',
        'You are tired, but not from doing anything',
        'Plans keep sliding to next week',
      ],
    },
    steps: {
      title: 'How it works',
      items: [
        {
          title: 'Take the assessment',
          body: 'Fifteen questions score you on boundaries, follow-through, focus, adaptability and calm under pressure.',
        },
        {
          title: 'Get your daily plan',
          body: 'Eight small tasks spread through the day, from a quiet start before your phone to closing the day on purpose.',
        },
        {
          title: 'Check in, not out',
          body: 'Tick tasks off, keep your streak and ask the Oracle, our AI guide, when a day goes sideways.',
        },
      ],
    },
    plans: {
      title: 'Choose your plan',
      intro: 'Every plan is free. Start with the one that sounds most like your week.',
      items: [
        {
          name: 'The morning reset',
          tag: 'Start here',
          body: 'Sit quietly before any feed, then pick your one thing. Two tasks, about fifteen minutes.',
          href: '/codex/scr-030#verse-2',
        },
        {
          name: 'The deep work block',
          tag: 'For scattered days',
          body: 'One block a day with notifications off and a single task open.',
          href: '/codex/scr-031',
        },
        {
          name: 'The evening wind down',
          tag: 'For late nights',
          body: 'Let one thing go, close the day and stop. It is done either way.',
          href: '/codex/scr-032',
        },
      ],
    },
    compare: {
      title: 'Moltology vs. another night of scrolling',
      us: 'Moltology',
      them: 'Scrolling',
      rows: [
        { label: 'Cost', us: 'Free', them: 'Free, plus your evening' },
        { label: 'Time', us: 'A few minutes per task', them: 'Hours, somehow' },
        { label: 'Side effects', us: 'A clearer head', them: 'Next-day fog' },
        { label: 'You end up with', us: 'One thing done', them: 'A sore thumb' },
      ],
    },
  },
}

export default page
