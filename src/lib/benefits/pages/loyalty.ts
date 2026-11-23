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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/loyalty/share.jpg?v=2',
    alt: 'Two amber crabs sitting side by side in navy seminar chairs, warm editorial event photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The window is guarded, not corrected',
    href: '/codex/scr-013#verse-4',
    text: 'After a hard change, people rarely need feedback. They need quiet company. Ask what they need, respect the answer, and keep your improvement plan in your pocket.',
  },
  reveal: {
    headline: 'Someone needs company, not a keynote.',
    body: 'Help a member starts with the person asking for help.',
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
      kicker: 'A field guide to being there',
      headline: 'Be loyal enough to leave the advice unspoken.',
      sub: 'Your friend has had a rough day. They have not asked for a twelve-point turnaround plan. Show up, listen, and offer the help they actually asked for.',
      cta: 'Make room for the practice',
      image: {
        src: '/images/benefits/loyalty/hero.jpg?v=2',
        alt: 'An amber crab seated beside a smaller amber crab at the edge of a seminar stage, soft gold light and navy curtains',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Stay beside them', subtitle: 'The everyday work of keeping your word', author: 'Moltology on showing up' },
    },
    promise: {
      title: 'Five things to leave your seat and do',
      items: [
        'Offer help you have the time and means to give',
        'Ask before turning a conversation into a coaching session',
        'Keep private news out of the group chat',
        'Speak up when your availability changes',
        'Respect a boundary even when you would choose differently',
      ],
    },
    chapters: {
      title: 'The small print of showing up',
      items: [
        { title: 'A promise with a shape', body: 'Offer to call, carry a bag, or read a draft. Choose something the other person can accept or decline.' },
        { title: 'A question before a plan', body: 'Ask whether they want help thinking, practical help, or company. Their answer sets the agenda for this conversation.' },
        { title: 'Room for the silence', body: 'Sit beside someone without filling every gap. A quiet moment does not require you to produce a lesson.' },
        { title: 'Private means private', body: 'Keep someone’s personal news to yourself. Ask permission before sharing it, including with people who mean well.' },
        { title: 'An honest limit', body: 'Say when you cannot take something on. Avoid offering your whole weekend when you only have time for a call.' },
        { title: 'A difference of opinion', body: 'Disagree with the choice, plainly and once. Leave the person’s worth and your history together out of the argument.' },
        { title: 'Help on their terms', body: 'Read a member’s question before replying. Answer the thing they asked instead of the thing you enjoy explaining.' },
        { title: 'Your word, revisited', body: 'Check the promise you made. If you missed it, name that plainly and ask about a repair you can offer.' },
      ],
    },
    passage: {
      quote: 'A member in the hours after a shed rarely needs feedback.',
      source: { label: 'The Soft-Shell Covenant, verse 4', href: '/codex/scr-013#verse-4' },
    },
    agenda: {
      title: 'A seat beside someone',
      intro: 'The daily task Help a member asks for a useful reply or a welcome. Take the same care into the promises you make away from the screen.',
      items: [
        { time: 'An invitation', title: 'Ask if they would like some company' },
        { time: 'A reply', title: 'Listen to the kind of help they name' },
        { time: 'An offer', title: 'Choose something you are able to do' },
        { time: 'A boundary', title: 'Accept what they prefer to keep private' },
        { time: 'A promise', title: 'Do the part you said you would do' },
        { time: 'A follow-up', title: 'Check in without demanding a progress report' },
      ],
    },
  },
}

export default page
