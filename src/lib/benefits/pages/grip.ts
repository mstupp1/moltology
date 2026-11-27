import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'grip',
  topic: 'Grip',
  kit: 'locker',
  variant: 'cobalt-iron',
  query: 'how to get a grip on your life',
  title: 'How to get a grip on your life: pick one thing | Moltology',
  description:
    'How to get a grip on your life starts on the training card: choose one task, start it, and review the work with the eight daily tasks in Moltology.',
  keywords: 'how to get a grip on your life, priorities, follow-through, choosing one task',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/grip/share.jpg?v=2',
    alt: 'A lobster holding a clipboard against dark gym lockers in a high contrast sportswear photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Pincer Torque',
    href: '/codex/scr-040#verse-3',
    text: 'Choose what done means and hold on until you get there.',
  },
  reveal: {
    headline: 'Put one thing on the card.',
    body: 'Name today’s priority before the rest of the list gets a vote.',
    screenshot: 'dashboard',
  },
  related: ['commitment', 'focus', 'strength'],
  faqs: [
    {
      question: 'How do you get a grip on your life when everything needs doing?',
      answer:
        'Start by sorting what needs action now from what can wait. Choose one next step, such as sending the overdue reply, and write down where it ends. Keep the remaining obligations on a separate list while you work.',
    },
    {
      question: 'What is the first step to get a grip on your life?',
      answer:
        'Pick one part of today that you can act on. Pick a task you have the time and tools to attempt. In Moltology, Pick your one thing asks you to name that task and start it.',
    },
    {
      question: 'Can I have several goals and still choose one priority?',
      answer:
        'Yes. A daily priority is a choice about what to work on first. Keep your longer list, then pull out one task for the session in front of you. You can care about several projects without opening them all at once.',
    },
    {
      question: 'What does Pincer Torque mean?',
      answer:
        'Pincer Torque is the Codex term for follow-through on a chosen project. Torque appears on your character sheet. Think of the unfinished application you keep reopening: the practice is to choose the work and stay with it to a clear finish.',
    },
    {
      question: 'How small should my next task be?',
      answer:
        'Small enough that you can say what to do and when to stop. “Draft the opening paragraph” names an action; “sort my future out” needs more work before it belongs on a daily list. Use the larger goal to choose the smaller task.',
    },
    {
      question: 'Does this involve hand grip exercises?',
      answer:
        'No. Grip here means sticking with chosen work. The daily tasks are reading, choosing, focusing, helping and reviewing. Bring a piece of work you keep putting off; you can leave the hand gripper in the drawer.',
    },
  ],
  content: {
    hero: {
      tag: 'Single-task training',
      headline: 'Get a grip on your life. Pick one thing.',
      sub: 'Choose a job you can finish and give it the first slot on the card.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/grip/hero-alt.jpg',
        alt: 'Maris Slate, a cobalt-blue crab with chalked claws, hanging from a steel pull-up bar on the right side of a dark concrete gym',
        width: 1600,
        height: 1000,
      },
    },
    program: {
      title: 'One objective on the card',
      intro: 'Pick the work that gets the first rep.',
      items: [
        { set: 'Main set', title: 'Pick your one thing', body: 'Name the task you intend to finish. Write the first action and do it before shopping for a different priority.' },
        { set: 'Regrip', title: 'Reset your focus', body: 'Clear the distraction that took over the screen. Read your chosen task again and pick the next useful move.' },
        { set: 'Working set', title: 'Do deep work', body: 'Give the chosen work its own session. Park unrelated requests on the list instead of switching jobs mid-sentence.' },
        { set: 'Logbook', title: 'Close the day', body: 'Mark the work you completed. Be straight about what is still open, then finish for the evening.' },
      ],
    },
    gear: {
      title: 'Leave the spare plans at home',
      intro: 'You can start with the tools already on the desk. Give the session a job.',
      items: ['One task with an obvious finish', 'The file, book or tool that task needs', 'Somewhere to park requests until you stop'],
      image: {
        src: '/images/benefits/grip/tape.jpg?v=2',
        alt: 'A lobster beside a coiled roll of claw tape in a tight vertical locker room equipment shot',
        width: 1024,
        height: 1280,
      },
    },
  },
}

export default page
