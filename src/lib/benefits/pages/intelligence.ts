import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'intelligence',
  topic: 'Intelligence',
  kit: 'clinic',
  variant: 'clinical-editorial',
  query: 'how to get smarter',
  title: 'How to get smarter: go beyond the bookmark | Moltology',
  description:
    'Asking how to get smarter? Choose something you cannot explain yet. Moltology gives you a daily task for it: learn one hard thing, then check your answer.',
  keywords: 'how to get smarter, learning habits, active recall, study routine, learn something hard',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/intelligence/share.jpg?v=2',
    alt: 'A lobster leaning over a diagram at a cream desk, photographed as a clean learning clinic campaign',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Learn something hard',
    href: '/codex/scr-030#verse-4',
    text: 'Choose something difficult enough to make you reach for a pencil.',
  },
  reveal: {
    headline: 'Put a question in the margin.',
    body: 'Give one hard lesson a slot on today’s task list.',
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
      eyebrow: 'Daily study',
      headline: 'Get smarter. Open the hard chapter.',
      sub: 'Pick a question you can’t answer yet. Stay with the page until you can explain it.',
      cta: 'Start free',
      image: {
        src: '/images/benefits/intelligence/hero-alt.jpg',
        alt: 'Maris Slate, a cobalt-blue crab with tide markings, leaning over an open notebook at a warm timber desk beside a sunlit window and library shelves',
        width: 1024,
        height: 1280,
      },
    },
    steps: {
      title: 'A short study protocol',
      items: [
        { title: 'Find the hard part', body: 'Choose the term, step or example you cannot explain. Write it as a question before searching for another lesson.' },
        { title: 'Try an answer', body: 'Read carefully, then close the source. Solve the problem or explain the idea on paper, including the parts you are unsure about.' },
        { title: 'Check the working', body: 'Compare your answer with the source. Correct the mistake and tick the learning task after doing the work. Keep the next question in your notes.' },
      ],
    },
    plans: {
      title: 'The study shelf',
      intro: 'Bring your own book, course, or problem.',
      items: [
        { name: 'Open the difficult bit', tag: 'For familiar feeds', body: 'The verse behind Learn something hard is blunt: learn one difficult thing on purpose. Pick the explanation you keep scrolling past and follow it with a pencil.', href: '/codex/scr-030#verse-4' },
        { name: 'Choose one question', tag: 'For long reading lists', body: 'Read the instruction behind Pick your one thing. Choose which question matters today before browsing another shelf of possible subjects.', href: '/codex/scr-030#verse-3' },
        { name: 'Stay with the problem', tag: 'For busy desks', body: 'Use the work protocol to arrange an uninterrupted session. Keep your reference material close and unrelated messages for afterward.', href: '/codex/scr-031' },
      ],
    },
  },
}

export default page
