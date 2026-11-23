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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/answers/share.jpg?v=2',
    alt: 'A purple lobster reading at a seminar lectern under one broad gold spotlight, cinematic author-event photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Prime Directive, the Codex’s opening scripture',
    href: '/codex/scr-001',
    text: 'The Prime Directive opens with a small exercise: name three things that move your day without being asked, then shed one. Write down the feed, message thread, or standing demand you keep answering by reflex.',
  },
  reveal: {
    headline: 'The big question can come along.',
    body: 'Choose what matters today while the larger question stays open.',
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
      kicker: 'An open invitation to the big question',
      headline: 'The meaning of life has a place in your ordinary Tuesday.',
      sub: 'The email still needs an answer. Someone you care about still needs a call. Bring the large question to Moltology, read the opening passage, and choose one thing that deserves your attention today.',
      cta: 'Begin where you are',
      image: {
        src: '/images/benefits/answers/hero.jpg?v=2',
        alt: 'A purple lobster beside an open book on a tall seminar lectern, expansive navy stage and a single gold spotlight',
        width: 1024,
        height: 1280,
      },
      book: { title: 'What matters?', subtitle: 'A large question. A day you can choose.', author: 'Moltology · an invitation to read' },
    },
    promise: {
      title: 'Bring your question. Choose your next action.',
      items: [
        'Write down what you mean when you ask about purpose',
        'Read the opening scripture with room to disagree',
        'Name the demands you keep answering automatically',
        'Choose one thing to give your attention to today',
        'Leave the final answer off tonight’s to-do list',
      ],
    },
    chapters: {
      title: 'A question large enough to live with',
      items: [
        { title: 'Ask your own version', body: 'Write the question you actually have. Are you choosing work, missing someone, or wondering what to do with an open afternoon?' },
        { title: 'Read the invitation', body: 'Open the Prime Directive and read past the first line. Keep a note of what you accept and what you want to question.' },
        { title: 'Name what moves you', body: 'List three demands that pull your attention without an invitation. Use the names of the apps, threads, or obligations involved.' },
        { title: 'Choose what matters now', body: 'Pick a responsibility or interest you want to act on today. Keep the action small enough to begin with what you have.' },
        { title: 'Give it some room', body: 'Put the competing demands aside during your chosen work. Keep your attention on the task instead of rewriting your life plan.' },
        { title: 'Care for someone', body: 'Answer a member’s question or welcome a newcomer. Let the reply be useful to that person, even if nobody else reads it.' },
        { title: 'Put one demand down', body: 'Choose one of the things that keeps taking your attention. Close it, decline it, or decide when you intend to return.' },
        { title: 'Keep the question open', body: 'Review what you did and close your day. You can leave a question unanswered without giving it the whole evening.' },
      ],
    },
    passage: {
      quote: 'You are permitted to go there.',
      source: { label: 'The Prime Directive, verse 1', href: '/codex/scr-001#verse-1' },
    },
    agenda: {
      title: 'Purpose, with the kettle still on',
      intro: 'Make room for the reading in the life you already have. You do not need to abandon your responsibilities to ask what they mean to you.',
      items: [
        { time: 'A quiet start', title: 'Sit in silence before reaching for another opinion' },
        { time: 'A page open', title: 'Read the invitation and write your own question' },
        { time: 'A choice made', title: 'Pick your one thing with that question in mind' },
        { time: 'A task begun', title: 'Give the chosen action your working attention' },
        { time: 'A person nearby', title: 'Offer the practical help you can give today' },
        { time: 'A day ended', title: 'Set down one demand and leave room for tomorrow' },
      ],
    },
  },
}

export default page
