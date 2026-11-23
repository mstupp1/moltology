import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'truth',
  topic: 'Truth',
  kit: 'seminar',
  query: 'how to be honest with yourself',
  title: 'How to be honest with yourself: name one thing | Moltology',
  description:
    'Practice how to be honest with yourself through the Nightly Molt Audit. Name what happened, choose one thing to release, and close the day with Moltology.',
  keywords: 'how to be honest with yourself, nightly review, Nightly Molt Audit, self honesty',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/truth/share.jpg?v=2',
    alt: 'A pale blue crab writing a single line in a notebook at a seminar desk, intimate evening event photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Nightly Molt Audit',
    href: '/codex/scr-032',
    text: 'Each night, name three candidates: a thought that circled, an hour you cannot account for, and a distraction that produced nothing. Release exactly one, write it plainly, and close the day.',
  },
  reveal: {
    headline: 'One honest line is enough for tonight.',
    body: 'Let one thing go asks for a named item, not a verdict on yourself.',
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
      kicker: 'The evening session · bring a notebook',
      headline: 'Be honest with yourself about where the evening went.',
      sub: 'You opened the phone to check one thing. The kettle boiled twice. Write down what happened without the courtroom speech. The nightly practice wants a short, plain account and one thing to let go.',
      cta: 'Begin an honest practice',
      image: {
        src: '/images/benefits/truth/hero.jpg?v=2',
        alt: 'A pale blue crab at a wooden seminar desk with an open notebook and warm reading lamp, navy curtains and evening book-event lighting',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Tell yourself', subtitle: 'A plain account. One thing to put down.', author: 'Moltology · the evening reading' },
    },
    promise: {
      title: 'Leave the grand confession out of it',
      items: [
        'Use the name of the thing you actually did',
        'Separate what happened from what you guessed',
        'Give unfinished work an honest mark',
        'Keep any repair you owe on its own list',
        'Choose one item to release and end the review',
      ],
    },
    chapters: {
      title: 'An account you can write in plain ink',
      items: [
        { title: 'The event', body: 'Write what happened before explaining it. The draft stayed closed, the call went unanswered, or the evening went into a feed.' },
        { title: 'The missing detail', body: 'Name the part you keep leaving out of the story. Include what you chose as well as what interrupted you.' },
        { title: 'The guess', body: 'Mark what you are assuming about someone else’s thoughts. Keep a guess from becoming a fact just because you have repeated it.' },
        { title: 'The thought that circled', body: 'Name a thought you kept returning to today. You do not need to settle its entire history in tonight’s notebook.' },
        { title: 'The hour unaccounted for', body: 'Look at where the time went. Write the activity plainly instead of turning the blank space into a label for yourself.' },
        { title: 'The distraction', body: 'Name the tab, thread, or notification that kept calling you back. Choose whether this is the item to put down tonight.' },
        { title: 'The thing to release', body: 'Pick exactly one of the candidates. Say it or write it, and let the review stop growing around it.' },
        { title: 'The closed notebook', body: 'Record the release and mark the day honestly. Close the page even if a few boxes remain unchecked.' },
      ],
    },
    passage: {
      quote: 'It does not have to be resolved.',
      source: { label: 'The Nightly Molt Audit, verse 5', href: '/codex/scr-032#verse-5' },
    },
    agenda: {
      title: 'Before the last screen goes dark',
      intro: 'Follow the audit’s small sequence. Keep a separate note for anything that needs an apology or practical repair; the review does not do that work for you.',
      items: [
        { time: 'Take a seat', title: 'Put the notebook where you can write in it' },
        { time: 'First candidate', title: 'Name the thought you kept circling' },
        { time: 'Second candidate', title: 'Account for the hour that went elsewhere' },
        { time: 'Third candidate', title: 'Write down the distraction that produced nothing' },
        { time: 'One choice', title: 'Let one thing go from the three you named' },
        { time: 'Notebook closed', title: 'Record it and stop reviewing the evening' },
      ],
    },
  },
}

export default page
