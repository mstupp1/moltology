import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'automation',
  topic: 'Automation',
  kit: 'platform',
  query: 'automate your daily routine',
  title: 'Automate your daily routine setup | Moltology',
  description:
    'Set up your daily routine with a ready-made checklist and the Oracle AI guide. Pick your own work, log what you do, and come back tomorrow.',
  keywords: 'automate your daily routine, routine automation, decision fatigue, AI productivity, daily planner, habit system',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/automation/share.jpg?v=2',
    alt: 'A teal lobster floating among glowing glass panels linked like a workflow',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Oracle skills',
    href: '/oracle',
    text: 'Choose a skill when you want a guided plan, a focus round, or a check-in.',
  },
  reveal: {
    headline: 'Give tomorrow a default.',
    body: 'Ask the Oracle to plan around one thing you want done.',
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
      badge: 'Daily checklist · Oracle guidance',
      headline: 'Put your daily routine on rails.',
      sub: 'Eight tasks in order. An AI guide for the days that go off script.',
      cta: 'Create a free account',
      image: {
        src: '/images/benefits/automation/hero.jpg?v=2',
        alt: 'A teal lobster floating calmly among glowing translucent panels joined by thin lines of light',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Already set up',
      intro: 'The checklist is ready. Bring your own work.',
      items: [
        { title: 'Ready-made checklist', body: 'Eight tasks in order, with practice days you choose.' },
        { title: 'AI on call', body: 'The Oracle plans, explains and unblocks. Four skills are free, and more can be added from the shop.' },
        { title: 'Run history', body: 'A streak, weekly XP and an activity log show what ran and what did not.' },
      ],
    },
    workflow: {
      title: 'A day on rails',
      intro: 'Three cues you already have.',
      steps: [
        { when: 'You wake up', then: 'Sit in silence before opening anything' },
        { when: 'Lunch', then: 'Reset your focus with a real break' },
        { when: 'Before bed', then: 'Close the day and log it' },
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
