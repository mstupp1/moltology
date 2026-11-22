import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'fitness',
  topic: 'Fitness',
  kit: 'locker',
  query: 'mental fitness',
  title: 'Mental fitness. Bring a training log | Moltology',
  description:
    'Mental fitness, on the daily training card. Read the five character stats, work through eight tasks, and log what you did with Moltology.',
  keywords: 'mental fitness, character stats, daily training, focus practice',
  indexed: false,
  updated: '2026-11-22',
  disclaimer: 'Moltology is a daily practice, not mental health treatment or a test of intelligence.',
  shareImage: {
    src: '/images/benefits/fitness/share.jpg?v=2',
    alt: 'A crab checking a training clipboard in a stark black and volt sportswear studio shot',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Sacred Metrics in the Codex',
    href: '/codex/scr-040',
    text: 'Read The Sacred Metrics on boundaries, follow-through and focus. Then check the five stats on your character sheet: Shell, Torque, Synapse, Ecdysis and Depth. Take the Moltmax quiz for your base scores and use the daily tasks as your training card.',
  },
  reveal: {
    headline: 'Bring the logbook back to the work.',
    body: 'Read your character sheet, then choose today’s task.',
    screenshot: 'dashboard',
  },
  related: ['strength', 'grip', 'gaming'],
  faqs: [
    {
      question: 'What is mental fitness?',
      answer:
        'Mental fitness is a broad term for practicing skills such as attention, learning and handling everyday demands. Start with an activity you can name and repeat. In Moltology, that means eight daily tasks, including difficult learning and a block of focused work.',
    },
    {
      question: 'Which mental fitness activities can I practice each day?',
      answer:
        'Reading something difficult, choosing a priority and reviewing your day are practical places to start. Pick an actual action for each: work through a chapter, draft a reply, or write down what remains unfinished. The daily task card covers all three.',
    },
    {
      question: 'How many stats does the character have?',
      answer:
        'Five: Shell, Torque, Synapse, Ecdysis and Depth. They cover boundaries, follow-through, starting, shedding old habits and steadiness under pressure. The Moltmax quiz supplies your base scores; before you take it, the character has provisional starting values.',
    },
    {
      question: 'Does equipment affect character stats?',
      answer:
        'Yes. Gear changes your character’s appearance and adds stat bonuses. It does not award XP or change stage or rank. Check the equipped items when comparing sheets, just as you would check the load written beside a set in a training log.',
    },
    {
      question: 'Is mental fitness the same as mental health?',
      answer:
        'No. Mental health is your overall psychological wellbeing, and it gets professional care when you need it. Mental fitness usually means everyday skills you can train, like attention and handling pressure. If you are struggling, talk to a professional first.',
    },
    {
      question: 'How often should I train mental fitness?',
      answer:
        'Little and often. Short sessions on most days are easier to keep up than one long session a week. Log what you did so you can see the pattern, and take rest days when you need them.',
    },
  ],
  content: {
    hero: {
      tag: 'Training log included',
      headline: 'Mental fitness, on a daily training card.',
      sub: 'Read the stats. Pick the work. Log the session. Moltology puts eight daily tasks beside a character sheet with five stats. Bring the same attention to the task as you bring to the numbers.',
      cta: 'Join and open your task card',
      image: {
        src: '/images/benefits/fitness/hero.jpg?v=2',
        alt: 'A lobster with a plain stat card by a locker under hard directional sportswear campaign lighting',
        width: 1600,
        height: 1000,
      },
    },
    stats: [
      { value: '5', label: 'Stats on your sheet' },
      { value: '8', label: 'Daily training tasks' },
      { value: '15', label: 'Questions in the quiz' },
      { value: '$0', label: 'To start' },
    ],
    program: {
      title: 'Full session. No skipped lines.',
      intro: 'Everyone gets the same eight daily tasks. Read the whole card before loading your day with extra goals. There is quiet at the start, work in the middle, and a place to stop.',
      items: [
        { set: 'Warm-up', title: 'Sit in silence', body: 'Sit before opening a feed. Look back at yesterday while the morning is still yours to start.' },
        { set: 'Target', title: 'Pick your one thing', body: 'Choose today’s most important task and begin it. Put an action on the card, not an ambition for the whole year.' },
        { set: 'Skill set', title: 'Learn something hard', body: 'Work through material you cannot skim. Try the exercise in the book before checking how someone else did it.' },
        { set: 'Interval', title: 'Reset your focus', body: 'Remove one distraction from the session. Decide what needs your attention next before returning to the screen.' },
        { set: 'Main block', title: 'Do deep work', body: 'Keep one piece of work open. Set the other demands aside and work through the difficult bit you came here for.' },
        { set: 'Team session', title: 'Help a member', body: 'Answer someone’s forum question or welcome a newcomer. Give them the useful explanation you would have wanted when starting.' },
        { set: 'Deload', title: 'Let one thing go', body: 'Name something you are setting down from today. Stop carrying the argument after you have left the conversation.' },
        { set: 'Record', title: 'Close the day', body: 'Check the tasks you finished and stop. Write the day as it happened instead of adding imaginary extra credit.' },
      ],
    },
    gear: {
      title: 'Know your numbers',
      intro: 'Five stats, with a different job for each. Read the names before comparing the figures.',
      items: ['Shell: boundaries. Torque: following through on one task.', 'Synapse: starting. Ecdysis: dropping habits you have outgrown.', 'Depth: staying steady under pressure. Gear adds to the sheet.'],
      image: {
        src: '/images/benefits/fitness/tape.jpg?v=2',
        alt: 'A crab beside a notebook and unused athletic tape on a bench in a vertical performance gear photograph',
        width: 1024,
        height: 1280,
      },
    },
    creed: 'Read the numbers. Do the session.',
  },
}

export default page
