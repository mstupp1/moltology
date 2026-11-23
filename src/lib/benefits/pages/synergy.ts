import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'synergy',
  topic: 'Synergy',
  kit: 'platform',
  query: 'habit stacking',
  title: 'Habit stacking, built around your day | Moltology',
  description:
    'Put habit stacking on your daily agenda. Pair small actions with things you already do, follow the daily tasks, and ask the Oracle for a second opinion.',
  keywords: 'habit stacking, daily habits, routine cues, habit stack, daily practice',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/synergy/share.jpg?v=2',
    alt: 'A glossy violet crab arranging glass blocks on a dark desk in polished software launch photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Cadence, in the Codex',
    href: '/codex/scr-030#verse-11',
    text: 'The Cadence scores the shape of a routine, not its perfection. A missed block is a missed block, and the streak counter is not a moral instrument.',
  },
  reveal: {
    headline: 'Give the next habit a place to start.',
    body: 'Choose one everyday cue for your next daily task.',
    screenshot: 'oracle',
  },
  related: ['automation', 'commitment', 'focus'],
  faqs: [
    {
      question: 'What does habit stacking mean?',
      answer:
        'Habit stacking means attaching a new action to something you already do. Use a clear cue: after putting your breakfast plate away, write the first sentence of your draft. Pick something you can start right there.',
    },
    {
      question: 'How do I start habit stacking with a busy schedule?',
      answer:
        'Choose one reliable moment and add one small action. Putting your keys down or shutting your work laptop can be the cue. Try that pairing before adding another; a full morning redesign is a large first assignment.',
    },
    {
      question: 'Which habits should I stack together?',
      answer:
        'Pair actions that share a place or a natural order. After clearing your desk, open the document you plan to work on. Avoid attaching a desk task to a cue that happens halfway through your commute.',
    },
    {
      question: 'Why does my habit stack keep falling apart?',
      answer:
        'Usually the cue is unpredictable or the chain is too long. A five-link stack asks a lot of a weekday with a dentist appointment in it. Shorten the chain, keep the first link, and try again at its next cue.',
    },
    {
      question: 'Should every daily task follow immediately after the last?',
      answer:
        'No. The tasks run from morning to evening, with your actual life between them. Attach each one to a suitable point in your day instead of trying to complete the whole routine before breakfast.',
    },
    {
      question: 'Can the Oracle help me choose a cue?',
      answer:
        'Yes. Tell the Oracle, our AI guide, what you already do and which task keeps slipping. Ask for one pairing to try. Give it the real schedule, including the school run or the late shift.',
    },
  ],
  content: {
    hero: {
      badge: 'New · Integrates with your kettle',
      headline: 'Habit stacking, with fewer moving parts.',
      sub: 'Your kettle already has a place in the morning. Give your next habit one too. Pick an everyday cue, do the small action after it, and check off the work in Moltology.',
      cta: 'Build my routine free',
      prompt: 'After breakfast I open my phone. Suggest a cue for picking my one thing instead.',
      image: {
        src: '/images/benefits/synergy/hero.jpg?v=2',
        alt: 'A glossy violet crab lining up translucent blocks beside a mug, with violet studio lighting and a dark software launch backdrop',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Small actions. Clear connections.',
      intro: 'Start with the moments already on your calendar. Give each action a place, then do it.',
      items: [
        { title: 'Use an existing cue', body: 'Pick a moment you can point to: finishing breakfast, sitting at your desk, or plugging in your phone.' },
        { title: 'Name the next action', body: 'Write the first move in plain words. Opening the draft is a clearer instruction than working on your future.' },
        { title: 'Check off what happened', body: 'Mark a daily task when you have done it. Leave the box alone when you have not.' },
        { title: 'Ask for a smaller step', body: 'Bring an overgrown routine to the Oracle. Ask which part to cut before adding another habit.' },
        { title: 'Read the reason', body: 'Open the Codex from a task and read the passage behind the instruction. Keep the useful question with you.' },
        { title: 'Make room for people', body: 'Use Help a member to answer a forum question. Someone else has a day full of moving parts too.' },
      ],
    },
    workflow: {
      title: 'Connect the parts of an ordinary day',
      intro: 'Example cues. Swap in your own. Moltology records the checkmarks; you do the connecting.',
      steps: [
        { when: 'The kettle starts', then: 'Sit quietly before checking the morning messages' },
        { when: 'Breakfast is cleared', then: 'Write down the one thing you want to work on' },
        { when: 'Your notebook opens', then: 'Try the difficult exercise you bookmarked' },
        { when: 'Lunch is finished', then: 'Clear a distraction and choose your next action' },
        { when: 'Your work block ends', then: 'Visit the forum with one useful answer' },
        { when: 'The laptop closes', then: 'Name what to let go and check off the day' },
      ],
    },
    config: {
      title: 'The daily sequence, in plain text',
      body: 'Here are all eight daily tasks. Choose a cue for each one, starting with the moment you put breakfast away.',
      filename: 'habit-stack.txt',
      lines: [
        '# Match each action to an everyday cue',
        '01: Sit in silence',
        '02: Pick your one thing',
        '03: Learn something hard',
        '04: Reset your focus',
        '05: Do deep work',
        '06: Help a member',
        '07: Let one thing go',
        '08: Close the day',
        '# Keep the next step small',
      ],
    },
    plans: {
      title: 'Start with the daily practice',
      items: [
        {
          name: 'Moltology Free',
          price: '$0 / month',
          body: 'For doing the work between the things you already do.',
          items: ['Daily task checkmarks', 'Your streak and task history', 'Readings from the Codex', 'Questions and replies in the forum', 'Oracle chat within a daily limit'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional',
          body: 'More room for long Oracle conversations.',
          items: ['A higher daily Oracle allowance', 'Access to a stronger Oracle model', 'Everything in Free'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
