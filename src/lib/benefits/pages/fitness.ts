import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'fitness',
  topic: 'Fitness',
  kit: 'locker',
  variant: 'chalk-gym',
  query: 'mental fitness',
  title: 'Mental fitness. Bring a training log | Moltology',
  description:
    'Mental fitness, on the daily training card. Read the five character stats, work through eight tasks, and log what you did with Moltology.',
  keywords: 'mental fitness, character stats, daily training, focus practice',
  indexed: true,
  updated: '2026-11-27',
  disclaimer: 'Moltology is a daily practice, not mental health treatment or a test of intelligence.',
  shareImage: {
    src: '/images/benefits/fitness/share.jpg?v=2',
    alt: 'A crab checking a training clipboard in a stark black and volt sportswear studio shot',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Sacred Metrics',
    href: '/codex/scr-040',
    text: 'Read what the five character stats represent and pick a task to practice.',
  },
  reveal: {
    headline: 'Get your reps in.',
    body: 'Pick one daily task and log the work.',
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
      headline: 'Mental fitness. Daily reps.',
      sub: 'Log your reps on the daily checklist. Check your five character stats.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/fitness/hero.jpg?v=2',
        alt: 'A lobster with a plain stat card by a locker under hard directional sportswear campaign lighting',
        width: 1600,
        height: 1000,
      },
    },
    program: {
      title: 'The training card',
      intro: 'Four reps from the daily program. Do the work before logging it.',
      items: [
        { set: 'Warm-up', title: 'Sit in silence', body: 'Sit before opening a feed. Look back at yesterday while the morning is still yours to start.' },
        { set: 'Skill set', title: 'Learn something hard', body: 'Work through material you cannot skim. Try the exercise in the book before checking how someone else did it.' },
        { set: 'Main block', title: 'Do deep work', body: 'Keep one piece of work open. Set the other demands aside and work through the difficult bit you came here for.' },
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
  },
}

export default page
