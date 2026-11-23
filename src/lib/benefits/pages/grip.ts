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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/grip/share.jpg?v=2',
    alt: 'A lobster holding a clipboard against dark gym lockers in a high contrast sportswear photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Pincer Torque, The Sacred Metrics verse 3',
    href: '/codex/scr-040#verse-3',
    text: 'Pincer Torque is about holding a chosen project until it is finished. Read the passage, then put Pick your one thing to work: choose the task, say what done means, and begin. The character sheet calls this stat Torque.',
  },
  reveal: {
    headline: 'One priority. Put your name to it.',
    body: 'Make today’s choice in Pick your one thing.',
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
      headline: 'Get a grip on your life.',
      sub: 'Twelve tabs. Three urgent lists. Start with one thing you can actually finish. Choose it, work on it, log the day. A new planner is optional.',
      cta: 'Make your first commitment',
      image: {
        src: '/images/benefits/grip/hero-alt.jpg',
        alt: 'Maris Slate, a cobalt-blue crab with chalked claws, hanging from a steel pull-up bar on the right side of a dark concrete gym',
        width: 1600,
        height: 1000,
      },
    },
    stats: [
      { value: '1', label: 'Priority to pick' },
      { value: '8', label: 'Tasks on the card' },
      { value: '0', label: 'Special equipment' },
      { value: '$0', label: 'Entry fee' },
    ],
    program: {
      title: 'Load one objective',
      intro: 'The eight daily tasks put a choice at the start and a review at the end. Work through the whole card. Your top priority still leaves room for a break and another person.',
      items: [
        { set: 'Settle', title: 'Sit in silence', body: 'Keep the inbox shut while you sit. Look at yesterday before today starts volunteering you for everything.' },
        { set: 'Main set', title: 'Pick your one thing', body: 'Name the task you intend to finish. Write the first action and do it before shopping for a different priority.' },
        { set: 'Skill work', title: 'Learn something hard', body: 'Study something that takes effort. Try the difficult example yourself instead of saving another explanation for later.' },
        { set: 'Regrip', title: 'Reset your focus', body: 'Clear the distraction that took over the screen. Read your chosen task again and pick the next useful move.' },
        { set: 'Working set', title: 'Do deep work', body: 'Give the chosen work its own session. Park unrelated requests on the list instead of switching jobs mid-sentence.' },
        { set: 'Spotter', title: 'Help a member', body: 'Take a forum question seriously. Answer the part you know or welcome someone who is finding their way around.' },
        { set: 'Release', title: 'Let one thing go', body: 'Drop one demand from the day that you are finished carrying. Leave the abandoned project out of tonight’s mental rehearsal.' },
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
    creed: 'Pick the work before picking another notebook.',
  },
}

export default page
