import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'cyber',
  topic: 'Cyber',
  kit: 'platform',
  variant: 'light-shield',
  query: 'how to reduce screen time',
  title: 'How to reduce screen time: rules first | Moltology',
  description:
    'Learn how to reduce screen time by deciding what gets through before you start. Pick your exceptions, close the feed, and follow a daily practice.',
  keywords: 'how to reduce screen time, phone boundaries, notification settings, digital habits, focused work',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/cyber/share.jpg?v=2',
    alt: 'A glossy blue crab beside a closed glass gate, photographed with cool cybersecurity campaign lighting',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Decide what gets through',
    href: '/codex/scr-031#verse-4',
    text: 'Make your exceptions before the session begins.',
  },
  reveal: {
    headline: 'Set your quiet hours.',
    body: 'Pick one block and choose which notifications can reach it.',
    screenshot: 'oracle',
  },
  related: ['focus', 'freedom', 'automation'],
  faqs: [
    {
      question: 'How can I reduce screen time when my job is on a computer?',
      answer:
        'Separate required work from optional checking. Choose which messages need an answer during a work block, then close the unrelated feeds. Count the work screen and the midnight scrolling as different uses when reviewing your day.',
    },
    {
      question: 'Where do I start with reducing screen time on my phone?',
      answer:
        'Start with the app you open without a reason. Check its usage in your phone settings, remove its alerts, and decide when you want to open it. Choose a place to leave the phone while doing something else.',
    },
    {
      question: 'Should I turn off every notification?',
      answer:
        'No. Keep a way for urgent calls and the people who depend on you to reach you. Sort the rest by what needs a prompt reply and what can wait. Check your settings before starting a quiet block.',
    },
    {
      question: 'Does Moltology block apps or track my device usage?',
      answer:
        'No. You set device limits and notification rules in your own phone settings. The daily tasks give you a place to practice the boundary and record that you kept it, and the Oracle can help you write a rule you can follow.',
    },
    {
      question: 'Which activities can replace phone checking during a break?',
      answer:
        'Anything away from the screen: get a drink, step outside, stretch, or talk to someone nearby. Decide before the break begins, and leave the phone where it is if the activity does not need it.',
    },
    {
      question: 'How do I handle group chats during focused work?',
      answer:
        'Tell the group when you plan to read the messages and how to reach you urgently. Mute routine alerts for the work block, then read the thread at the time you named.',
    },
  ],
  content: {
    hero: {
      badge: 'Attention settings',
      headline: 'Reduce screen time at the source.',
      sub: 'Decide what gets through before the pings start. Keep the people who need you on the list.',
      cta: 'Create a free account',
      image: {
        src: '/images/benefits/cyber/hero.jpg?v=2',
        alt: 'A glossy blue crab closing a translucent gate beside a phone on a dark desk, in crisp violet cybersecurity advertising light',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Set your permissions',
      intro: 'Give important calls a way in and spare tabs a way out.',
      items: [
        { title: 'Name the allowed interruption', body: 'List the people and situations that need a quick response. Set those exceptions before muting anything.' },
        { title: 'Give work one window', body: 'Open the document for your chosen task. Put unrelated messages aside until the break you planned.' },
        { title: 'Plan the return', body: 'Decide when to read routine messages. Tell anyone who needs to know how long you plan to be away.' },
      ],
    },
    workflow: {
      title: 'Pre-flight checklist',
      intro: 'Set up the block before opening the first tab.',
      steps: [
        { when: 'The phone is still in reach', then: 'Allow urgent contacts in your notification settings' },
        { when: 'You open the laptop', then: 'Close the feeds that have no job in this session' },
        { when: 'Your planned break starts', then: 'Read the messages you held and answer what needs you' },
      ],
    },
    plans: {
      title: 'Choose the practice, then the extras',
      items: [
        {
          name: 'Daily practice',
          price: '$0 membership',
          body: 'Set your own device rules and log the tasks you do.',
          items: ['Daily checklist', 'Streak history', 'Codex and forum', 'Limited Oracle chat'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional subscription',
          body: 'Choose extra AI access for longer planning conversations.',
          items: ['Higher limits on Oracle conversations', 'Use of a stronger AI model', 'Everything in the daily practice'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
