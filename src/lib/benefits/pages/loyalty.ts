import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'loyalty',
  topic: 'Loyalty',
  kit: 'seminar',
  variant: 'olive-monograph',
  query: 'how to be loyal',
  title: 'How to be loyal: show up and ask first | Moltology',
  description:
    'Learn how to be loyal through kept promises, quiet company, and help that starts with a question. Stand beside the people you care about; skip managing them.',
  keywords: 'how to be loyal, loyalty in friendship, keeping promises, supporting a friend',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/loyalty/share.jpg?v=2',
    alt: 'Two amber crabs sitting side by side in navy seminar chairs, warm editorial event photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Soft-Shell Covenant',
    href: '/codex/scr-013#verse-4',
    text: 'Give someone room when they’re going through a change. Ask what they need.',
  },
  reveal: {
    headline: 'Stay for the whole story.',
    body: 'Give someone a few unhurried minutes today.',
    screenshot: 'forum',
  },
  related: ['communication', 'empathy', 'community'],
  faqs: [
    {
      question: 'How do I practice being loyal to a friend during a hard time?',
      answer:
        'Ask what kind of support they want and offer something you can actually do. Listen when they choose company over advice. Follow up on the offer you made instead of sending a bigger promise.',
    },
    {
      question: 'What does learning how to be loyal involve?',
      answer:
        'It involves keeping agreements, respecting privacy, and speaking honestly. Practice with a small promise you can keep. If your plans change, tell the person relying on you before they have to chase you.',
    },
    {
      question: 'Must loyal friends always agree?',
      answer:
        'No. You can disagree with a choice and still care about the person making it. Say what you think respectfully, then respect their right to decide. Loyalty does not require helping someone harm themselves or others.',
    },
    {
      question: 'Where is the line between loyalty and people pleasing?',
      answer:
        'The line is your ability to choose and state a boundary. Agree to help because you mean it, and say no to what you cannot offer. Check whether the relationship leaves room for both people’s needs.',
    },
    {
      question: 'When should I give advice to someone I care about?',
      answer:
        'Ask whether they want advice before offering it. If they want to talk, listen to what happened instead. The Codex puts it plainly: a soft moment is guarded, not corrected.',
    },
    {
      question: 'How do I repair a promise I broke?',
      answer:
        'Acknowledge the promise and the part you did not keep. Apologize plainly and ask whether there is a useful repair you can make. Let the other person decide what they need from you next.',
    },
  ],
  content: {
    hero: {
      kicker: 'A field guide to showing up',
      headline: 'Be loyal. Take the seat beside them.',
      sub: 'When a friend has a rough day, make time for the kind of help they want.',
      cta: 'Start the practice free',
      image: {
        src: '/images/benefits/loyalty/hero.jpg?v=2',
        alt: 'An amber crab seated beside a smaller amber crab at the edge of a seminar stage, soft gold light and navy curtains',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Stay beside them', subtitle: 'The everyday work of keeping your word', author: 'Moltology on showing up' },
    },
    chapters: {
      title: 'Field notes on showing up',
      items: [
        { title: 'A promise with a shape', body: 'Offer to call, carry a bag, or read a draft. Choose something the other person can accept or decline.' },
        { title: 'A question before a plan', body: 'Ask whether they want help thinking, practical help, or company. Their answer sets the agenda for this conversation.' },
        { title: 'Private means private', body: 'Keep someone’s personal news to yourself. Ask permission before sharing it, including with people who mean well.' },
        { title: 'Help on their terms', body: 'Read a member’s question before replying. Answer the thing they asked instead of the thing you enjoy explaining.' },
      ],
    },
    passage: {
      quote: 'A member in the hours after a shed rarely needs feedback.',
      source: { label: 'The Soft-Shell Covenant, verse 4', href: '/codex/scr-013#verse-4' },
    },
  },
}

export default page
