import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'answers',
  topic: 'Answers',
  kit: 'seminar',
  variant: 'midnight-folio',
  query: 'meaning of life',
  title: 'Meaning of life: bring the question with you | Moltology',
  description:
    'The meaning of life is a large question for an ordinary Tuesday. Read the Prime Directive and choose what deserves your attention in Moltology’s daily practice.',
  keywords: 'meaning of life, purpose, Prime Directive, choosing what matters',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/answers/share.jpg?v=2',
    alt: 'A purple lobster reading at a seminar lectern under one broad gold spotlight, cinematic author-event photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Prime Directive',
    href: '/codex/scr-001',
    text: 'Give your attention to the work and people you mean to keep in your life.',
  },
  reveal: {
    headline: 'Put something on the calendar.',
    body: 'Read a passage and give one of its ideas an hour today.',
    screenshot: 'forum',
  },
  related: ['spirituality', 'self-help-books', 'commitment'],
  faqs: [
    {
      question: 'What do people mean by the meaning of life?',
      answer:
        'Usually one of four things: purpose, value, belonging, or a reason to keep going. Ask which of those questions you are trying to answer. A question about your work may call for a different conversation from one about your beliefs.',
    },
    {
      question: 'Where does meaning in life come from?',
      answer:
        'Usually from the people, work and responsibilities you care about, and from how you spend your time on them. Write down one that matters to you. Then name an action you want to take in its direction.',
    },
    {
      question: 'Do I need a single purpose for my whole life?',
      answer:
        'No. You can care about several things and change your priorities as life changes. Choose what needs your attention now instead of requiring every decision to fit one permanent statement.',
    },
    {
      question: 'Can everyday responsibilities be meaningful?',
      answer:
        'Yes. Caring for someone, learning a craft, and keeping a promise can express what you value. Name the part you choose to care about, including when the task itself is ordinary.',
    },
    {
      question: 'Does the Prime Directive give a final answer about purpose?',
      answer:
        'No. It offers Moltology’s opening invitation and a small exercise about the demands that move your day. Read it as a starting point for choosing what to do, with room to question what you read.',
    },
    {
      question: 'Must I settle my beliefs before starting a daily practice?',
      answer:
        'No. You can practice a clear action while leaving a larger belief undecided. Choose a task because you understand and accept what it asks. You can read the Codex without agreeing with every line.',
    },
  ],
  content: {
    hero: {
      kicker: 'A reading in purpose',
      headline: 'The meaning of life can start on Tuesday.',
      sub: 'Bring the big question. Give one ordinary hour to something that matters.',
      cta: 'Start the practice free',
      image: {
        src: '/images/benefits/answers/hero.jpg?v=2',
        alt: 'A purple lobster beside an open book on a tall seminar lectern, expansive navy stage and a single gold spotlight',
        width: 1024,
        height: 1280,
      },
      book: { title: 'What matters?', subtitle: 'A large question. A day you can choose.', author: 'Moltology · an invitation to read' },
    },
    chapters: {
      title: 'A short book for the big question',
      items: [
        { title: 'Ask your own version', body: 'Write the question you actually have. Are you choosing work, missing someone, or wondering what to do with an open afternoon?' },
        { title: 'Choose what matters now', body: 'Pick a responsibility or interest you want to act on today. Keep the action small enough to begin with what you have.' },
        { title: 'Give it some room', body: 'Put the competing demands aside during your chosen work. Keep your attention on the task instead of rewriting your life plan.' },
        { title: 'Care for someone', body: 'Answer a member’s question or welcome a newcomer. Let the reply be useful to that person, even if nobody else reads it.' },
      ],
    },
    passage: {
      quote: 'You are permitted to go there.',
      source: { label: 'The Prime Directive, verse 1', href: '/codex/scr-001#verse-1' },
    },
  },
}

export default page
