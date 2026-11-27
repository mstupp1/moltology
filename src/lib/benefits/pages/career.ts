import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'career',
  topic: 'Career',
  kit: 'ledger',
  variant: 'executive-navy',
  query: 'career growth',
  title: 'Career growth deserves time on the calendar | Moltology',
  description:
    'Make time for career growth: choose a project, study one difficult question and do focused work. A free daily practice with a clear place to start.',
  keywords: 'career growth, professional learning, focused work, skill practice, work priorities',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/career/share.jpg?v=2',
    alt: 'A lobster with one project folder in a crisp corporate annual report photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Two pincers beat ten hands',
    href: '/codex/scr-012#verse-4',
    text: 'Give one job your full grip before you take on another.',
  },
  reveal: {
    headline: 'Make your next work block count.',
    body: 'Pick a skill worth learning or a draft worth finishing.',
    screenshot: 'dashboard',
  },
  related: ['focus', 'intelligence', 'hustle'],
  faqs: [
    {
      question: 'How do I make a career growth plan?',
      answer:
        'Choose a direction, name a skill it asks for and pick a project where you can practice it. Ask someone familiar with the work for feedback on that project. Put the next study session on your calendar.',
    },
    {
      question: 'What counts as career growth besides a new title?',
      answer:
        'Career growth can mean deeper skills, different responsibilities or a change in the work you want to do. Write down which one you mean before choosing a course, because each needs a different plan.',
    },
    {
      question: 'Which skill should I learn for my current role?',
      answer:
        'One tied to a real task you find difficult. Ask a colleague or manager which part needs attention, then choose a lesson or exercise about that part. Keep the question narrow enough to practice on an actual piece of work.',
    },
    {
      question: 'Where does deep work fit in a meeting-heavy day?',
      answer:
        'Look for a block that fits your role and agree on it with the people who need you. Pick one task for that block and decide how urgent requests can reach you. Use Do deep work for that focused session.',
    },
    {
      question: 'Why are my saved courses still unfinished?',
      answer:
        'A course may be too broad or disconnected from the work you need to do. Pick one question from a current project and look for the relevant lesson in material you already have. Open that lesson before browsing another catalog.',
    },
    {
      question: 'How should I ask for useful feedback at work?',
      answer:
        'Show a piece of work and ask about one part of it. “Where is this explanation unclear?” gives the other person something to answer. Note their response and choose which change to try in your next draft.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Professional development · Free account',
      headline: 'Put career growth on the calendar.',
      sub: 'Protect a block for work you want to put your name on. Save another for the skill you keep putting off.',
      cta: 'Start a free account',
      image: {
        src: '/images/benefits/career/hero.jpg?v=2',
        alt: 'A red lobster reading a work document at a navy desk under precise financial press portrait lighting',
        width: 1280,
        height: 960,
      },
    },
    features: {
      title: 'A working account',
      items: [
        { title: 'A priority before the inbox', body: 'Name what matters today and start on it. Choose the proposal section you need to write before collecting another list of ideas.' },
        { title: 'Study on the checklist', body: 'Learn something hard makes room for a subject that pushes back. Read the documentation, work through the example and write down the question that remains.' },
        { title: 'One file in focus', body: 'One thing, interruptions shut out. Agree on availability where needed, then put the phone aside for the session.' },
        { title: 'A useful second opinion', body: 'Bring the Oracle a broad project and ask for a first step.' },
      ],
    },
    statement: {
      title: 'Today’s time allocation',
      intro: 'A sample entry for learning, work, and the end of the day.',
      rows: [
        { when: 'Choose the project', label: 'Pick your one thing', amount: '+1 task' },
        { when: 'Read the hard chapter', label: 'Learn something hard', amount: '+1 task' },
        { when: 'Work on the draft', label: 'Do deep work', amount: '+1 task' },
        { when: 'End the workday', label: 'Close the day', amount: '+1 task' },
      ],
    },
  },
}

export default page
