import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'intelligence',
  topic: 'Intelligence',
  kit: 'clinic',
  query: 'how to get smarter',
  title: 'How to get smarter: go beyond the bookmark | Moltology',
  description:
    'Asking how to get smarter? Choose something you cannot explain yet. Moltology gives you a daily task for it: learn one hard thing, then check your answer.',
  keywords: 'how to get smarter, learning habits, active recall, study routine, learn something hard',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/intelligence/share.jpg?v=2',
    alt: 'A lobster leaning over a diagram at a cream desk, photographed as a clean learning clinic campaign',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Learn something hard, from the daily Codex routine',
    href: '/codex/scr-030#verse-4',
    text: 'Learn something hard comes from a Codex verse asking you to study a difficult thing on purpose instead of skimming a feed. Bring a question you cannot answer yet. Open the source, work through the confusing part and check your own explanation against it.',
  },
  reveal: {
    headline: 'The difficult chapter has a place here.',
    body: 'Use Learn something hard for the question you keep skipping.',
    screenshot: 'dashboard',
  },
  related: ['focus', 'technique', 'self-help-books'],
  faqs: [
    {
      question: 'How can I get smarter about a new subject?',
      answer:
        'Learn the basics you cannot explain yet. Pick a beginner source and work through an example before adding another resource. In Moltology, Learn something hard is the daily invitation to do that work on purpose.',
    },
    {
      question: 'Can reading help when I want to get smarter?',
      answer:
        'Yes, reading is one way to study a subject. Give yourself a question to answer, close the book and explain what you read in your own words. Then check the explanation against the passage instead of counting pages alone.',
    },
    {
      question: 'What is active recall?',
      answer:
        'Active recall means trying to retrieve an answer from memory before looking it up. Cover the definition, answer the question or draw the diagram yourself. Open the source afterward and mark the part you missed.',
    },
    {
      question: 'How should I study a topic that feels too difficult?',
      answer:
        'Go back to the first step you cannot follow. Look up the unfamiliar term or work through a simpler example. Bring that smaller question to your next study session; you do not have to tackle the entire chapter at once.',
    },
    {
      question: 'Does the Moltmax quiz measure IQ?',
      answer:
        'No. The Moltmax quiz has 15 questions about the practice areas used in Moltology, not intelligence or academic ability. Use exercises from your chosen subject to check what you understand.',
    },
    {
      question: 'When should I ask for help with a hard problem?',
      answer:
        'Ask when you can point to the step where you got stuck. Show what you tried and which part does not make sense. In the forum, include enough of the problem for another member to follow your reasoning.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Learning plan · no entry requirements',
      headline: 'How to get smarter: open the hard chapter.',
      sub: 'Your bookmarks have had enough time to prepare. Pick something you want to understand and do the difficult part. Moltology puts one hard lesson in your day, every day.',
      checks: ['Bring your own subject', 'Start at your level', 'Check off the work'],
      cta: 'Start your learning routine',
      image: {
        src: '/images/benefits/intelligence/hero.jpg?v=2',
        alt: 'A lobster studying a technical drawing at a pale desk, with soft directional light and restrained clinic portrait styling',
        width: 1024,
        height: 1280,
      },
    },
    trust: ['No course prerequisite', 'Daily learning task', 'Choose what to study', 'Ask in the forum'],
    signs: {
      title: 'You know where you stopped reading',
      intro: 'Start with the bit you skipped. The next lesson can be a paragraph, a diagram or a problem that needs another attempt.',
      items: [
        'The article is saved, but the question is still unanswered',
        'You recognize the term until someone asks you to explain it',
        'The worked example looks easy with the answer beside it',
        'You skip the diagram and hope the next page explains it',
        'A new reading list takes the place of opening the old one',
      ],
    },
    steps: {
      title: 'From saved link to study session',
      items: [
        { title: 'Find the hard part', body: 'Choose the term, step or example you cannot explain. Write it as a question before searching for another lesson.' },
        { title: 'Try an answer', body: 'Read carefully, then close the source. Solve the problem or explain the idea on paper, including the parts you are unsure about.' },
        { title: 'Check the working', body: 'Compare your answer with the source. Correct the mistake and tick the learning task after doing the work. Keep the next question in your notes.' },
      ],
    },
    plans: {
      title: 'Make room for the hard lesson',
      intro: 'Choose a reading for the part of studying you keep putting off. Bring your own book, course or practice problem.',
      items: [
        { name: 'Open the difficult bit', tag: 'For familiar feeds', body: 'The verse behind Learn something hard is blunt: learn one difficult thing on purpose. Pick the explanation you keep scrolling past and follow it with a pencil.', href: '/codex/scr-030#verse-4' },
        { name: 'Choose one question', tag: 'For long reading lists', body: 'Read the instruction behind Pick your one thing. Choose which question matters today before browsing another shelf of possible subjects.', href: '/codex/scr-030#verse-3' },
        { name: 'Stay with the problem', tag: 'For busy desks', body: 'Use the work protocol to arrange an uninterrupted session. Keep your reference material close and unrelated messages for afterward.', href: '/codex/scr-031' },
      ],
    },
    compare: {
      title: 'More than a full bookmarks folder',
      us: 'Working through it',
      them: 'Saving it for later',
      rows: [
        { label: 'The question', us: 'Write what you do not understand', them: 'Collect interesting titles' },
        { label: 'The example', us: 'Try it with the answer covered', them: 'Nod along to the solution' },
        { label: 'The explanation', us: 'Put it in your own words', them: 'Copy the highlighted paragraph' },
        { label: 'The follow-up', us: 'Check the step you missed', them: 'Find another reading list' },
      ],
    },
  },
}

export default page
