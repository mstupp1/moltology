import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'investing',
  topic: 'Investing',
  kit: 'ledger',
  query: 'investing in yourself',
  title: 'Investing in yourself, one small deposit a day | Moltology',
  description:
    'Investing in yourself can begin with a block of focus or one hard lesson. Use Moltology’s free daily practice to keep a record of the work.',
  keywords: 'investing in yourself, self investment, compound habits, personal growth, daily routine, self improvement',
  indexed: true,
  updated: '2026-11-27',
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
    text: 'Completed tasks add XP to your weekly total.',
  },
  reveal: {
    headline: 'Make a deposit of attention.',
    body: 'Start with a block of work or one hard lesson.',
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
      answer: 'Pick up with one manageable task on your next practice day. The activity log keeps a record of work you’ve already done.',
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
      headline: 'Investing in yourself, one hour at a time.',
      sub: 'Put a little attention into something that matters. Log the work you actually did.',
      cta: 'Start a free account',
      image: {
        src: '/images/benefits/investing/hero.jpg?v=2',
        alt: 'A purple lobster patiently watering a small potted tree whose leaves are tiny coins',
        width: 1280,
        height: 960,
      },
    },
    features: {
      title: 'Your attention account',
      items: [
        { title: 'Scheduled deposits', body: 'The daily checklist gives focused work and learning a place.' },
        { title: 'Activity statement', body: 'See the tasks and XP you’ve logged.' },
        { title: 'A guide on call', body: 'Bring the Oracle a hard chapter or a draft you keep reopening.' },
        { title: 'Weekly standings', body: 'See how your practice adds up on the XP leaderboard.' },
      ],
    },
    statement: {
      title: 'Your attention statement',
      intro: 'A few sample entries from an ordinary Tuesday.',
      rows: [
        { when: '7:10', label: 'Picked one thing: finish the proposal', amount: '+1 task' },
        { when: '8:30', label: 'Learned something hard: one Academy lesson', amount: '+1 task' },
        { when: '9:00', label: 'Deep work, 75 minutes', amount: '+1 task' },
        { when: '22:00', label: 'Closed the day', amount: '+1 task' },
      ],
    },
  },
}

export default page
