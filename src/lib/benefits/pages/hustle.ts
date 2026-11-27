import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'hustle',
  topic: 'Hustle',
  kit: 'ledger',
  variant: 'amber-desk',
  query: 'hustle culture',
  title: 'Hustle culture. Set a closing time. | Moltology',
  description:
    'Rethink hustle culture with a work session that ends. Pick an objective, set the timer and close the day with Moltology’s free daily practice.',
  keywords: 'hustle culture, stopping work, focused sessions, work boundaries, daily routine',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/hustle/share.jpg?v=2',
    alt: 'A crab shutting a desk notebook in dark green evening business editorial photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Surface on the clock',
    href: '/codex/scr-031#verse-6',
    text: 'Set a finish time for your work block. Catch up on messages afterward.',
  },
  reveal: {
    headline: 'The laptop has a lid for a reason.',
    body: 'Leave yourself a starting point for tomorrow and log off.',
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
      sub: 'Book the work. Book the finish. Close the laptop when you get there.',
      cta: 'Start a free account',
      image: {
        src: '/images/benefits/hustle/hero-alt.jpg',
        alt: 'Bo Pebble, a sunny yellow crab in a muted teal beanie, resting both claws on a closed cognac leather notebook beside a brushed brass clock on a warm timber desk',
        width: 1280,
        height: 960,
      },
    },
    features: {
      title: 'A workday with closing hours',
      items: [
        { title: 'Choose before adding more', body: 'Write the task you intend to start, even if the rest of the list keeps making suggestions.' },
        { title: 'Work the chosen session', body: 'Shut out interruptions and stay with one thing. Keep the agreed urgent contact route open while routine messages wait.' },
        { title: 'Make room for other people', body: 'Answer someone on the forum or welcome a newcomer. Give that reply your attention, then return to the rest of your day.' },
        { title: 'Close with work left over', body: 'Review what you did and where you stopped. Close the day includes ending an unfinished day. Leave the next step beside the task and shut the file.' },
      ],
    },
    statement: {
      title: 'Closing statement',
      intro: 'Put the last line on the books before you start.',
      rows: [
        { when: 'Write the objective', label: 'Pick your one thing', amount: '+1 action' },
        { when: 'Start the set block', label: 'Do deep work', amount: '+1 action' },
        { when: 'Give someone a hand', label: 'Help a member', amount: '+1 action' },
        { when: 'Shut the file', label: 'Close the day', amount: '+1 action' },
      ],
    },
  },
}

export default page
