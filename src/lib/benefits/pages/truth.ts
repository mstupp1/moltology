import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'truth',
  topic: 'Truth',
  kit: 'seminar',
  variant: 'plum-journal',
  query: 'how to be honest with yourself',
  title: 'How to be honest with yourself: name one thing | Moltology',
  description:
    'Practice how to be honest with yourself through the Nightly Molt Audit. Name what happened, choose one thing to release, and close the day with Moltology.',
  keywords: 'how to be honest with yourself, nightly review, Nightly Molt Audit, self honesty',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/truth/share.jpg?v=2',
    alt: 'A pale blue crab writing a single line in a notebook at a seminar desk, intimate evening event photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Nightly Molt Audit',
    href: '/codex/scr-032',
    text: 'Notice a looping thought, a lost hour, or a useless distraction. Set one aside.',
  },
  reveal: {
    headline: 'One honest line is plenty.',
    body: 'Give yesterday a sentence you’d recognize as true.',
    screenshot: 'forum',
  },
  related: ['commitment', 'answers', 'self-help-books'],
  faqs: [
    {
      question: 'How do I stay honest with myself without being cruel?',
      answer:
        'Describe an action instead of giving yourself a label. Write that you left the draft unopened, then name what you did instead. Keep the account accurate and leave insults out of it.',
    },
    {
      question: 'What does learning how to be honest with yourself look like?',
      answer:
        'It looks like comparing what you intended with what you actually did. Use details you can name, such as the file you opened or the call you put off. Admit what you do not know as well as what you do.',
    },
    {
      question: 'Where is the line between honesty and self criticism?',
      answer:
        'Honesty names what happened; self criticism often adds a judgment about your worth. Keep the event and the judgment separate on paper. The Nightly Molt Audit asks you to release one item, not grade your character.',
    },
    {
      question: 'Should I write down every mistake at night?',
      answer:
        'No. Choose a clear stopping rule for a review. In the Codex audit, you name three candidates and release one. Skip the attempt to catalogue every unfinished task before bed.',
    },
    {
      question: 'Can I let something go if I still need to fix it?',
      answer:
        'Yes. You can stop replaying an event and still take responsibility for a repair. Write the action you owe separately. Releasing a repeated thought does not cancel a promise or an apology.',
    },
    {
      question: 'How do I tell an explanation from an excuse?',
      answer:
        'An explanation describes what happened; an excuse is used to avoid responsibility for it. State the circumstance and your part in the decision separately. Then name what you can do about the part that belongs to you.',
    },
  ],
  content: {
    hero: {
      kicker: 'An evening journal',
      headline: 'Be honest with yourself about the evening.',
      sub: 'Write down where the time went and what you’re ready to put down.',
      cta: 'Start the practice free',
      image: {
        src: '/images/benefits/truth/hero.jpg?v=2',
        alt: 'A pale blue crab at a wooden seminar desk with an open notebook and warm reading lamp, navy curtains and evening book-event lighting',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Tell yourself', subtitle: 'A plain account. One thing to put down.', author: 'Moltology · the evening reading' },
    },
    chapters: {
      title: 'The evening audit',
      items: [
        { title: 'The event', body: 'Write what happened before explaining it. The draft stayed closed, the call went unanswered, or the evening went into a feed.' },
        { title: 'The thought that circled', body: 'Name a thought you kept returning to today. You do not need to settle its entire history in tonight’s notebook.' },
        { title: 'The hour unaccounted for', body: 'Look at where the time went. Write the activity plainly instead of turning the blank space into a label for yourself.' },
        { title: 'The thing to release', body: 'Pick exactly one of the candidates. Say it or write it, and let the review stop growing around it.' },
      ],
    },
    passage: {
      quote: 'It does not have to be resolved.',
      source: { label: 'The Nightly Molt Audit, verse 5', href: '/codex/scr-032#verse-5' },
    },
  },
}

export default page
