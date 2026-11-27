import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'community',
  topic: 'Community',
  kit: 'network',
  query: 'online community for self improvement',
  title: 'A friendly online community for self improvement | Moltology',
  description:
    'Find an online community for self improvement with topic boards, shared daily tasks, and a place to ask questions or compare notes.',
  keywords: 'online community for self improvement, self improvement community, accountability group, find your people, forum',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/community/share.jpg?v=2',
    alt: 'A group of cartoon crabs laughing together around a beach bonfire at golden hour',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Moltology forum',
    href: '/forum',
    text: 'Find a board that interests you and add one useful reply.',
  },
  reveal: {
    headline: 'Pull up a chair.',
    body: 'Read a thread and leave one reply worth getting.',
    screenshot: 'forum',
  },
  related: ['charisma', 'gaming', 'spirituality'],
  faqs: [
    {
      question: 'Is Moltology a social network?',
      answer:
        'Moltology has a forum and member profiles. Pick a topic board and join a conversation about the daily practice or something you’re curious about.',
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
      question: 'How do I find an online community for self improvement?',
      answer:
        'Look for one built around something everyone does, not only talk. A shared practice gives people a reason to come back and a common language, which keeps a group friendly and useful.',
    },
    {
      question: 'How do I make friends online as an adult?',
      answer:
        'Turn up in the same place often, help with small things and reply to people by name. Helping another member is one of the daily tasks here, so those small exchanges happen without forcing them.',
    },
  ],
  content: {
    hero: {
      headline: 'A self-improvement community for showing up.',
      sub: 'Bring a good question, a small win, or the habit you’re working on.',
      cta: 'Join the forum free',
      image: {
        src: '/images/benefits/community/hero.jpg?v=2',
        alt: 'Cartoon crabs laughing around a beach bonfire at golden hour, one showing the others a phone',
        width: 1280,
        height: 960,
      },
    },
    feed: [
      { name: 'Juno', handle: '@juno', text: 'Day 12. Phone stayed in the drawer until after the silent start. Small, but it counts.', tag: 'Silent start', cast: 'crab_juno_marsh' },
      { name: 'Kit', handle: '@kit', text: 'First week here. What do you all pick as your one thing when everything feels urgent?', tag: 'Question', cast: 'lobster_kit_shallows' },
      { name: 'Moss', handle: '@moss', text: 'Pick the thing you would be proudest of by tonight. The urgent things tend to shout for themselves.', tag: 'Help a member', cast: 'crab_moss_tern' },
    ],
    rooms: {
      title: 'Find your corner',
      intro: 'Ask a question, share what worked, or welcome someone new.',
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
