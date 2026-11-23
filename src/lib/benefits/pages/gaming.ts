import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'gaming',
  topic: 'Gaming',
  kit: 'arcade',
  query: 'gamify your life',
  title: 'Gamify your life with daily quests and real XP | Moltology',
  description:
    'Gamify your life without another grind. Moltology gives you eight daily quests, XP, a weekly leaderboard and a character whose stats grow with you. Free.',
  keywords: 'gamify your life, gamification, life rpg, habit game, daily quests, xp for real life',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/gaming/share.jpg?v=2',
    alt: 'An armored orange lobster hero on a reef ledge under a neon night sky',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Your character',
    href: '/character',
    text: 'Every member has a 3D crab or lobster with five stats and gear from the shop. It sits on your profile and next to your forum posts.',
  },
  reveal: {
    headline: 'Press start on day one.',
    body: 'Quests reset every day and the board resets every Monday.',
    screenshot: 'dashboard',
  },
  related: ['strength', 'automation', 'community'],
  faqs: [
    {
      question: 'Is Moltology a video game?',
      answer:
        'Not quite. It is an app for a daily practice that borrows game parts: quests, XP, a streak, a leaderboard and a character. The quests happen in your real day.',
    },
    {
      question: 'How do I gamify my life without it becoming another chore?',
      answer:
        'Keep the quests small and the same every day, so there is nothing to plan, and reward showing up more than perfection. That is how the eight daily tasks are set up.',
    },
    {
      question: 'What do the five stats mean?',
      answer:
        'Shell is holding your boundaries, Torque is finishing what you start, Synapse is turning a signal into action, Ecdysis is shedding old habits and Depth is staying calm under pressure.',
    },
    {
      question: 'Is there a leaderboard?',
      answer: 'Yes. Members are ranked by the XP they earn each week, and the board resets every Monday so newcomers can place too.',
    },
    {
      question: 'Is it pay to win?',
      answer:
        'No. XP, stage and leaderboard rank come only from doing the practice. Gear changes your character’s look and stats, never your XP or rank.',
    },
    {
      question: 'What is a life RPG?',
      answer:
        'A way of treating real habits like a role-playing game: quests for daily actions, experience points for doing them and a character that reflects your progress. Moltology takes its quests from a daily practice.',
    },

  ],
  content: {
    hero: {
      tag: 'Season 1 · Now live',
      headline: 'Gamify your life. The quests are real.',
      sub: 'Eight daily quests. XP that tracks what you actually did. A character that levels with you and a weekly board to climb. Free to play, no loot boxes.',
      cta: 'Play free',
      image: {
        src: '/images/benefits/gaming/hero.jpg?v=2',
        alt: 'An orange lobster in glowing teal and orange armor on a reef ledge above a glowing underwater city',
        width: 1600,
        height: 1000,
      },
    },
    stats: {
      title: 'Choose your build',
      intro: 'Five stats, trained by real habits. Gear from the shop raises them on your character too.',
      items: [
        { code: 'SHL', label: 'Shell', body: 'Hold your boundaries and take a hit without cracking.', value: 72 },
        { code: 'TRQ', label: 'Torque', body: 'Commit to one thing and grip it until it is done.', value: 64 },
        { code: 'SYN', label: 'Synapse', body: 'How fast a signal turns into action.', value: 81 },
        { code: 'ECD', label: 'Ecdysis', body: 'Shed an old habit cleanly and grow the next shell.', value: 55 },
        { code: 'DEP', label: 'Depth', body: 'Stay steady under pressure, below the noise.', value: 68 },
      ],
    },
    quests: {
      title: 'Daily quests',
      intro: 'They reset every day. Clear them all for a full board.',
      items: [
        { title: 'Silent start', body: 'Sit in quiet before the first screen.', reward: '+XP' },
        { title: 'Pick your one thing', body: 'Name the main objective for today.', reward: '+XP' },
        { title: 'Learn something hard', body: 'Grind a skill that pushes back.', reward: '+XP' },
        { title: 'Reset your focus', body: 'Take a real break at midday.', reward: '+XP' },
        { title: 'Do deep work', body: 'One focused run with notifications off.', reward: '+XP' },
        { title: 'Help a member', body: 'Co-op: answer someone on the forum.', reward: '+XP' },
        { title: 'Let one thing go', body: 'Drop a grudge, a worry or a habit.', reward: '+XP' },
        { title: 'Close the day', body: 'Review the run and log off.', reward: '+XP' },
      ],
    },
    modes: {
      title: 'Game modes',
      items: [
        { name: 'Campaign', body: 'The Codex: the story and the reasons behind every quest.' },
        { name: 'Co-op', body: 'The forum, where members trade tips and help each other out.' },
        { name: 'Coach', body: 'The Oracle, an AI guide you can ask for a plan or a pep talk.' },
        { name: 'Ranked', body: 'The weekly XP leaderboard. Resets every Monday.' },
      ],
      image: {
        src: '/images/benefits/gaming/setup.jpg?v=2',
        alt: 'The lobster in a gaming chair with a controller, lit by a big monitor and neon strip lights',
        width: 1280,
        height: 960,
      },
    },
    patch: {
      title: 'Patch notes',
      version: 'v1.0, launch',
      items: [
        'Added real life as a playable map',
        'Doomscrolling now drains focus faster',
        'Sleep restores more than expected',
        'Helping other players grants XP',
        'Removed microtransactions from progress',
      ],
    },
  },
}

export default page
