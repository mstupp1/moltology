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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/cyber/share.jpg?v=2',
    alt: 'A glossy blue crab beside a closed glass gate, photographed with cool cybersecurity campaign lighting',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Decide what gets through in advance, in the Codex',
    href: '/codex/scr-031#verse-4',
    text: 'Sort your interruptions once, before work starts. Keep a route open for real emergencies and hold everything else until your break. Pick the exceptions while nobody is pinging you.',
  },
  reveal: {
    headline: 'Your attention needs an access policy.',
    body: 'Write the exceptions before you begin your next work block.',
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
      badge: 'Attention security · Rules before alerts',
      headline: 'How to reduce screen time: set the rules first.',
      sub: 'Your group chat does not need access to every minute. Choose what can interrupt, keep an emergency route open, and put the phone down. Same rules tomorrow, logged in your daily tasks.',
      cta: 'Create my free account',
      prompt: 'Help me write a phone rule for work that still lets my family reach me.',
      image: {
        src: '/images/benefits/cyber/hero.jpg?v=2',
        alt: 'A glossy blue crab closing a translucent gate beside a phone on a dark desk, in crisp violet cybersecurity advertising light',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Set permissions for an ordinary afternoon',
      intro: 'Write your rules while the screen is quiet. Start with the chat that interrupts lunch and the feed that follows you to bed.',
      items: [
        { title: 'Name the allowed interruption', body: 'List the people and situations that need a quick response. Set those exceptions before muting anything.' },
        { title: 'Close the open invitation', body: 'Quit the feed you keep checking between sentences. A tab left open is still asking for a look.' },
        { title: 'Give work one window', body: 'Open the document for your chosen task. Put unrelated messages aside until the break you planned.' },
        { title: 'Plan the return', body: 'Decide when to read routine messages. Tell anyone who needs to know how long you plan to be away.' },
        { title: 'Ask for a workable rule', body: 'Explain your job and home responsibilities to the Oracle. Ask for a boundary that leaves those responsibilities intact.' },
        { title: 'Audit what you opened', body: 'Name what you opened and why. Use that detail when choosing what to change in your settings next.' },
      ],
    },
    workflow: {
      title: 'Pre-flight check before you go quiet',
      intro: 'You set the permissions on your devices. Try this sequence before the work you have been doing between notifications.',
      steps: [
        { when: 'You choose a work block', then: 'Tell anyone depending on you when you plan to return' },
        { when: 'The phone is still in reach', then: 'Allow urgent contacts in your notification settings' },
        { when: 'The settings are checked', then: 'Put the phone somewhere off the desk' },
        { when: 'You open the laptop', then: 'Close the feeds that have no job in this session' },
        { when: 'The urge to check arrives', then: 'Write down what you wanted to check and return to the task' },
        { when: 'Your planned break starts', then: 'Read the messages you held and answer what needs you' },
      ],
    },
    config: {
      title: 'Daily maintenance for your boundaries',
      body: 'The eight daily tasks include quiet, focused work, and a clear stop. You run each one yourself and tick it when it is done.',
      filename: 'attention-checklist.txt',
      lines: [
        '# Daily checklist, completed by you',
        'morning / Sit in silence',
        'first choice / Pick your one thing',
        'study / Learn something hard',
        'midday / Reset your focus',
        'work block / Do deep work',
        'community / Help a member',
        'evening / Let one thing go',
        'finish / Close the day',
        '# Keep urgent contacts reachable',
      ],
    },
    plans: {
      title: 'Choose the practice, then the extras',
      items: [
        {
          name: 'Daily practice',
          price: '$0 membership',
          body: 'Set your own device rules and log the tasks you do.',
          items: ['The daily task checklist', 'Checkmarks and streak history', 'Codex passages on boundaries', 'A forum for practical questions', 'Oracle access up to a daily limit'],
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
