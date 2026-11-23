import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'automation',
  topic: 'Automation',
  kit: 'platform',
  query: 'automate your daily routine',
  title: 'Automate your daily routine, and your decisions | Moltology',
  description:
    'Stop deciding how to run every day. Moltology automates your daily routine into eight small tasks, with an AI guide on call when the plan breaks. Free.',
  keywords: 'automate your daily routine, routine automation, decision fatigue, AI productivity, daily planner, habit system',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/automation/share.jpg?v=2',
    alt: 'A teal lobster floating among glowing glass panels linked like a workflow',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Oracle skills',
    href: '/oracle',
    text: 'The Oracle, our AI guide, has skills you can switch on, and it can read the forum, the news and the page you are on to give answers that fit.',
  },
  reveal: {
    headline: 'The Oracle is ready when the plan breaks.',
    body: 'Ask it to plan tomorrow around one thing.',
    screenshot: 'oracle',
  },
  related: ['investing', 'energy-drinks', 'gaming'],
  faqs: [
    {
      question: 'Does Moltology connect to my calendar or email?',
      answer:
        'No. It does not run code on your accounts. The automation here is of your decisions: the same eight tasks each day, so the shape of the day is already settled when you wake up.',
    },
    {
      question: 'What is the Oracle?',
      answer:
        'An AI guide inside the app. You can ask it to plan a day, break down a project, explain a Codex passage or talk you through a bad week. Guests get a small daily allowance too.',
    },
    {
      question: 'Why automate a routine at all?',
      answer:
        'Every small choice costs attention. When the first hour, the focus block and the end of the day are already decided, that attention goes to the work instead.',
    },
    {
      question: 'Can I change the eight tasks?',
      answer:
        'The eight are fixed so everyone practices the same thing. What you do inside them is yours: your one thing, your deep work, the member you help.',
    },
    {
      question: 'What is decision fatigue?',
      answer:
        'The idea that each small choice draws on the same limited attention, so a day full of tiny decisions leaves less for the ones that matter. Fixing the order of your day removes a lot of them.',
    },
    {
      question: 'What should I automate first in my daily routine?',
      answer:
        'The first hour. Decide the night before what you will do before opening any app, then do it the same way each morning. A silent start and picking your one thing cover exactly that.',
    },

  ],
  content: {
    hero: {
      badge: 'New · Oracle skills',
      headline: 'Automate your daily routine. Keep your attention.',
      sub: 'Moltology turns the day into a pipeline you never have to design again: eight small tasks, an AI guide when something breaks, and a log of every run. Free to start.',
      cta: 'Start building free',
      prompt: 'Plan tomorrow around one thing: shipping the draft.',
      image: {
        src: '/images/benefits/automation/hero.jpg?v=2',
        alt: 'A teal lobster floating calmly among glowing translucent panels joined by thin lines of light',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Everything a routine needs, already wired',
      intro: 'You bring the goals. The structure, reminders of what comes next and the help are built in.',
      items: [
        { title: 'Fixed schedule', body: 'Eight tasks in a set order, from a quiet start to closing the day. Nothing to configure.' },
        { title: 'AI on call', body: 'The Oracle plans, explains and unblocks. Four skills are free, and more can be added from the shop.' },
        { title: 'Run history', body: 'A streak, weekly XP and an activity log show what ran and what did not.' },
        { title: 'Members who help', body: 'A forum of people doing the same practice, for the problems AI cannot fix.' },
        { title: 'Source docs', body: 'Every task links to its passage in the Codex, so you know why it is there.' },
        { title: 'Works anywhere', body: 'Phone or desktop, in the browser. No install.' },
      ],
    },
    workflow: {
      title: 'Your day, as a workflow',
      intro: 'Triggers you already have, actions you already know. Moltology just keeps them in order.',
      steps: [
        { when: 'You wake up', then: 'Sit in silence before opening anything' },
        { when: 'First coffee', then: 'Pick your one thing and write it down' },
        { when: 'Calendar opens up', then: 'Run a deep work block on that one thing' },
        { when: 'Lunch', then: 'Reset your focus with a real break' },
        { when: 'Evening', then: 'Help a member, let one thing go' },
        { when: 'Before bed', then: 'Close the day and log it' },
      ],
    },
    config: {
      title: 'Zero config, but here is the config',
      body: 'If your day were a file, it would look like this. You never have to write it.',
      filename: 'practice.yml',
      lines: [
        'schedule: daily',
        'tasks:',
        '  - silent-start',
        '  - pick-one-thing',
        '  - learn-something-hard',
        '  - reset-focus',
        '  - deep-work',
        '  - help-a-member',
        '  - let-one-thing-go',
        '  - close-the-day',
        'on_failure: ask_oracle',
        'cost: free',
      ],
    },
    plans: {
      title: 'Pricing',
      items: [
        {
          name: 'Free',
          price: '$0',
          body: 'The whole practice, for everyone.',
          items: ['All eight daily tasks', 'Streak, XP and activity log', 'Codex readings and forum', 'Everyday Oracle use', 'Four free Oracle skills'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional',
          body: 'For people who use the AI guide all day.',
          items: ['Higher Oracle limits', 'A stronger model', 'Everything in Free'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
