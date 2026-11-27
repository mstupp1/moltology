import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'technique',
  topic: 'Technique',
  kit: 'arcade',
  variant: 'esports-light',
  query: 'pomodoro technique',
  title: 'Pomodoro technique: ready up for one round | Moltology',
  description:
    'Run the pomodoro technique with one target and a timer. Moltology pairs a pre-round setup with Focus rounds, an Oracle skill for 25-minute work sessions.',
  keywords: 'pomodoro technique, focus rounds, work intervals, pomodoro breaks, single task work',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/technique/share.jpg?v=2',
    alt: 'A purple lobster beside a round timer in a dark training room, cinematic esports key art',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Seal before the descent',
    href: '/codex/scr-031#verse-3',
    text: 'Close spare tabs and put the phone away before the timer starts.',
  },
  reveal: {
    headline: 'The draft is waiting.',
    body: 'Members can use the Oracle’s free Focus rounds skill for a target and a check-in.',
    screenshot: 'dashboard',
  },
  related: ['focus', 'gamification', 'gaming'],
  faqs: [
    {
      question: 'What is the pomodoro technique?',
      answer:
        'The pomodoro technique is a method of working in timed intervals with planned breaks. The usual pattern is 25 minutes on one task, followed by a five-minute break. After four work intervals, take a longer break of 15 to 30 minutes.',
    },
    {
      question: 'How do you use the pomodoro technique for studying?',
      answer:
        'Choose one small study target, set a 25-minute timer and work on that target until it rings. Try answering practice questions or recalling a chapter from memory. Take the break before choosing the next target.',
    },
    {
      question: 'Should a Pomodoro break include checking my phone?',
      answer:
        'Ideally not. Focus rounds sends you away from the screen for the five minutes: stand up, get water or look outside. If you need to check messages, pick the break for it before the round begins.',
    },
    {
      question: 'Must every work interval last exactly 25 minutes?',
      answer:
        'No. Twenty-five minutes is the standard Pomodoro interval, but you can adapt a timed work session to the task and the time available. The Oracle accepts a different round length when you ask; keep a clear stopping point and a planned break.',
    },
    {
      question: 'What happens when an interruption stops a focus round?',
      answer:
        'Restart when you can work again, after handling anything urgent. Note what pulled you away and change the setup if possible. Focus rounds treats the interruption as information for the next attempt.',
    },
    {
      question: 'Does the Oracle run a Pomodoro timer for me?',
      answer:
        'Run your own timer and return when it rings. The free Focus rounds skill for members helps you choose a target, track rounds, and take breaks.',
    },
  ],
  content: {
    hero: {
      tag: 'Focus rounds · Ready check',
      headline: 'Pomodoro technique. Ready for round one?',
      sub: 'Pick a task, put the phone away, and start a 25-minute timer.',
      cta: 'Join for Focus rounds',
      image: {
        src: '/images/benefits/technique/hero.jpg?v=2',
        alt: 'A purple lobster at a training console with a round desk timer on the right, dark violet game launch key art',
        width: 1600,
        height: 1000,
      },
    },
    quests: {
      title: 'Choose a quest for the timer',
      intro: 'Use an interval where a job can hold your full attention.',
      items: [
        { title: 'Pick your one thing', body: 'Choose the main job before dividing it into work intervals.', reward: 'Daily XP' },
        { title: 'Learn something hard', body: 'Try the difficult exercise with your notes closed first.', reward: 'Daily XP' },
        { title: 'Reset your focus', body: 'Clear the distraction left over from your morning session.', reward: 'Daily XP' },
        { title: 'Do deep work', body: 'Set one target, start your timer and return after the round.', reward: 'Daily XP' },
      ],
    },
    modes: {
      title: 'Your round briefing',
      items: [
        { name: 'Set the objective', body: 'Tell the Oracle what you are working on and how much time you have. Ask for a target that fits one round, such as drafting the introduction.' },
        { name: 'Run the interval', body: 'Start a timer on your own device. Work on the agreed target, then return to the Oracle when the timer rings.' },
        { name: 'Take the break', body: 'Report what you did in one line. Take five minutes away from the screen, and take a longer break after four rounds.' },
        { name: 'Queue the next target', body: 'Ask for the next small piece of work. If the previous target was too large, cut it down before starting another timer.' },
      ],
      image: {
        src: '/images/benefits/technique/setup.jpg?v=2',
        alt: 'A purple lobster studying an open notebook beside a desk timer and monitor, lit like an esports practice room',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
