import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'commitment',
  topic: 'Commitment',
  kit: 'seminar',
  query: 'how to stick to goals',
  title: 'How to stick to goals: choose the next action | Moltology',
  description:
    'Working out how to stick to goals? Choose one objective, name the next action, and protect a place for it in your day with Moltology’s daily practice.',
  keywords: 'how to stick to goals, commitment, one objective, daily goal practice',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/commitment/share.jpg?v=2',
    alt: 'A dark blue crab at a seminar lectern beside a single closed folder, dramatic book-tour photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Hold one objective, from the Isolation Protocols',
    href: '/codex/scr-031#verse-5',
    text: 'One clear objective per work session, and only one. Write the task before you begin, put the competing work aside, and keep that session for the objective you chose.',
  },
  reveal: {
    headline: 'Bring the task you keep moving to tomorrow.',
    body: 'Pick your one thing: name it, then start.',
    screenshot: 'forum',
  },
  related: ['focus', 'self-help-books', 'truth'],
  faqs: [
    {
      question: 'How do I stick to goals when motivation fades?',
      answer:
        'Choose the next action before waiting for motivation. Put that action in your schedule and prepare what you need to begin. In Moltology, Pick your one thing is the daily task for naming a priority and starting it.',
    },
    {
      question: 'What is a practical way to learn how to stick to goals?',
      answer:
        'Break a goal into actions you can do, then choose one for your next work session. Write down what counts as finishing that session. Review what you did before making a bigger plan.',
    },
    {
      question: 'Should I work on more than one goal?',
      answer:
        'You can have several goals, but assign one objective to each work session. Keep the other projects on a separate list. Reading their names every few minutes is still switching tasks.',
    },
    {
      question: 'When should I change a goal?',
      answer:
        'Change it when your circumstances, priorities, or reasons have changed. Write down what is different and choose whether to revise, pause, or stop. Keeping a commitment includes being honest about what you are committing to.',
    },
    {
      question: 'After missing a planned session, what comes next?',
      answer:
        'Choose the next workable session and name its first action. Check whether the missed plan asked for time or resources you did not have. Adjust the plan before adding a punishment to it.',
    },
    {
      question: 'Does commitment mean finishing everything I start?',
      answer:
        'No. It means taking a chosen responsibility seriously, including deciding openly when to stop. Tell anyone relying on you when a shared commitment changes. Quietly abandoning a promise is different from agreeing to end it.',
    },
  ],
  content: {
    hero: {
      kicker: 'Your next session starts with a decision',
      headline: 'How to stick to goals when the new-notebook feeling wears off.',
      sub: 'The notebook is lovely. Put one task in it. Choose what matters today, shut out the avoidable interruptions, and do the work you named before adding another objective.',
      cta: 'Start your daily practice',
      image: {
        src: '/images/benefits/commitment/hero.jpg?v=2',
        alt: 'A dark blue crab on a navy stage holding one folder beside a gold reading lamp, focused seminar portrait',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Stay with it', subtitle: 'One objective for the session in front of you', author: 'Moltology · the daily practice' },
    },
    promise: {
      title: 'What to bring to the work',
      items: [
        'A goal you still choose for yourself',
        'One action written before the session begins',
        'The document or tools that action needs',
        'A plan for interruptions that can wait',
        'Permission to stop at the end you set',
      ],
    },
    chapters: {
      title: 'The part after setting the goal',
      items: [
        { title: 'Choose it again', body: 'Read the goal you wrote down. Say why it still matters before giving it a place in today’s work.' },
        { title: 'Make the action small enough', body: 'Replace work on the proposal with draft the opening paragraph. Pick something you can begin with the tools already available.' },
        { title: 'Prepare the start', body: 'Open the file and find the place to continue. Leave the redesign of your entire workspace for its own appointment.' },
        { title: 'Put the other goals aside', body: 'Keep a separate list for ideas that arrive during the session. Write them there and return to the task you selected.' },
        { title: 'Protect the session', body: 'Turn off interruptions that can wait. Keep a way for people who genuinely need you to reach you.' },
        { title: 'Do the named work', body: 'Stay with the action in front of you. Reading about someone else’s routine belongs outside this work session.' },
        { title: 'Record the attempt', body: 'Mark what you completed honestly. If the task was too large, write a smaller next action before you close the file.' },
        { title: 'Set the work down', body: 'Finish at the stopping point you chose. A commitment to a project leaves room for the rest of your life.' },
      ],
    },
    passage: {
      quote: 'Juggling two tasks behind a closed door is just surface work in a quieter room.',
      source: { label: 'The Isolation Protocols, verse 5', href: '/codex/scr-031#verse-5' },
    },
    agenda: {
      title: 'One appointment with your objective',
      intro: 'Give the session a beginning and an end. Keep this plan beside the work, where you can read it without opening another app.',
      items: [
        { time: 'The choice', title: 'Name what you intend to work on' },
        { time: 'The setup', title: 'Gather what this action actually requires' },
        { time: 'The boundary', title: 'Decide which interruptions must get through' },
        { time: 'The session', title: 'Do deep work on the objective you named' },
        { time: 'The review', title: 'Write the stopping point and next action' },
        { time: 'The finish', title: 'Close the day with an honest task record' },
      ],
    },
  },
}

export default page
