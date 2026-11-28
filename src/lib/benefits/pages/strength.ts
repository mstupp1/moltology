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
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/strength/share.jpg?v=2',
    alt: 'A big black crab mid-deadlift in a dark gym with chalk in the air',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Character progress',
    href: '/character/progress',
    text: 'See how your practice moves your character through the stages.',
  },
  reveal: {
    headline: 'The next rep is yours.',
    body: 'Complete one rep and log it on the daily checklist.',
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
        'A missed practice day breaks the streak. Pick up again on your next practice day.',
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
      sub: 'Eight small daily reps for focus, boundaries, and finishing the work.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/strength/hero.jpg?v=2',
        alt: 'A big black crab gripping a loaded barbell mid-lift in a dark concrete gym',
        width: 1600,
        height: 1000,
      },
    },
    program: {
      title: 'The daily training card',
      intro: 'Warm up, work, cool down. Four reps from a full day’s practice.',
      items: [
        { set: 'Warm-up', title: 'Silent start', body: 'A few minutes of quiet before the phone. Set the pace before anyone else does.' },
        { set: 'Set 1', title: 'Pick your one thing', body: 'Commit to the single most important task. Grip it.' },
        { set: 'Main lift', title: 'Deep work', body: 'One heavy, focused block. No phone, no tabs, no excuses.' },
        { set: 'Stretch', title: 'Close the day', body: 'Review the session, log it and sleep.' },
      ],
    },
    gear: {
      title: 'What you need',
      intro: 'No membership card, no shaker, no kit bag.',
      items: ['A phone or a laptop', 'A block for the work you picked', 'Room to come back after a rough day'],
      image: {
        src: '/images/benefits/strength/tape.jpg?v=2',
        alt: 'The black crab on a locker room bench, wrapping tape around one claw before training',
        width: 1024,
        height: 1280,
      },
    },
  },
}

export default page
