import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'synergy',
  topic: 'Synergy',
  kit: 'platform',
  variant: 'split-prism',
  query: 'habit stacking',
  title: 'Habit stacking, built around your day | Moltology',
  description:
    'Put habit stacking on your daily agenda. Pair small actions with things you already do, follow the daily tasks, and ask the Oracle for a second opinion.',
  keywords: 'habit stacking, daily habits, routine cues, habit stack, daily practice',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/synergy/share.jpg?v=2',
    alt: 'A glossy violet crab arranging glass blocks on a dark desk in polished software launch photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Cadence',
    href: '/codex/scr-030#verse-11',
    text: 'Keep the daily rhythm through imperfect days.',
  },
  reveal: {
    headline: 'Give the next habit a home.',
    body: 'Pair one daily task with something you already do.',
    screenshot: 'oracle',
  },
  related: ['automation', 'commitment', 'focus'],
  faqs: [
    {
      question: 'What does habit stacking mean?',
      answer:
        'Habit stacking means attaching a new action to something you already do. Use a clear cue: after putting your breakfast plate away, write the first sentence of your draft. Pick something you can start right there.',
    },
    {
      question: 'How do I start habit stacking with a busy schedule?',
      answer:
        'Choose one reliable moment and add one small action. Putting your keys down or shutting your work laptop can be the cue. Try that pairing before adding another; a full morning redesign is a large first assignment.',
    },
    {
      question: 'Which habits should I stack together?',
      answer:
        'Pair actions that share a place or a natural order. After clearing your desk, open the document you plan to work on. Avoid attaching a desk task to a cue that happens halfway through your commute.',
    },
    {
      question: 'Why does my habit stack keep falling apart?',
      answer:
        'Usually the cue is unpredictable or the chain is too long. A five-link stack asks a lot of a weekday with a dentist appointment in it. Shorten the chain, keep the first link, and try again at its next cue.',
    },
    {
      question: 'Should every daily task follow immediately after the last?',
      answer:
        'No. The tasks run from morning to evening, with your actual life between them. Attach each one to a suitable point in your day instead of trying to complete the whole routine before breakfast.',
    },
    {
      question: 'Can the Oracle help me choose a cue?',
      answer:
        'Yes. Tell the Oracle, our AI guide, what you already do and which task keeps slipping. Ask for one pairing to try. Give it the real schedule, including the school run or the late shift.',
    },
  ],
  content: {
    hero: {
      badge: 'Daily routines',
      headline: 'Habit stacking. Kettle first.',
      sub: 'Give the next habit a cue you already use. While the kettle heats, pick your one thing.',
      cta: 'Create a free account',
      image: {
        src: '/images/benefits/synergy/hero.jpg?v=2',
        alt: 'A glossy violet crab lining up translucent blocks beside a mug, with violet studio lighting and a dark software launch backdrop',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Connect the next habit',
      intro: 'Pick a cue you already meet every day.',
      items: [
        { title: 'Use an existing cue', body: 'Pick a moment you can point to: finishing breakfast, sitting at your desk, or plugging in your phone.' },
        { title: 'Name the next action', body: 'Write the first move in plain words. Opening the draft is a clearer instruction than working on your future.' },
        { title: 'Check off what happened', body: 'Mark a daily task when you have done it. Leave the box alone when you have not.' },
      ],
    },
    workflow: {
      title: 'Cue → action',
      intro: 'Swap in the cues that already fit your day.',
      steps: [
        { when: 'The kettle starts', then: 'Sit quietly before checking the morning messages' },
        { when: 'Lunch is finished', then: 'Clear a distraction and choose your next action' },
        { when: 'The laptop closes', then: 'Name what to let go and check off the day' },
      ],
    },
    plans: {
      title: 'Start with the daily practice',
      items: [
        {
          name: 'Moltology Free',
          price: '$0 / month',
          body: 'For doing the work between the things you already do.',
          items: ['Daily checklist', 'Activity history', 'Codex and forum', 'Limited Oracle chat'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional',
          body: 'More room for long Oracle conversations.',
          items: ['A higher daily Oracle allowance', 'Access to a stronger Oracle model', 'Everything in Free'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
