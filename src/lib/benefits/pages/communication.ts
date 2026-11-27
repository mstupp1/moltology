import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'communication',
  topic: 'Communication',
  kit: 'seminar',
  variant: 'keynote-stage',
  query: 'how to communicate better',
  title: 'How to communicate better: start by listening | Moltology',
  description:
    'Learn how to communicate better with plain requests, patient listening, and room for a reply. Read the Codex and take the practice into your next conversation.',
  keywords: 'how to communicate better, listening, clear requests, communication practice',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/communication/share.jpg?v=2',
    alt: 'Two coral crabs at a seminar table with one microphone between them, polished event photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Soft-Shell Covenant',
    href: '/codex/scr-013#verse-5',
    text: 'Put your effort into the work. Give the people doing it room to speak.',
  },
  reveal: {
    headline: 'Take it into the next conversation.',
    body: 'Practice one useful reply today.',
    screenshot: 'forum',
  },
  related: ['charisma', 'loyalty', 'community'],
  faqs: [
    {
      question: 'How do I communicate better during a disagreement?',
      answer:
        'Describe one event and say what you are asking for now. Let the other person finish, then check that you understood their point. Pause the conversation if either of you needs time before continuing.',
    },
    {
      question: 'Can I learn how to communicate better over text?',
      answer:
        'Yes. Put the request near the beginning and include the detail needed to answer it. Read your message once for tone, then remove the sentence that guesses what the other person secretly meant.',
    },
    {
      question: 'What does active listening mean?',
      answer:
        'Active listening means paying attention and checking your understanding. Briefly repeat what you heard and ask whether you have it right. Leave your own example until the person has finished theirs.',
    },
    {
      question: 'Why do I keep interrupting people?',
      answer:
        'Usually excitement, habit, or rushing to answer. Notice the moment you start composing your reply while someone is talking. If you cut in, stop and invite them to finish; skip the explanation.',
    },
    {
      question: 'Where should I start with a difficult conversation?',
      answer:
        'Start by asking whether now is a workable time. State the issue with a concrete example and make one request. A conversation about the dishes need not open with a complete history of the relationship.',
    },
    {
      question: 'Does being assertive mean being forceful?',
      answer:
        'No. Assertiveness means stating your needs and boundaries clearly while respecting the other person’s choice. The Codex draws its line at pressure aimed at people: keep the grip on your own work.',
    },
  ],
  content: {
    hero: {
      kicker: 'A short course in listening',
      headline: 'Communicate better. Leave room for an answer.',
      sub: 'Ask one clear question. Let the other person finish before you reply.',
      cta: 'Start the practice free',
      image: {
        src: '/images/benefits/communication/hero.jpg?v=2',
        alt: 'A coral crab holding a handheld microphone low while another crab speaks, navy seminar stage and warm spotlights',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Say it plainly', subtitle: 'Ask clearly. Listen all the way through.', author: 'A Moltology practice' },
    },
    chapters: {
      title: 'The conversation, in four pages',
      items: [
        { title: 'Put the screen away', body: 'Set your phone down before someone starts talking. If you need to check something, say so instead of splitting your attention silently.' },
        { title: 'Find the actual question', body: 'Write the thing you need to ask in one sentence. Read it back and remove the opening speech.' },
        { title: 'Check the meaning', body: 'Repeat the point in your own words and ask if it is right. Let the speaker correct your version.' },
        { title: 'Ask for something', body: 'Say who needs to do what. Replace the vague complaint about nobody helping with a request about the next task.' },
      ],
    },
    passage: {
      quote: 'Aim a strong grip at a person and the tool has malfunctioned.',
      source: { label: 'The Soft-Shell Covenant, verse 5', href: '/codex/scr-013#verse-5' },
    },
  },
}

export default page
