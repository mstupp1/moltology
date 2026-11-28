import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'gamification',
  topic: 'Gamification',
  kit: 'arcade',
  variant: 'gold-cabinet',
  query: 'gamified habit app',
  title: 'A gamified habit app for unfinished tasks | Moltology',
  description:
    'Meet the gamified habit app with eight daily tasks and XP for checking them off. Open the Moltology task board, do the work, then claim the completion.',
  keywords: 'gamified habit app, daily task board, habit quests, task XP, daily practice',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/gamification/share.jpg?v=2',
    alt: 'A blue crab at an arcade mission terminal, rendered as neon-lit game launch key art',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The daily task board',
    href: '/dashboard',
    text: 'Open today’s board and claim XP by completing a task.',
  },
  reveal: {
    headline: 'The quest is on the board.',
    body: 'Pick one task you can finish today.',
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
      headline: 'A gamified habit app for unfinished business.',
      sub: 'Pick a daily quest. Do it away from the screen. Come back for the XP.',
      cta: 'Play free',
      image: {
        src: '/images/benefits/gamification/hero.jpg?v=2',
        alt: 'A blue crab facing a mission terminal on the right of a dark neon arcade, cinematic game launch lighting',
        width: 1600,
        height: 1000,
      },
    },
    quests: {
      title: 'Today’s quest board',
      intro: 'Clear a task in real life, then log it for XP.',
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
  },
}

export default page
