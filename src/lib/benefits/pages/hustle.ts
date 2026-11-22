import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'hustle',
  topic: 'Hustle',
  kit: 'ledger',
  query: 'hustle culture',
  title: 'Hustle culture. Set a closing time. | Moltology',
  description:
    'Rethink hustle culture with a work session that ends. Pick an objective, set the timer and close the day with Moltology’s free daily practice.',
  keywords: 'hustle culture, stopping work, focused sessions, work boundaries, daily routine',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/hustle/share.jpg?v=2',
    alt: 'A crab shutting a desk notebook in dark green evening business editorial photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Surface on the clock, in the Codex',
    href: '/codex/scr-031#verse-6',
    text: 'Surface on the clock asks you to end a focused session by the timer, then handle the messages you held in one batch. Set the finish before starting. When it arrives, return to the people and responsibilities waiting outside the work.',
  },
  reveal: {
    headline: 'The laptop has a lid for a reason.',
    body: 'Set an endpoint for the work and close the day when it comes.',
    screenshot: 'dashboard',
  },
  related: ['career', 'freedom', 'resilience'],
  faqs: [
    {
      question: 'Why is hustle culture so focused on long hours?',
      answer:
        'Hustle culture treats constant work and availability as signs of ambition. That leaves the actual task easy to overlook. Name what you intend to work on and when the session ends before opening the laptop.',
    },
    {
      question: 'Can I reject hustle culture and still be ambitious?',
      answer:
        'Yes. Keep the goal and decide how much work belongs in this session. Choose the next piece of it, agree on realistic responsibilities and set a stopping point. Ambition and a closing time get along fine.',
    },
    {
      question: 'How do I stop checking work email at night?',
      answer:
        'Check what availability your role really requires. Agree on an urgent contact route where needed, then choose when to read routine mail. At the end of work, close the inbox and put the device away.',
    },
    {
      question: 'What should I do when a focus timer ends?',
      answer:
        'Stop the session and note where you left off. Handle the messages you held together, then decide what needs your attention next. Surface on the clock gives that return its own place in the practice.',
    },
    {
      question: 'Is a shutdown routine the same as finishing every task?',
      answer:
        'No. A shutdown routine is a way to end work with unfinished tasks accounted for. Review the list, leave a next step for anything still open and put it away. Close the day asks you to stop either way.',
    },
    {
      question: 'Who should be able to reach me during focused work?',
      answer:
        'Tell anyone whose urgent needs depend on reaching you. Agree on a way through for those needs and keep it available during focused work. Choose a boundary that fits your actual responsibilities.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Focused effort · Clear closing time',
      headline: 'Hustle culture has enough overtime.',
      sub: 'The late-night email can stay a draft. Pick the work, give it your attention and set a time to stop. Moltology’s daily practice includes the part where you put the laptop away.',
      cta: 'Join the daily practice free',
      image: {
        src: '/images/benefits/hustle/hero.jpg?v=2',
        alt: 'A copper lobster with a closed laptop and desk clock in a restrained executive magazine portrait',
        width: 1280,
        height: 960,
      },
      card: {
        label: 'Sample day · Account closed',
        value: '8 entries',
        change: 'Closing included · See tasks below',
        points: [0, 1, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8, 8],
      },
    },
    compound: {
      title: 'Budget the session, including its end',
      intro: 'Decide what this block of work is for. Give it a beginning, an objective and a finish. Leave the evening off the invoice.',
      rows: [
        { label: 'Name the work', value: 'Scope', note: 'Choose the part of the project you intend to work on now.' },
        { label: 'Set the finish', value: 'Timer', note: 'Pick an endpoint while you are still planning the session.' },
        { label: 'Keep urgent needs reachable', value: 'Access', note: 'Agree on who can interrupt and how they should reach you.' },
        { label: 'Return and reply', value: 'Close', note: 'End the block, then read and answer the messages you held.' },
      ],
    },
    features: {
      title: 'A daily practice with closing hours',
      items: [
        { title: 'Choose before adding more', body: 'Write the task you intend to start, even if the rest of the list keeps making suggestions.' },
        { title: 'Work the chosen session', body: 'Shut out interruptions and stay with one thing. Keep the agreed urgent contact route open while routine messages wait.' },
        { title: 'Make room for other people', body: 'Answer someone on the forum or welcome a newcomer. Give that reply your attention, then return to the rest of your day.' },
        { title: 'Close with work left over', body: 'Review what you did and where you stopped. Close the day includes ending an unfinished day. Leave the next step beside the task and shut the file.' },
      ],
    },
    statement: {
      title: 'A complete statement, with a final entry',
      intro: 'Here are the eight daily tasks in a sample day. Quiet, study, work and help all have a place. The closing entry belongs on the list before you start checking anything off.',
      rows: [
        { when: 'Let the inbox wait', label: 'Sit in silence', amount: '+1 action' },
        { when: 'Write the objective', label: 'Pick your one thing', amount: '+1 action' },
        { when: 'Study a difficult step', label: 'Learn something hard', amount: '+1 action' },
        { when: 'Pause the feed', label: 'Reset your focus', amount: '+1 action' },
        { when: 'Start the set block', label: 'Do deep work', amount: '+1 action' },
        { when: 'Give someone a hand', label: 'Help a member', amount: '+1 action' },
        { when: 'Set down the loose end', label: 'Let one thing go', amount: '+1 action' },
        { when: 'Shut the file', label: 'Close the day', amount: '+1 action' },
      ],
    },
  },
}

export default page
