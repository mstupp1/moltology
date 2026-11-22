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
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/charisma/share.jpg?v=2',
    alt: 'A coral crab on a big stage with a headset microphone, one claw raised',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Help a member, a daily task',
    href: '/forum',
    text: 'One of the eight daily tasks is helping another member on the forum. It is the most direct practice of the attention that people read as charisma.',
  },
  reveal: {
    headline: 'No ticket, no stage. The seminar is a daily practice.',
    body: 'Moltology is free: eight small tasks a day, readings from the Codex, an AI guide called the Oracle and a forum full of people practicing with you. Sign up to start chapter one today, or browse the demo first.',
    screenshot: 'forum',
  },
  related: ['fashion', 'community', 'spirituality'],
  faqs: [
    {
      question: 'Is there a real seminar or book?',
      answer:
        'No. This page borrows the look of a self-help event. The real thing is a free app with a daily practice, and the Codex, its book of readings, is free to read online.',
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
      question: 'How much does it cost?',
      answer: 'The practice, the forum and the Codex cost nothing. An optional paid plan, Oracle MAX, raises the limits on the AI guide.',
    },
    {
      question: 'Can I preview it?',
      answer: 'Yes. Open the demo to use the dashboard as a guest before you sign up.',
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
      title: 'In your first 30 days you will',
      items: [
        'Start your mornings without reaching for your phone',
        'Hold a conversation without planning your next line',
        'Help a stranger with something that matters to them',
        'Drop at least one story you keep telling about yourself',
        'Finish the day knowing what you did with it',
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
      quote: 'Keep them calm company without trying to fix anything. Presence first, counsel later.',
      source: { label: 'the Codex, SCR-013', href: '/codex/scr-013#verse-8' },
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
