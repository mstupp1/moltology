import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'charisma',
  topic: 'Charisma',
  kit: 'seminar',
  query: 'how to be more charismatic',
  title: 'How to be more charismatic, without the act | Moltology',
  description:
    'Charisma is mostly presence: calm, attention and real interest in people. Moltology is a free daily practice that trains all three, eight small tasks at a time.',
  keywords: 'how to be more charismatic, charisma, presence, confidence, social skills, how to be magnetic',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/charisma/share.jpg?v=2',
    alt: 'A coral crab on a big stage with a headset microphone, one claw raised',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Presence first',
    href: '/codex/scr-013#verse-8',
    text: 'Bring your full attention to the person in front of you.',
  },
  reveal: {
    headline: 'Class starts at the next hello.',
    body: 'Take one small act of attention into your next conversation.',
    screenshot: 'forum',
  },
  related: ['fashion', 'community', 'spirituality'],
  faqs: [
    {
      question: 'How can I sound more charismatic without rehearsing?',
      answer:
        'Ask about one detail you genuinely want to hear more about. Give the reply your full attention.',
    },
    {
      question: 'Can charisma actually be learned?',
      answer:
        'Large parts of it can. People read presence, warmth and calm as charisma, and those come from habits: being rested, not rushing, putting the phone away and paying close attention to the person in front of you.',
    },
    {
      question: 'Which tasks help most with charisma?',
      answer:
        'Try Help a member. Read their question twice, then write a reply to the part they actually asked about.',
    },
    {
      question: 'Do I have to post publicly?',
      answer: 'Only if you want to. Helping a member usually means a reply on the forum, and you choose what you share about yourself.',
    },
    {
      question: 'What makes someone charismatic?',
      answer:
        'Most descriptions land on a mix of warmth and presence: people feel noticed, and they feel you are steady. Both are easier when you are rested and not half-looking at a phone.',
    },
    {
      question: 'How long does it take to become more charismatic?',
      answer:
        'There is no fixed timeline. Treat it like any skill: a little practice every day, an honest look back, and patience.',
    },
  ],
  content: {
    hero: {
      kicker: 'The presence method',
      headline: 'More charismatic. Less rehearsed.',
      sub: 'Put the phone away. Ask the question you actually want answered.',
      cta: 'Start the practice free',
      image: {
        src: '/images/benefits/charisma/hero.jpg?v=2',
        alt: 'A coral crab in a navy blazer on a big stage, wearing a headset microphone with one claw raised',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Presence', subtitle: 'The quiet habits of magnetic people', author: 'The Moltology method' },
    },
    chapters: {
      title: 'The presence syllabus',
      items: [
        { title: 'Quiet first', body: 'Why a silent start makes you easier to be around all day.' },
        { title: 'Curiosity', body: 'Learning something hard keeps you interesting, and interested.' },
        { title: 'The pause', body: 'A midday reset so the afternoon version of you is still good company.' },
        { title: 'Generosity', body: 'Helping a member is attention, practiced daily.' },
      ],
    },
    passage: {
      quote: 'Presence first, counsel later.',
      source: { label: 'the Codex, SCR-013, verse 8', href: '/codex/scr-013#verse-8' },
    },
  },
}

export default page
