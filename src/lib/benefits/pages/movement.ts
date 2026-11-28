import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'movement',
  topic: 'Movement',
  kit: 'locker',
  variant: 'gold-sprint',
  query: 'keep moving forward',
  title: 'Keep moving forward when the day stalls | Moltology',
  description:
    'How to keep moving forward when a day stalls: pick the next action, open the file and start. Eight daily tasks, from first light to close, with no workouts.',
  keywords: 'keep moving forward, how to get unstuck, getting started, procrastination, next action',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/movement/share.jpg?v=2',
    alt: 'A lobster reaching for a notebook beside black gym lockers in a crisp sports editorial shot',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Art of the Grip',
    href: '/codex/scr-012#verse-5',
    text: 'Use the next minute to begin the work you’ve already picked.',
  },
  reveal: {
    headline: 'The open file is the starting line.',
    body: 'Pick one action small enough to do before the next tab opens.',
    screenshot: 'dashboard',
  },
  related: ['grip', 'focus', 'technique'],
  faqs: [
    {
      question: 'Does keeping moving forward mean working out?',
      answer:
        'No. Here it means getting unstuck and moving through the day’s tasks. None of the eight daily tasks is exercise, and there are no workouts on the card. Start with the work you keep postponing, such as the reply still sitting in drafts.',
    },
    {
      question: 'How do I keep moving forward on a stalled project?',
      answer:
        'Choose the next action you can do with the tools in front of you. Open the draft and write a rough first sentence, or read the instructions you need. Leave the project’s entire future out of this first step.',
    },
    {
      question: 'Why do I keep making plans instead of starting?',
      answer:
        'Planning may still be answering a real question, or it may be the thing you do instead of the work. Ask what decision is missing. If you already know the next step, do that before rearranging the calendar again.',
    },
    {
      question: 'Can I start working while motivation is low?',
      answer:
        'Yes. Pick an action you can attempt as you are, such as opening the document and writing its title. You do not have to settle your mood before every ordinary task. Keep the first step clear and the workload reasonable.',
    },
    {
      question: 'How can I restart work after an interruption?',
      answer:
        'Find the point where you stopped and name the next action. Read the last line you wrote or the instruction you were following. Next time, leave yourself a one-line note before you stop.',
    },
    {
      question: 'Should I keep working until the whole project is finished?',
      answer:
        'No. Give the current session a stopping point and leave a note about what comes next. Large projects can remain open across several sessions. A note on where to pick up is enough to let you stop.',
    },
  ],
  content: {
    hero: {
      tag: 'Less setup. More starts.',
      headline: 'Keep moving forward.',
      sub: 'The file is already open. Take the next step before one more tab.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/movement/hero.jpg?v=2',
        alt: 'A crab crossing a dark locker room toward an open notebook in a wide black and volt sports campaign photograph',
        width: 1600,
        height: 1000,
      },
    },
    program: {
      title: 'The starting sequence',
      intro: 'Work the first move before planning the next three.',
      items: [
        { set: 'Pick', title: 'Pick your one thing', body: 'Choose what matters today and start on it. Open the actual draft instead of moving its reminder to a nicer list.' },
        { set: 'Try', title: 'Learn something hard', body: 'Go to the lesson you keep saving for later. Read the first difficult section and try working through its example.' },
        { set: 'Go', title: 'Do deep work', body: 'Set aside interruptions for one task. Write the paragraph, check the figures, or work through the problem you chose.' },
        { set: 'Finish', title: 'Close the day', body: 'Mark completed tasks and end the session. Leave a note for unfinished work instead of starting another round tonight.' },
      ],
    },
    gear: {
      title: 'Ready is close enough',
      intro: 'Set out what the first action needs. You can sort the rest of the desk later.',
      items: ['The draft you have already named', 'The book or tool needed for its next step', 'A place to write where you stopped'],
      image: {
        src: '/images/benefits/movement/tape.jpg?v=2',
        alt: 'A lobster lifting a claw from athletic tape on a bench in a tightly framed vertical sports equipment photograph',
        width: 1024,
        height: 1280,
      },
    },
  },
}

export default page
