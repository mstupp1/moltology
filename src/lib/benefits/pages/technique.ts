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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/technique/share.jpg?v=2',
    alt: 'A purple lobster beside a round timer in a dark training room, cinematic esports key art',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Seal before the descent, from the Codex',
    href: '/codex/scr-031#verse-3',
    text: 'Seal the room before you start, not halfway through the round. Put the phone away and shut the spare tabs while you are still setting up, then press start.',
  },
  reveal: {
    headline: 'Ready up. The draft is waiting.',
    body: 'Name the next paragraph before starting your first focus round.',
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
        'No, you run your own timer and return to the Oracle, our AI guide, when it rings. Focus rounds is a free skill that asks for your target, counts the rounds and prompts breaks. Oracle chat has a daily limit, with optional Oracle MAX for higher limits.',
    },
  ],
  content: {
    hero: {
      tag: 'Focus rounds · Ready check',
      headline: 'Run the pomodoro technique one round at a time.',
      sub: 'The report has enough tabs already. Pick one part, put the phone away and start a 25-minute timer. Ask the Oracle for Focus rounds when you want a target and a check-in between rounds.',
      cta: 'Join for focus rounds',
      image: {
        src: '/images/benefits/technique/hero.jpg?v=2',
        alt: 'A purple lobster at a training console with a round desk timer on the right, dark violet game launch key art',
        width: 1600,
        height: 1000,
      },
    },
    stats: {
      title: 'Check your pre-round setup',
      intro: 'Sample build. Run these five checks before the clock starts.',
      items: [
        { code: 'SHL', label: 'Shell', body: 'Decide which notifications can wait until the break.', value: 58 },
        { code: 'TRQ', label: 'Torque', body: 'Choose one part of the report to work on this round.', value: 77 },
        { code: 'SYN', label: 'Synapse', body: 'Write the first step beside the timer and begin there.', value: 69 },
        { code: 'ECD', label: 'Ecdysis', body: 'Change the setup that interrupted your previous attempt.', value: 61 },
        { code: 'DEP', label: 'Depth', body: 'Keep the selected document open until the work interval ends.', value: 84 },
      ],
    },
    quests: {
      title: 'Rounds fit inside the daily practice',
      intro: 'The eight daily tasks cover the whole day. Timed rounds belong in Do deep work; keep the rest of the board in view too.',
      items: [
        { title: 'Sit in silence', body: 'Sit quietly before opening the messages waiting for you.', reward: 'Daily XP' },
        { title: 'Pick your one thing', body: 'Choose the main job before dividing it into work intervals.', reward: 'Daily XP' },
        { title: 'Learn something hard', body: 'Try the difficult exercise with your notes closed first.', reward: 'Daily XP' },
        { title: 'Reset your focus', body: 'Clear the distraction left over from your morning session.', reward: 'Daily XP' },
        { title: 'Do deep work', body: 'Set one target, start your timer and return after the round.', reward: 'Daily XP' },
        { title: 'Help a member', body: 'Read a forum question and offer a useful answer.', reward: 'Daily XP' },
        { title: 'Let one thing go', body: 'Name one frustration from the session and let it go.', reward: 'Daily XP' },
        { title: 'Close the day', body: 'Review what you did and put the work away.', reward: 'Daily XP' },
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
    patch: {
      title: 'Session settings',
      version: 'Focus rounds · Default loadout',
      items: [
        'Work interval: 25 minutes on the chosen target.',
        'Short break: five minutes away from the screen.',
        'Long break: 15 to 30 minutes after four rounds.',
        'Round report: tell the Oracle what you worked on.',
        'Before starting: clear distractions and keep urgent contacts reachable.',
      ],
    },
  },
}

export default page
