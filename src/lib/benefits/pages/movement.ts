import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'movement',
  topic: 'Movement',
  kit: 'locker',
  query: 'keep moving forward',
  title: 'Keep moving forward when the day stalls | Moltology',
  description:
    'How to keep moving forward when a day stalls: pick the next action, open the file and start. Eight daily tasks, from first light to close, with no workouts.',
  keywords: 'keep moving forward, how to get unstuck, getting started, procrastination, next action',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/movement/share.jpg?v=2',
    alt: 'A lobster reaching for a notebook beside black gym lockers in a crisp sports editorial shot',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Hesitation is where the day leaks, from the Codex',
    href: '/codex/scr-012#verse-5',
    text: 'The passage looks at the gap between knowing what needs doing and starting. Read it, pick a task you have already decided on, and take the first step. As the verse says, a frantic person and a decisive one look nothing alike.',
  },
  reveal: {
    headline: 'The starting line is the open file.',
    body: 'Begin the work you have already picked.',
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
      sub: 'The reply is drafted. The send button is right there. Take the next step before opening another tab about getting started. Eight daily tasks take you from a quiet start to clocking off.',
      cta: 'Start the daily routine',
      image: {
        src: '/images/benefits/movement/hero.jpg?v=2',
        alt: 'A crab crossing a dark locker room toward an open notebook in a wide black and volt sports campaign photograph',
        width: 1600,
        height: 1000,
      },
    },
    stats: [
      { value: '8', label: 'Actions each day' },
      { value: '1', label: 'Next step to choose' },
      { value: '0', label: 'Training gear needed' },
      { value: '$0', label: 'To get started' },
    ],
    program: {
      title: 'Off pause. Into the session.',
      intro: 'Take the eight daily tasks in order. Choose the work, start the work, and make a clean stop. Resist adding a preparation routine for your preparation routine.',
      items: [
        { set: 'First move', title: 'Sit in silence', body: 'Start the morning seated, with the feed still closed. Look back at yesterday before reaching for the phone.' },
        { set: 'Pick', title: 'Pick your one thing', body: 'Choose what matters today and start on it. Open the actual draft instead of moving its reminder to a nicer list.' },
        { set: 'Try', title: 'Learn something hard', body: 'Go to the lesson you keep saving for later. Read the first difficult section and try working through its example.' },
        { set: 'Resume', title: 'Reset your focus', body: 'Close the tab that pulled you away. Find your place in the work and choose the next action.' },
        { set: 'Go', title: 'Do deep work', body: 'Set aside interruptions for one task. Write the paragraph, check the figures, or work through the problem you chose.' },
        { set: 'Reply', title: 'Help a member', body: 'Send a useful answer on the forum. A clear welcome also counts as showing up for someone new.' },
        { set: 'Set down', title: 'Let one thing go', body: 'Name one thing from the day to leave behind. Stop reopening a settled decision just to see if it still bothers you.' },
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
    creed: 'Start before the next tab opens.',
  },
}

export default page
