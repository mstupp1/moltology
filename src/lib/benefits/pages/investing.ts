import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'investing',
  topic: 'Investing',
  kit: 'ledger',
  query: 'investing in yourself',
  title: 'Investing in yourself, one small deposit a day | Moltology',
  description:
    'Small daily habits compound like regular deposits. Moltology is a free daily practice: eight small deposits of focus, learning and rest that add up over months.',
  keywords: 'investing in yourself, self investment, compound habits, personal growth, daily routine, self improvement',
  indexed: false,
  updated: '2026-11-22',
  disclaimer: 'Moltology is not financial advice and does not hold, manage or invest money.',
  shareImage: {
    src: '/images/benefits/investing/share.jpg?v=2',
    alt: 'A purple lobster watering a small tree with coin-shaped leaves',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The weekly XP leaderboard',
    href: '/forum/leaderboard',
    text: 'Every task you finish adds XP to your week, and the leaderboard shows who has been showing up this week. It is the closest thing Moltology has to a portfolio.',
  },
  reveal: {
    headline: 'Your first deposit takes five minutes.',
    body: 'Start with a silent start tomorrow and watch the activity log fill.',
    screenshot: 'dashboard',
  },
  related: ['automation', 'strength', 'energy-drinks'],
  faqs: [
    {
      question: 'Does Moltology give investment advice?',
      answer:
        'No. It does not hold money, pick stocks or give financial advice. A daily practice compounds the way small regular deposits do, but the only currency is your time.',
    },
    {
      question: 'What does investing in yourself actually mean here?',
      answer:
        'Putting small, regular amounts of time into the things that pay back for years: focus, learning, sleep, relationships and a calmer head. The eight daily tasks are those deposits.',
    },
    {
      question: 'How fast will I see a return?',
      answer:
        'There is no promised return. Your streak and activity log show exactly what you put in, so you can judge it yourself after a few weeks.',
    },
    {
      question: 'What happens if I miss a day?',
      answer: 'Your streak resets, nothing else. Pick it back up the next morning. One missed day costs far less than quitting.',
    },
    {
      question: 'What are good ways to invest in yourself?',
      answer:
        'Sleep, learning a hard skill, protecting focused time and keeping good people around you. They cost little money and a lot of attention, which is why a daily structure helps.',
    },
    {
      question: 'How is time like compound interest?',
      answer:
        'Small, regular inputs build on the ones before them. Fifteen minutes of reading a day comes to about ninety hours a year, and each hour makes the next one easier to use.',
    },

  ],
  content: {
    hero: {
      eyebrow: 'Self investment, made simple',
      headline: 'Investing in yourself, with daily deposits.',
      sub: 'No minimums, no fees, no market hours. Moltology turns eight small actions a day into a habit that compounds quietly for years.',
      cta: 'Open a free account',
      image: {
        src: '/images/benefits/investing/hero.jpg?v=2',
        alt: 'A purple lobster patiently watering a small potted tree whose leaves are tiny coins',
        width: 1280,
        height: 960,
      },
      card: {
        label: 'Your practice',
        value: 'Day 42',
        change: '+8 tasks today',
        points: [12, 14, 13, 17, 16, 20, 22, 21, 25, 28, 27, 31, 34, 33, 38, 41],
      },
    },
    compound: {
      title: 'Small deposits, real compounding',
      intro: 'A habit works like interest. Each day adds a little, and the gains build on the gains before them.',
      rows: [
        { label: 'One quiet morning', value: '5 min', note: 'Starts the day before your feed does.' },
        { label: 'One focused block', value: '25 to 90 min', note: 'The work that actually moves things.' },
        { label: 'One hard lesson', value: '15 min', note: 'Learning that stacks into a skill.' },
        { label: 'One closed day', value: '5 min', note: 'Review, tidy and sleep on time.' },
      ],
    },
    features: {
      title: 'Built like a good account',
      items: [
        { title: 'Automatic deposits', body: 'The same eight tasks every day, so you never have to decide what self-improvement means this morning.' },
        { title: 'A clear statement', body: 'A streak, weekly XP and an activity log show exactly what you put in and when.' },
        { title: 'An advisor on call', body: 'The Oracle, our AI guide, helps you plan a day, untangle a problem or restart after a bad week.' },
        { title: 'No lock-in', body: 'Free to join and free to leave. Your account keeps your history if you come back.' },
      ],
    },
    statement: {
      title: 'A sample day on your statement',
      intro: 'What a normal Tuesday looks like in the activity log.',
      rows: [
        { when: '7:02', label: 'Silent start', amount: '+1 task' },
        { when: '7:10', label: 'Picked one thing: finish the proposal', amount: '+1 task' },
        { when: '8:30', label: 'Learned something hard: one Academy lesson', amount: '+1 task' },
        { when: '9:00', label: 'Deep work, 75 minutes', amount: '+1 task' },
        { when: '12:30', label: 'Reset your focus', amount: '+1 task' },
        { when: '18:15', label: 'Answered a question on the forum', amount: '+1 task' },
        { when: '21:40', label: 'Let one thing go', amount: '+1 task' },
        { when: '22:00', label: 'Closed the day', amount: '+1 task' },
      ],
    },
  },
}

export default page
