import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'strength',
  topic: 'Strength',
  kit: 'locker',
  query: 'how to build mental toughness',
  title: 'How to build mental toughness, one rep a day | Moltology',
  description:
    'Mental toughness is trained like a lift: small reps, every day, with rest built in. Moltology is a free daily program of eight reps for your head.',
  keywords: 'mental toughness, mental strength, discipline, how to build mental toughness, resilience, daily training',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/strength/share.jpg?v=2',
    alt: 'A big black crab mid-deadlift in a dark gym with chalk in the air',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Shell and Depth, two of the five stats',
    href: '/character/progress',
    text: 'Your character tracks five stats. Shell is holding your boundaries and taking a hit without cracking; Depth is staying steady under pressure.',
  },
  reveal: {
    headline: 'Training day is every day.',
    body: 'Your character\'s Shell and Depth stats track the work.',
    screenshot: 'dashboard',
  },
  related: ['investing', 'gaming', 'energy-drinks'],
  faqs: [
    {
      question: 'Is this a workout program?',
      answer:
        'No. Moltology trains the head, not the muscles. It works well beside any gym routine, and you can run a training session inside the deep work block if you like.',
    },
    {
      question: 'How do you build mental toughness?',
      answer:
        'The same way you build strength: a load you can manage, done often, increased slowly, with recovery. Small daily commitments you keep are the reps. Breaking them is the skipped session.',
    },
    {
      question: 'What are the eight reps?',
      answer:
        'A silent start, picking your one thing, learning something hard, a midday reset, deep work, helping another member, letting one thing go and closing the day.',
    },
    {
      question: 'What if I fall off?',
      answer:
        'Then you start again tomorrow. The streak resets but your history and character stay. Coming back after a miss is the toughness part.',
    },
    {
      question: 'What are examples of mental toughness?',
      answer:
        'Keeping a promise to yourself on a day you do not feel like it, staying calm when plans fall apart, and coming back after a setback without a long story about it.',
    },
    {
      question: 'Can mental toughness be trained?',
      answer:
        'Like most skills it improves with practice. Small commitments you keep, and an honest look at the ones you miss, are the usual training load.',
    },

  ],
  content: {
    hero: {
      tag: 'Mental training program',
      headline: 'Build mental toughness. Rep by rep.',
      sub: 'Nobody gets strong in one session. Moltology is eight small reps for your head, every day, free. Show up, log it, come back tomorrow.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/strength/hero.jpg?v=2',
        alt: 'A big black crab gripping a loaded barbell mid-lift in a dark concrete gym',
        width: 1600,
        height: 1000,
      },
    },
    stats: [
      { value: '8', label: 'Reps a day' },
      { value: '5', label: 'Stats to train' },
      { value: '0', label: 'Equipment' },
      { value: '$0', label: 'Membership' },
    ],
    program: {
      title: 'The daily program',
      intro: 'Warm up, work, cool down. The same structure as a good session, spread across your day.',
      items: [
        { set: 'Warm-up', title: 'Silent start', body: 'A few minutes of quiet before the phone. Set the pace before anyone else does.' },
        { set: 'Set 1', title: 'Pick your one thing', body: 'Commit to the single most important task. Grip it.' },
        { set: 'Set 2', title: 'Learn something hard', body: 'Load the mind with something that pushes back.' },
        { set: 'Rest', title: 'Reset your focus', body: 'Step away at midday. Recovery is part of the program.' },
        { set: 'Main lift', title: 'Deep work', body: 'One heavy, focused block. No phone, no tabs, no excuses.' },
        { set: 'Spot', title: 'Help a member', body: 'Answer someone on the forum. Strong people spot each other.' },
        { set: 'Cool-down', title: 'Let one thing go', body: 'Drop what is not yours to carry.' },
        { set: 'Stretch', title: 'Close the day', body: 'Review the session, log it and sleep.' },
      ],
    },
    gear: {
      title: 'What you need',
      intro: 'No membership card, no shaker, no kit bag.',
      items: ['A phone or a laptop', 'A few minutes, eight times a day', 'Willingness to come back after a bad day'],
      image: {
        src: '/images/benefits/strength/tape.jpg?v=2',
        alt: 'The black crab on a locker room bench, wrapping tape around one claw before training',
        width: 1024,
        height: 1280,
      },
    },
    creed: 'Show up on the hard days. That is the whole program.',
  },
}

export default page
