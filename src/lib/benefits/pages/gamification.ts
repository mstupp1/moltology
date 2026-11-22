import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'gamification',
  topic: 'Gamification',
  kit: 'arcade',
  query: 'gamified habit app',
  title: 'A gamified habit app for unfinished tasks | Moltology',
  description:
    'Meet the gamified habit app with eight daily tasks and XP for checking them off. Open the Moltology task board, do the work, then claim the completion.',
  keywords: 'gamified habit app, daily task board, habit quests, task XP, daily practice',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/gamification/share.jpg?v=2',
    alt: 'A blue crab at an arcade mission terminal, rendered as neon-lit game launch key art',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The daily task board',
    href: '/dashboard',
    text: 'Open the dashboard for the eight daily tasks. Do a task away from the board, then check it off for XP. Reading the objective is the briefing; doing it is the mission.',
  },
  reveal: {
    headline: 'That unfinished task has a quest slot.',
    body: 'Pick one action from the daily board and put it on your calendar.',
    screenshot: 'dashboard',
  },
  related: ['gaming', 'technique', 'automation'],
  faqs: [
    {
      question: 'How does a gamified habit app work?',
      answer:
        'A gamified habit app adds game features to everyday actions, such as quests, XP and character progression. In Moltology, you complete a daily task and check it off on the dashboard. The action happens in your day; the app records the completion.',
    },
    {
      question: 'Which habits belong in a gamified habit app?',
      answer:
        'Use actions you can clearly finish, such as reading a difficult chapter or putting your phone away for a work session. Moltology has a fixed daily board, so put your own work inside the task that fits. An essay belongs under Do deep work, for example.',
    },
    {
      question: 'Does habit gamification require gaming experience?',
      answer:
        'No. Start with the checklist and leave the character screen for later if you prefer. You only need to pick an action, do it and mark the task complete; knowing what a skill tree is can remain optional.',
    },
    {
      question: 'Can checking off tasks become a distraction?',
      answer:
        'Yes, editing a tracker can become another way to put off the task inside it. Write the next action before opening another menu, then leave the app while you do it. Reserve the check mark for work you actually did.',
    },
    {
      question: 'How can I cut down an overcrowded habit list?',
      answer:
        'Start with one clear action you can do today. Name the document, book or conversation involved, and decide when to begin. Use Pick your one thing for that choice instead of spending the morning designing a perfect routine.',
    },
    {
      question: 'Does buying character gear add XP?',
      answer:
        'No. Gear changes appearance and character stats, never XP, stage or leaderboard rank. Open the cosmetics shop when you want a different look, and return to the task board when you want to log the practice.',
    },
  ],
  content: {
    hero: {
      tag: 'Daily missions · Free to join',
      headline: 'A gamified habit app for your unfinished business.',
      sub: 'Bring the chapter you keep skipping and the draft called final-final. Moltology puts eight daily tasks on the board. Do one, check it off, collect XP. Menu time does not count as mission time.',
      cta: 'Start your daily board',
      image: {
        src: '/images/benefits/gamification/hero.jpg?v=2',
        alt: 'A blue crab facing a mission terminal on the right of a dark neon arcade, cinematic game launch lighting',
        width: 1600,
        height: 1000,
      },
    },
    stats: {
      title: 'Inspect the loadout',
      intro: 'A sample build. Your own five stats live on your character; the daily board is where you log tasks.',
      items: [
        { code: 'SHL', label: 'Shell', body: 'Practice a boundary: leave the group chat until your chosen break.', value: 72 },
        { code: 'TRQ', label: 'Torque', body: 'Pick a finish line for the draft before opening the document.', value: 64 },
        { code: 'SYN', label: 'Synapse', body: 'Read the instruction, then take the first step on the page.', value: 81 },
        { code: 'ECD', label: 'Ecdysis', body: 'Drop one routine you keep doing out of habit.', value: 55 },
        { code: 'DEP', label: 'Depth', body: 'Stay with the chosen work when another tab looks tempting.', value: 68 },
      ],
    },
    quests: {
      title: 'Your daily mission list',
      intro: 'Eight daily tasks, fixed for everyone. Bring your own book, work and unanswered question.',
      items: [
        { title: 'Sit in silence', body: 'Leave the inbox closed and sit quietly before the first feed.', reward: 'Task XP' },
        { title: 'Pick your one thing', body: 'Write down the one job that deserves your first attempt.', reward: 'Task XP' },
        { title: 'Learn something hard', body: 'Open the chapter with the exercise you usually skip.', reward: 'Task XP' },
        { title: 'Reset your focus', body: 'At noon, clear a distraction and choose what to do next.', reward: 'Task XP' },
        { title: 'Do deep work', body: 'Close the extra tabs and work on the job you picked.', reward: 'Task XP' },
        { title: 'Help a member', body: 'Answer a forum question or welcome someone who just arrived.', reward: 'Task XP' },
        { title: 'Let one thing go', body: 'Name something from today that you are ready to put down.', reward: 'Task XP' },
        { title: 'Close the day', body: 'Check the board honestly, then stop for the evening.', reward: 'Task XP' },
      ],
    },
    modes: {
      title: 'Pick your next screen',
      items: [
        { name: 'Mission control', body: 'Return to the dashboard to record a completed task. Keep the check mark for the action, even when planning it was quite an event.' },
        { name: 'Party chat', body: 'Ask a question on the forum or answer one you know. Read the replies before writing your own.' },
        { name: 'Build screen', body: 'Visit your character and browse the cosmetics shop. Choose the look you want to bring to your profile.' },
        { name: 'Weekly standings', body: 'Read the weekly XP leaderboard at the forum. Its weekly score resets Monday at 00:00 UTC.' },
      ],
      image: {
        src: '/images/benefits/gamification/setup.jpg?v=2',
        alt: 'A blue crab at a desktop mission station with a notebook beside the keyboard, glossy esports studio lighting',
        width: 1280,
        height: 960,
      },
    },
    patch: {
      title: 'Read before entering',
      version: 'Daily board · Rules of play',
      items: [
        'Task selection: the same daily set for every member.',
        'Completion check: do the action before marking the box.',
        'Custom objective: bring your own work to the daily task.',
        'Co-op objective: help someone on the forum.',
        'Session exit: close the board and do the next thing.',
      ],
    },
  },
}

export default page
