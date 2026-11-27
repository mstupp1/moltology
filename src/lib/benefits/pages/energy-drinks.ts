import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'energy-drinks',
  topic: 'Energy drinks',
  kit: 'can',
  query: 'energy drink alternative',
  title: 'The energy drink alternative with zero caffeine | Moltology',
  description:
    'When the 3 p.m. can calls, try a midday reset. Moltology is a free daily practice with a spot to clear one distraction and choose what’s next.',
  keywords: 'energy drink alternative, no caffeine energy, afternoon slump, 3pm crash, natural energy, daily routine',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/energy-drinks/share.jpg',
    alt: 'A bright Moltology can with a crab on the label',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Low Tide',
    href: '/codex/scr-030#verse-5',
    text: 'Midday is a good time to clear one distraction and return to your priority.',
  },
  reveal: {
    headline: 'Crack open a quieter afternoon.',
    body: 'Put the midday reset on tomorrow’s list.',
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
      question: 'How does the midday reset work?',
      answer: 'Close one distraction, such as a spare tab or an unanswered message. Choose the next thing you want to do and give it your attention.',
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
      question: 'What can I reach for when I want to skip caffeine?',
      answer: 'Try a short walk or a break from your screen. Pick an easy next step before you sit back down.',
    },
    {
      question: 'What can I do instead of an energy drink?',
      answer: 'Take a proper break or get a glass of water. For the noon reset, pick one distraction that can stay closed after the break ends.',
    },
  ],
  content: {
    hero: {
      sticker: 'Zero caffeine added',
      headline: 'An energy drink alternative.',
      sub: 'When the 3 p.m. can calls, clear one distraction and choose what’s next.',
      cta: 'Get started free',
      image: {
        src: '/images/benefits/energy-drinks/hero.jpg',
        alt: 'A tall bright can with a cartoon crab on the label, splashing out of ice',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Zero sugar', 'One midday reset', 'Eight tasks a day', 'Free to join'],
    flavors: {
      title: 'The four-pack',
      items: [
        { name: 'Original Focus', note: 'Pick your one thing in the first hour and start on it.', tone: 'lime' },
        { name: 'Low Tide Berry', note: 'A noon reset: clear one distraction, choose the next useful move.', tone: 'berry' },
        { name: 'Deep Dive Citrus', note: 'One block of deep work with everything else switched off.', tone: 'citrus' },
        { name: 'Night Ice', note: 'Let something go and close the day.', tone: 'ice' },
      ],
    },
    label: {
      title: 'Daily facts',
      serving: 'One day per serving',
      rows: [
        { label: 'Sugar', value: '0 g' },
        { label: 'Caffeine', value: '0 mg' },
        { label: 'Daily tasks', value: '8' },
      ],
      footnote: 'Best served with the extra tabs closed.',
    },
    story: {
      caption: 'Made for the 3 p.m. reach.',
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
