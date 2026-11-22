import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'community',
  topic: 'Community',
  kit: 'network',
  query: 'online community for self improvement',
  title: 'A friendly online community for self improvement | Moltology',
  description:
    'Find your people without the feed. Moltology is a free online community for self improvement, built around one shared daily practice and a forum that helps.',
  keywords: 'online community for self improvement, self improvement community, accountability group, find your people, forum',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/community/share.jpg?v=2',
    alt: 'A group of cartoon crabs laughing together around a beach bonfire at golden hour',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The forum group photo',
    href: '/forum',
    text: 'The top of the forum shows a group photo of active members as their 3D characters, retaken at most once a day as people join.',
  },
  reveal: {
    headline: 'No follower counts. Just people doing the same practice.',
    body: 'Moltology is free: eight small daily tasks, a streak, readings, an AI guide and a forum where helping someone is part of the routine. Join to say hello, or read the demo as a guest first.',
    screenshot: 'forum',
  },
  related: ['charisma', 'gaming', 'spirituality'],
  faqs: [
    {
      question: 'Is Moltology a social network?',
      answer:
        'Not in the usual sense. There is no endless feed and no follower count to chase. It is a forum and a profile built around a shared daily practice, so most conversations are about doing the work.',
    },
    {
      question: 'What makes it a self improvement community?',
      answer:
        'Everyone is working through the same eight daily tasks, one of which is helping another member. That gives people a reason to show up, ask questions and answer them.',
    },
    {
      question: 'What do people post about?',
      answer:
        'Wins and slips from the day, questions about the Codex readings, focus and sleep tips, and the occasional photo of a character in new gear.',
    },
    {
      question: 'Can I stay anonymous?',
      answer: 'Yes. You pick a display name and a 3D character as your avatar. You never have to show your face or real name.',
    },
    {
      question: 'Does it cost anything to join?',
      answer: 'No. Membership, the forum and the daily tasks are free. Oracle MAX, for heavy use of the AI guide, is the only paid option.',
    },
    {
      question: 'Can I read before I join?',
      answer: 'Yes. The forum is open to read, and the demo opens the dashboard as a guest.',
    },
  ],
  content: {
    hero: {
      headline: 'An online community for self improvement that feels like friends.',
      sub: 'No feed to scroll. No numbers to chase. Moltology is a free community where everyone does the same small daily practice, and helping each other is part of it.',
      cta: 'Join free',
      chips: ['Daily practice', 'Kind replies', 'No follower counts', 'Free'],
      image: {
        src: '/images/benefits/community/hero.jpg?v=2',
        alt: 'Cartoon crabs laughing around a beach bonfire at golden hour, one showing the others a phone',
        width: 1280,
        height: 960,
      },
    },
    feed: [
      { name: 'Juno', handle: '@juno', text: 'Day 12. Phone stayed in the drawer until after the silent start. Small, but it counts.', tag: 'Silent start' },
      { name: 'Kit', handle: '@kit', text: 'First week here. What do you all pick as your one thing when everything feels urgent?', tag: 'Question' },
      { name: 'Moss', handle: '@moss', text: 'Pick the thing you would be proudest of by tonight. The urgent things tend to shout for themselves.', tag: 'Help a member' },
    ],
    features: {
      title: 'Built for showing up, not scrolling',
      items: [
        { title: 'A shared practice', body: 'Everyone has the same eight tasks, so there is always something to talk about.' },
        { title: 'Help counts', body: 'Answering another member is one of the daily tasks, so questions get replies.' },
        { title: 'Your character', body: 'A 3D crab or lobster you dress up stands in for your face across the site.' },
        { title: 'Weekly board', body: 'A friendly XP leaderboard that resets each Monday, so anyone can place.' },
      ],
    },
    rooms: {
      title: 'Where people hang out',
      intro: 'A few of the boards on the forum.',
      items: [
        { name: 'General Discussion', body: 'Introductions, daily wins and the rest.' },
        { name: 'Moltmaxxing & Biometrics', body: 'Sleep, training, focus and the numbers behind them.' },
        { name: 'Sacred Doctrine & AI', body: 'The Codex readings and talk about the Oracle.' },
        { name: 'Hardware & Synaptic R&D', body: 'Tools, setups and ways to protect your attention.' },
      ],
    },
    norms: {
      title: 'House rules, short version',
      items: ['Be kind, be useful', 'Ask the beginner question', 'Celebrate small days', 'Leave the sales pitch outside'],
    },
  },
}

export default page
