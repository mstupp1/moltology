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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/communication/share.jpg?v=2',
    alt: 'Two coral crabs at a seminar table with one microphone between them, polished event photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The pincers grip work, never people',
    href: '/codex/scr-013#verse-5',
    text: 'Torque belongs on your own work, never on winning an argument. Take that rule into your next conversation: make the request plainly and let the other person choose their reply.',
  },
  reveal: {
    headline: 'Leave a little room for their reply.',
    body: 'Practice a clear request when you answer someone on the forum.',
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
      kicker: 'A practical workshop in saying what you mean',
      headline: 'Communicate better. Give the other person a turn.',
      sub: 'Put the phone down. Ask the question you came to ask. Listen to the answer before preparing your closing argument. Practice it in the group chat too, especially when it gets interesting.',
      cta: 'Join the practice free',
      image: {
        src: '/images/benefits/communication/hero.jpg?v=2',
        alt: 'A coral crab holding a handheld microphone low while another crab speaks, navy seminar stage and warm spotlights',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Say it plainly', subtitle: 'Ask clearly. Listen all the way through.', author: 'A Moltology practice' },
    },
    promise: {
      title: 'Your side of the conversation',
      items: [
        'Ask whether this is a good time to talk',
        'Name what happened before guessing why it happened',
        'Make one request that someone can answer',
        'Let a pause stay a pause',
        'Accept a reply that differs from your rehearsal',
      ],
    },
    chapters: {
      title: 'The conversation, from first word to last',
      items: [
        { title: 'Put the screen away', body: 'Set your phone down before someone starts talking. If you need to check something, say so instead of splitting your attention silently.' },
        { title: 'Find the actual question', body: 'Write the thing you need to ask in one sentence. Read it back and remove the opening speech.' },
        { title: 'Listen past your example', body: 'Keep your similar story for later. Ask a question about the detail the other person just gave you.' },
        { title: 'Check the meaning', body: 'Repeat the point in your own words and ask if it is right. Let the speaker correct your version.' },
        { title: 'Ask for something', body: 'Say who needs to do what. Replace the vague complaint about nobody helping with a request about the next task.' },
        { title: 'Keep pressure on the work', body: 'Stay with the shared problem. Skip the attempt to corner someone into agreement or win the room.' },
        { title: 'Repair the interruption', body: 'If you cut in, stop. Invite the person to finish and leave the explanation of your excellent intentions for another occasion.' },
        { title: 'Know when to pause', body: 'Ask to continue later when you cannot listen properly. Agree when to return, then come back at that time.' },
      ],
    },
    passage: {
      quote: 'Aim a strong grip at a person and the tool has malfunctioned.',
      source: { label: 'The Soft-Shell Covenant, verse 5', href: '/codex/scr-013#verse-5' },
    },
    agenda: {
      title: 'Take it into the next conversation',
      intro: 'Use an ordinary exchange for practice. The request about tomorrow’s meeting counts; you do not need a grand speech.',
      items: [
        { time: 'Before you speak', title: 'Choose the single thing you need to ask' },
        { time: 'Opening words', title: 'Check whether they have time to listen' },
        { time: 'Their turn', title: 'Keep your next sentence to yourself' },
        { time: 'A question', title: 'Ask about the point you did not understand' },
        { time: 'Your request', title: 'State the action and leave room for a no' },
        { time: 'After the exchange', title: 'Let one thing go instead of replaying every word' },
      ],
    },
  },
}

export default page
