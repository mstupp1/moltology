import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'commitment',
  topic: 'Commitment',
  kit: 'seminar',
  variant: 'cobalt-summit',
  query: 'how to stick to goals',
  title: 'How to stick to goals: choose the next action | Moltology',
  description:
    'Working out how to stick to goals? Choose one objective, name the next action, and protect a place for it in your day with Moltology’s daily practice.',
  keywords: 'how to stick to goals, commitment, one objective, daily goal practice',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/commitment/share.jpg?v=2',
    alt: 'A dark blue crab at a seminar lectern beside a single closed folder, dramatic book-tour photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Hold one objective',
    href: '/codex/scr-031#verse-5',
    text: 'Choose one result for the session and write it where you can see it.',
  },
  reveal: {
    headline: 'Open to the page you left off.',
    body: 'Name one thing worth finishing today.',
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
      kicker: 'Notes on follow-through',
      headline: 'Stick to goals past page one.',
      sub: 'Pick what done looks like. Give it a slot before the day fills up.',
      cta: 'Start the practice free',
      image: {
        src: '/images/benefits/commitment/hero-alt.jpg',
        alt: 'Cora Pearl, a pearl-white lobster wearing a gold crown, standing beside a cobalt-paneled architectural podium in a daylight seminar studio',
        width: 1024,
        height: 1280,
      },
      book: { title: 'Stay with it', subtitle: 'One objective for the session in front of you', author: 'Moltology · the daily practice' },
    },
    chapters: {
      title: 'From intention to appointment',
      items: [
        { title: 'Choose it again', body: 'Read the goal you wrote down. Say why it still matters before giving it a place in today’s work.' },
        { title: 'Make the action small enough', body: 'Replace work on the proposal with draft the opening paragraph. Pick something you can begin with the tools already available.' },
        { title: 'Protect the session', body: 'Turn off interruptions that can wait. Keep a way for people who genuinely need you to reach you.' },
        { title: 'Record the attempt', body: 'Mark what you completed honestly. If the task was too large, write a smaller next action before you close the file.' },
      ],
    },
    passage: {
      quote: 'Juggling two tasks behind a closed door is just surface work in a quieter room.',
      source: { label: 'The Isolation Protocols, verse 5', href: '/codex/scr-031#verse-5' },
    },
  },
}

export default page
