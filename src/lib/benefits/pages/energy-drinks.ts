import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'energy-drinks',
  topic: 'Energy drinks',
  kit: 'can',
  query: 'energy drink alternative',
  title: 'The energy drink alternative with zero caffeine | Moltology',
  description:
    'Tired of the 3pm crash? Moltology is an energy drink alternative with zero sugar and zero caffeine: eight small daily tasks that keep your energy steady. Free.',
  keywords: 'energy drink alternative, no caffeine energy, afternoon slump, 3pm crash, natural energy, daily routine',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/energy-drinks/share.jpg',
    alt: 'A bright Moltology can with a crab on the label',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Low Tide, from the Codex',
    href: '/codex/scr-030#verse-5',
    text: 'The noon reset comes from the Daily Shedding Routine, which calls it Low Tide: clear one distraction, then choose the next useful thing to do.',
  },
  reveal: {
    headline: 'The can was a costume. The app is real.',
    body: 'Moltology is a free daily practice with eight tasks, a streak, an AI guide and a community. Make an account to start your first day, or try the demo with nothing to sign.',
    screenshot: 'dashboard',
  },
  related: ['libido', 'spirituality'],
  faqs: [
    {
      question: 'Is Moltology an energy drink?',
      answer:
        'No. It is a free app and community built around eight small daily tasks. There is nothing to drink, so there is no sugar or caffeine.',
    },
    {
      question: 'Can it replace my energy drink?',
      answer:
        'Many afternoon slumps come from short sleep, long unbroken screen time and no clear plan. The daily tasks go after those habits. If you rely on caffeine, cut back slowly rather than all at once.',
    },
    {
      question: 'What are the eight daily tasks?',
      answer:
        'Sit in silence, pick your one thing, learn something hard, reset your focus, do deep work, help a member, let one thing go, and close the day.',
    },
    {
      question: 'How long does it take each day?',
      answer: 'Most tasks take a few minutes. Deep work is the longest, and you decide how long it runs.',
    },
    {
      question: 'Is it really free?',
      answer:
        'Yes. The daily tasks, the forum and the Codex are free. Oracle MAX is an optional paid plan for heavy use of the AI guide.',
    },
    {
      question: 'Can I try it first?',
      answer: 'Yes. The demo opens the full dashboard as a guest, no account needed.',
    },
  ],
  content: {
    hero: {
      sticker: 'Zero sugar · zero caffeine',
      headline: 'Crack open a better afternoon.',
      sub: 'Moltology is the energy drink alternative you do not drink. Eight small tasks spread across the day keep your focus up and stop the 3pm cliff. Free, with nothing to recycle.',
      cta: 'Grab a free account',
      image: {
        src: '/images/benefits/energy-drinks/hero.jpg',
        alt: 'A tall bright can with a cartoon crab on the label, splashing out of ice',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Zero sugar', 'Zero caffeine', 'Zero crash', 'Eight tasks a day', 'Free to join'],
    flavors: {
      title: 'Pick your flavor',
      items: [
        { name: 'Original Focus', note: 'Pick your one thing in the first hour and start on it.', tone: 'lime' },
        { name: 'Low Tide Berry', note: 'A noon reset: clear one distraction, choose the next useful move.', tone: 'berry' },
        { name: 'Deep Dive Citrus', note: 'One block of deep work with everything else switched off.', tone: 'citrus' },
        { name: 'Night Ice', note: 'Let one thing go, close the day, and actually sleep.', tone: 'ice' },
      ],
    },
    label: {
      title: 'Nutrition facts',
      serving: 'Serving size: 1 day',
      rows: [
        { label: 'Calories', value: '0' },
        { label: 'Sugar', value: '0 g' },
        { label: 'Caffeine', value: '0 mg' },
        { label: 'Daily tasks', value: '8' },
        { label: 'Time per task', value: '2 to 30 min' },
        { label: 'Doomscrolling', value: '0%' },
      ],
      footnote: 'Not a beverage. Do not pour over ice. Results depend on sleep, food and whether you did the tasks.',
    },
    crash: {
      title: 'The buzz, minus the crash',
      without: ['A spike at 10am', 'A slump at 3pm', 'A second can at 4pm', 'Wide awake at midnight'],
      with: ['A clear first hour', 'A reset at noon', 'Deep work after lunch', 'A real end to the day'],
    },
    story: {
      title: 'Why we never made the drink',
      body: [
        'Most energy drinks sell you the first twenty minutes. The rest of the day is your problem.',
        'We went the other way. Moltology spreads eight small actions through the day, from a quiet start before your phone to a firm close in the evening, so the energy comes from how the day is built instead of what is in the fridge.',
        'Members tick tasks off, keep a streak and ask the Oracle, our AI guide, when a day goes sideways.',
      ],
      image: {
        src: '/images/benefits/energy-drinks/story.jpg',
        alt: 'A crab at a sunny desk with an empty can turned into a pencil holder',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
