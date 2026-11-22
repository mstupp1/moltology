import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'clarity',
  topic: 'Clarity',
  kit: 'clinic',
  query: 'brain fog',
  title: 'Brain fog days: begin before the inbox | Moltology',
  description:
    'On brain fog days, start with less to open. Moltology offers a quiet morning practice: sit before your inbox, look back at yesterday and write one next step.',
  keywords: 'brain fog, quiet morning, mental clarity, morning routine, sit in silence',
  indexed: false,
  updated: '2026-11-22',
  disclaimer:
    'Brain fog can have medical causes; see a doctor about persistent or worrying symptoms, and seek urgent help for sudden confusion.',
  shareImage: {
    src: '/images/benefits/clarity/share.jpg?v=2',
    alt: 'A crab resting beside a frosted window in a pale room, in the soft photography of a wellness clinic',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Sit in silence: the morning Codex reading',
    href: '/codex/scr-030#verse-2',
    text: 'The reading behind Sit in silence asks for a look at yesterday before opening feeds or messages. Leave the inbox closed, sit quietly and read back over what happened. Start with the day you actually had, including the part that did not go to plan.',
  },
  reveal: {
    headline: 'Start the day before opening it.',
    body: 'Make Sit in silence your first check-in with the daily practice.',
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
      eyebrow: 'Morning routine · no equipment',
      headline: 'A quiet start on brain fog days.',
      sub: 'The kettle is on. Your inbox can wait. Moltology starts the morning with a simple request: sit quietly, look back at yesterday and leave the feeds unopened for now.',
      checks: ['Begin at home', 'A short reading to follow', 'Keep your own notes'],
      cta: 'Begin your morning practice',
      image: {
        src: '/images/benefits/clarity/hero.jpg?v=2',
        alt: 'A crab seated by a frosted window with a notebook nearby, photographed in muted clinic campaign light',
        width: 1024,
        height: 1280,
      },
    },
    trust: ['Instructions included', 'No special technique', 'Fits your waking day', 'No appointment to book'],
    signs: {
      title: 'Before the morning gets busy',
      intro: 'There is plenty waiting for your attention. Choose where to put the phone while you take a quiet pause.',
      items: [
        'The group chat has been awake longer than you have',
        'Yesterday’s unfinished list is beside the kettle',
        'A headline takes you into the feed before breakfast',
        'You check the calendar while brushing your teeth',
        'A small promise from yesterday still needs a note',
      ],
    },
    steps: {
      title: 'The morning check-in',
      items: [
        { title: 'Leave messages for later', body: 'Put the phone somewhere you do not have to keep deciding about it. Sit comfortably before opening the first feed or email.' },
        { title: 'Look back at yesterday', body: 'Read your notes if you have them. Recall what you did, what you left unfinished and anything you want to handle differently.' },
        { title: 'Write the loose end', body: 'Keep a short note of an action that needs doing. Mark Sit in silence after the pause, then move into the rest of your morning.' },
      ],
    },
    plans: {
      title: 'A place to pause in your day',
      intro: 'The morning reading is one part of a daily routine. There are also instructions for a midday reset and an evening finish.',
      items: [
        { name: 'Before the first scroll', tag: 'Morning', body: 'Follow Sit in silence before the messages begin. Look at yesterday’s notes instead of starting with whatever arrived overnight.', href: '/codex/scr-030#verse-2' },
        { name: 'When the tabs pile up', tag: 'Midday', body: 'Use Reset your focus to clear one thing pulling at you. Close the spare tab or handle the small request you keep reopening.', href: '/codex/scr-030#verse-5' },
        { name: 'When the day is done', tag: 'Evening', body: 'Close the day asks you to record the practice and stop. Leave the unfinished list for the next time you sit down.', href: '/codex/scr-030#verse-9' },
      ],
    },
    compare: {
      title: 'What comes before your inbox?',
      us: 'A quiet check-in',
      them: 'The morning scroll',
      rows: [
        { label: 'First thing opened', us: 'Yesterday’s notes', them: 'Overnight notifications' },
        { label: 'What to read', us: 'One morning instruction', them: 'Whatever the feed serves' },
        { label: 'What to write', us: 'A loose end to handle', them: 'A reply to the latest post' },
        { label: 'Where to stop', us: 'Finish the pause', them: 'Keep refreshing' },
      ],
    },
  },
}

export default page
