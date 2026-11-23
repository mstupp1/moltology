import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'resilience',
  topic: 'Resilience',
  kit: 'locker',
  query: 'mental resilience',
  title: 'Mental resilience. Recovery belongs here | Moltology',
  description:
    'Make room for mental resilience in the training plan. Read about the soft-shell window, work through eight daily tasks, and close the day with Moltology.',
  keywords: 'mental resilience, setbacks, recovery, boundaries, daily habits',
  indexed: false,
  updated: '2026-11-22',
  disclaimer: 'Moltology is a habit practice and community, not therapy or crisis care.',
  shareImage: {
    src: '/images/benefits/resilience/share.jpg?v=2',
    alt: 'A crab seated on a locker bench in a quiet high contrast performance sportswear photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The soft-shell window, Codex verse 5',
    href: '/codex/scr-010#verse-5',
    text: 'The Codex makes room for the exposed stretch after you leave an old habit behind. Read the soft-shell window passage. Name the thing you have dropped and leave its old place empty for now. You do not have to fill it before bedtime.',
  },
  reveal: {
    headline: 'Keep a place for the quieter session.',
    body: 'Close today without adding a punishment set for tomorrow.',
    screenshot: 'dashboard',
  },
  related: ['strength', 'emotional', 'empathy'],
  faqs: [
    {
      question: 'What does mental resilience mean?',
      answer:
        'Mental resilience means adapting when life brings difficulty or change. It can include asking for help, changing a plan and allowing time to rest. Start with the demand in front of you instead of asking yourself to handle every possible setback.',
    },
    {
      question: 'Can mental resilience include taking a break?',
      answer:
        'Yes. Taking a break can be a deliberate choice about your workload. Say what you are stopping and when you intend to review it. You can keep a commitment and still leave room in the day to eat, rest or talk to someone.',
    },
    {
      question: 'Why can dropping an old habit feel strange?',
      answer:
        'A familiar routine can leave an unfamiliar gap when you stop doing it. Notice when you reach for the old pattern, such as checking the group chat you muted. The Codex calls this the soft-shell window: you are between armors, and the pull of the old shell is normal.',
    },
    {
      question: 'How do I review a day that went badly?',
      answer:
        'Start with what happened: the tasks you attempted, what interrupted them and what still needs attention. Keep blame out of the task list. Once it is written down, stop for the night.',
    },
    {
      question: 'Does asking for help mean I am giving up?',
      answer:
        'No. Asking for help is a way to say what you need. Try a direct request: “Can you listen while I talk this through?” or “Can you help with this part?” Let the other person know whether you want company, advice or practical help.',
    },
    {
      question: 'What is the difference between a boundary and shutting people out?',
      answer:
        'A boundary names a limit; shutting people out can close every route to you. Be clear about what you can offer and how people can reach you when it matters. You can mute a busy chat and still arrange to call a friend.',
    },
  ],
  content: {
    hero: {
      tag: 'Recovery is in the program',
      headline: 'Mental resilience. Recover, repeat.',
      sub: 'Some days call for a lighter brief. Pick the work that fits today, ask for help, and stop when the day is done. Moltology’s eight daily tasks include quiet, a reset and an ending.',
      cta: 'Join at your own pace',
      image: {
        src: '/images/benefits/resilience/hero.jpg?v=2',
        alt: 'A lobster resting by an empty locker under soft edge lighting in a wide performance apparel campaign shot',
        width: 1600,
        height: 1000,
      },
    },
    stats: [
      { value: '8', label: 'Tasks in the routine' },
      { value: '1', label: 'Day to review' },
      { value: '0', label: 'Equipment required' },
      { value: '$0', label: 'Joining cost' },
    ],
    program: {
      title: 'Train with room to recover',
      intro: 'Use the eight daily tasks as written. A rough day does not call for a secret ninth task or a tougher version of tomorrow. Work with the responsibilities you actually have.',
      items: [
        { set: 'Easy start', title: 'Sit in silence', body: 'Take a quiet seat before the messages arrive. Look at yesterday without writing a speech about what went wrong.' },
        { set: 'Today’s load', title: 'Pick your one thing', body: 'Choose the task that matters under today’s circumstances. Start with the reply you owe, not a complete life overhaul.' },
        { set: 'Practice set', title: 'Learn something hard', body: 'Try something you do not understand yet. Leave room to be a beginner and ask the question you were about to skip.' },
        { set: 'Rest interval', title: 'Reset your focus', body: 'Clear one distraction and choose what to do next. If the day has changed, check the plan before carrying on.' },
        { set: 'Working load', title: 'Do deep work', body: 'Give one piece of work a session of its own. Put the other requests aside while you work on that piece.' },
        { set: 'Stay alongside', title: 'Help a member', body: 'Read someone’s forum post before offering a fix. Ask what kind of help they want and answer the question they brought.' },
        { set: 'Leave behind', title: 'Let one thing go', body: 'Name what you are done carrying from today. Leave the space it occupied open instead of immediately taking something else on.' },
        { set: 'Recovery', title: 'Close the day', body: 'Check what you completed and stop for the evening. The unfinished line can wait for the next decision about it.' },
      ],
    },
    gear: {
      title: 'Pack for the day you have',
      intro: 'A lighter session still needs a clear ask. Keep the kit simple.',
      items: ['A task you can attempt with today’s time and tools', 'A clear request when you need someone’s help', 'A place to leave the work when the evening starts'],
      image: {
        src: '/images/benefits/resilience/tape.jpg?v=2',
        alt: 'A crab setting athletic tape beside a folded towel in a vertical locker room recovery photograph',
        width: 1024,
        height: 1280,
      },
    },
    creed: 'There is room on the bench for a quiet day.',
  },
}

export default page
