import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'career',
  topic: 'Career',
  kit: 'ledger',
  query: 'career growth',
  title: 'Career growth deserves time on the calendar | Moltology',
  description:
    'Make time for career growth: choose a project, study one difficult question and do focused work. A free daily practice with a clear place to start.',
  keywords: 'career growth, professional learning, focused work, skill practice, work priorities',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/career/share.jpg?v=2',
    alt: 'A lobster with one project folder in a crisp corporate annual report photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Two pincers beat ten hands, a Codex reading',
    href: '/codex/scr-012#verse-4',
    text: 'Two pincers beat ten hands: a crab trades dexterity for the ability to hold one thing until the job is done. Choose the work for this session before opening your tools. Put the other projects aside and keep the file you need in front of you.',
  },
  reveal: {
    headline: 'Give the project a place in your day.',
    body: 'Bring one work objective and the question you need to study.',
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
      headline: 'Put career growth on your calendar.',
      sub: 'Your proposal needs a draft, and the manual has a chapter you keep skipping. Book time for both. Moltology puts focused work and hard learning on the daily checklist, so growth stops waiting for a quiet quarter.',
      cta: 'Create your free account',
      image: {
        src: '/images/benefits/career/hero.jpg?v=2',
        alt: 'A red lobster reading a work document at a navy desk under precise financial press portrait lighting',
        width: 1280,
        height: 960,
      },
      card: {
        label: 'Daily practice · Sample',
        value: '8 tasks done',
        change: 'Example checklist activity',
        points: [0, 1, 2, 2, 2, 3, 4, 4, 5, 5, 5, 6, 6, 7, 8, 8],
      },
    },
    compound: {
      title: 'Allocate time to the work at hand',
      intro: 'Put a project name beside the time you set aside. Then decide what belongs in that session. “Professional development” can stay in the meeting title.',
      rows: [
        { label: 'Choose the file', value: 'Project', note: 'Open the proposal, spreadsheet or design you intend to work on.' },
        { label: 'Find the difficult part', value: 'Question', note: 'Name the step you cannot yet explain or do on your own.' },
        { label: 'Study with a purpose', value: 'Lesson', note: 'Read the section that addresses that question, then try the exercise.' },
        { label: 'Ask about the draft', value: 'Feedback', note: 'Show the work and ask for a response to one specific part.' },
      ],
    },
    features: {
      title: 'Your working account',
      items: [
        { title: 'A priority before the inbox', body: 'Name what matters today and start on it. Choose the proposal section you need to write before collecting another list of ideas.' },
        { title: 'Study on the checklist', body: 'Learn something hard makes room for a subject that pushes back. Read the documentation, work through the example and write down the question that remains.' },
        { title: 'One file in focus', body: 'One thing, interruptions shut out. Agree on availability where needed, then put the phone aside for the session.' },
        { title: 'A useful second opinion', body: 'Ask the Oracle, our AI guide, to break a broad project into tasks. Standard chat includes a free daily limit; bring a concrete question about where to begin.' },
      ],
    },
    statement: {
      title: 'The full daily allocation',
      intro: 'This example includes all eight daily tasks. Learning and focused work sit beside quiet, help and a proper finish. Check off what you do, then close the laptop when the day is over.',
      rows: [
        { when: 'Before opening mail', label: 'Sit in silence', amount: '+1 task' },
        { when: 'Choose the project', label: 'Pick your one thing', amount: '+1 task' },
        { when: 'Read the hard chapter', label: 'Learn something hard', amount: '+1 task' },
        { when: 'Clear the spare tabs', label: 'Reset your focus', amount: '+1 task' },
        { when: 'Work on the draft', label: 'Do deep work', amount: '+1 task' },
        { when: 'Answer a forum post', label: 'Help a member', amount: '+1 task' },
        { when: 'Set aside a worry', label: 'Let one thing go', amount: '+1 task' },
        { when: 'End the workday', label: 'Close the day', amount: '+1 task' },
      ],
    },
  },
}

export default page
