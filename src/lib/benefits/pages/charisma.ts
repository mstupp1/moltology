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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/charisma/share.jpg?v=2',
    alt: 'A coral crab on a big stage with a headset microphone, one claw raised',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Presence first, from the Codex',
    href: '/codex/scr-013#verse-8',
    text: 'The Codex asks members to keep each other calm company before giving advice. Helping a member, one of the daily tasks, is where that gets practiced.',
  },
  reveal: {
    headline: 'The seminar is a daily practice.',
    body: 'Chapter one is a quiet morning tomorrow.',
    screenshot: 'forum',
  },
  related: ['fashion', 'community', 'spirituality'],
  faqs: [
    {
      question: 'Is there a real seminar or book?',
      answer:
        'No. The real thing is a free app with a daily practice, and the Codex, its book of readings, is free to read online.',
    },
    {
      question: 'Can charisma actually be learned?',
      answer:
        'Large parts of it can. People read presence, warmth and calm as charisma, and those come from habits: being rested, not rushing, putting the phone away and paying close attention to the person in front of you.',
    },
    {
      question: 'Which tasks help most with charisma?',
      answer:
        'The silent start lowers the background noise in your head, and helping a member trains attention to other people. Letting one thing go keeps old embarrassments from running every conversation.',
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
      kicker: 'The live seminar, now free and daily',
      headline: 'How to be more charismatic, starting tomorrow morning.',
      sub: 'Forget power poses and scripts. The people you remember are calm, present and actually interested in you. Moltology trains those three things in eight small daily steps.',
      cta: 'Claim your free seat',
      image: {
        src: '/images/benefits/charisma/hero.jpg?v=2',
        alt: 'A coral crab in a navy blazer on a big stage, wearing a headset microphone with one claw raised',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Presence', subtitle: 'The quiet habits of magnetic people', author: 'The Moltology method' },
    },
    promise: {
      title: 'What the first 30 days ask of you',
      items: [
        'Start each morning before your phone',
        'Listen without planning your next line',
        'Help a stranger with something that matters to them',
        'Drop one story you keep telling about yourself',
        'Close each day on purpose',
      ],
    },
    chapters: {
      title: 'What is inside',
      items: [
        { title: 'Quiet first', body: 'Why a silent start makes you easier to be around all day.' },
        { title: 'One clear aim', body: 'People follow those who know what they are doing today.' },
        { title: 'Curiosity', body: 'Learning something hard keeps you interesting, and interested.' },
        { title: 'The pause', body: 'A midday reset so the afternoon version of you is still good company.' },
        { title: 'Depth', body: 'Deep work gives you something real to talk about.' },
        { title: 'Generosity', body: 'Helping a member is attention, practiced daily.' },
        { title: 'Lightness', body: 'Letting one thing go so you stop carrying it into every room.' },
        { title: 'The close', body: 'Review the day, sleep, and wake up as yourself.' },
      ],
    },
    passage: {
      quote: 'Presence first, counsel later.',
      source: { label: 'the Codex, SCR-013, verse 8', href: '/codex/scr-013#verse-8' },
    },
    agenda: {
      title: 'Today’s agenda',
      intro: 'One day of the program. It runs again tomorrow, and the day after.',
      items: [
        { time: 'Morning', title: 'Silent start, then pick your one thing' },
        { time: 'Late morning', title: 'Learn something hard' },
        { time: 'Midday', title: 'Reset your focus' },
        { time: 'Afternoon', title: 'Deep work on the one thing' },
        { time: 'Evening', title: 'Answer someone on the forum, then drop a worry' },
        { time: 'Night', title: 'Close the day' },
      ],
    },
  },
}

export default page
