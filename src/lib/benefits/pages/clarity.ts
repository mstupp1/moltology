import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'clarity',
  topic: 'Clarity',
  kit: 'clinic',
  variant: 'botanical-lab',
  query: 'brain fog',
  title: 'Brain fog days: begin before the inbox | Moltology',
  description:
    'On brain fog days, start with less to open. Moltology offers a quiet morning practice: sit before your inbox, look back at yesterday and write one next step.',
  keywords: 'brain fog, quiet morning, mental clarity, morning routine, sit in silence',
  indexed: true,
  updated: '2026-11-27',
  disclaimer:
    'Brain fog can have medical causes; see a doctor about persistent or worrying symptoms, and seek urgent help for sudden confusion.',
  shareImage: {
    src: '/images/benefits/clarity/share.jpg?v=2',
    alt: 'A crab resting beside a frosted window in a pale room, in the soft photography of a wellness clinic',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Sit in silence',
    href: '/codex/scr-030#verse-2',
    text: 'Take ten quiet minutes before the first message of the day.',
  },
  reveal: {
    headline: 'Leave the inbox unopened.',
    body: 'Try the morning’s quiet first task.',
    screenshot: 'dashboard',
  },
  related: ['focus', 'spirituality', 'emotional'],
  faqs: [
    {
      question: 'What does brain fog mean?',
      answer:
        'Brain fog is an everyday term for trouble thinking clearly, remembering things or concentrating. It describes an experience, not one specific diagnosis. Write down what feels different and how it affects ordinary tasks.',
    },
    {
      question: 'What can cause brain fog?',
      answer:
        'Poor sleep, stress, some medicines and health conditions can be involved. Note when the difficulty started and any recent changes to discuss at an appointment. Include examples, such as losing track of a familiar recipe or forgetting the point of an email.',
    },
    {
      question: 'How do I sit in silence if my thoughts keep wandering?',
      answer:
        'Let the thoughts arrive and return to the task: looking back at yesterday. You do not need a blank mind. Leave the phone alone, and write a brief note if there is something you want to remember afterward.',
    },
    {
      question: 'Do I need to meditate before checking my phone?',
      answer:
        'No. Sit quietly and look back without a special breathing method. Choose a comfortable place and leave messages unopened until you finish the pause.',
    },
    {
      question: 'Which details belong in a morning note?',
      answer:
        'Write the loose end you want to act on. “Reply to the school email” is enough; the whole story can wait. Keep that note in your own notebook or notes app, then choose when to handle it.',
    },
    {
      question: 'Can a quiet morning routine fit around children or shift work?',
      answer:
        'Yes, use a pause that fits your waking day and the people who need you. Sit after the school run or before your shift if that is practical. Read the morning instruction in that part of your schedule.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Morning check-in',
      headline: 'Brain fog? Keep the morning simple.',
      sub: 'Give the first few minutes to quiet. Leave the inbox until afterward.',
      cta: 'Start free',
      image: {
        src: '/images/benefits/clarity/hero.jpg?v=2',
        alt: 'A crab seated by a frosted window with a notebook nearby, photographed in muted clinic campaign light',
        width: 1024,
        height: 1280,
      },
    },
    steps: {
      title: 'A simple morning check-in',
      items: [
        { title: 'Leave messages for later', body: 'Put the phone somewhere you do not have to keep deciding about it. Sit comfortably before opening the first feed or email.' },
        { title: 'Look back at yesterday', body: 'Read your notes if you have them. Recall what you did, what you left unfinished and anything you want to handle differently.' },
        { title: 'Write the loose end', body: 'Keep a short note of an action that needs doing. Mark Sit in silence after the pause, then move into the rest of your morning.' },
      ],
    },
    plans: {
      title: 'Readings for a quieter day',
      intro: 'A short reading for morning, midday, or evening.',
      items: [
        { name: 'Before the first scroll', tag: 'Morning', body: 'Follow Sit in silence before the messages begin. Look at yesterday’s notes instead of starting with whatever arrived overnight.', href: '/codex/scr-030#verse-2' },
        { name: 'When the tabs pile up', tag: 'Midday', body: 'Use Reset your focus to clear one thing pulling at you. Close the spare tab or handle the small request you keep reopening.', href: '/codex/scr-030#verse-5' },
        { name: 'When the day is done', tag: 'Evening', body: 'Close the day: tick off what you did and stop. The unfinished list keeps until the next time you sit down.', href: '/codex/scr-030#verse-9' },
      ],
    },
  },
}

export default page
