import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'resilience',
  topic: 'Resilience',
  kit: 'locker',
  variant: 'forged-amber',
  query: 'mental resilience',
  title: 'Mental resilience. Recovery belongs here | Moltology',
  description:
    'Make room for mental resilience in the training plan. Read about the soft-shell window, work through eight daily tasks, and close the day with Moltology.',
  keywords: 'mental resilience, setbacks, recovery, boundaries, daily habits',
  indexed: true,
  updated: '2026-11-27',
  disclaimer: 'Moltology is a habit practice and community, not therapy or crisis care.',
  shareImage: {
    src: '/images/benefits/resilience/share.jpg?v=2',
    alt: 'A crab seated on a locker bench in a quiet high contrast performance sportswear photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The soft-shell window',
    href: '/codex/scr-010#verse-5',
    text: 'Give an old habit’s empty slot a little time before filling it.',
  },
  reveal: {
    headline: 'Keep an easier session on the card.',
    body: 'Choose one useful rep for the day you actually have.',
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
      headline: 'Mental resilience. Recovery is in the program.',
      sub: 'Pick a session that fits today. Leave room to come back tomorrow.',
      cta: 'Start training free',
      image: {
        src: '/images/benefits/resilience/hero.jpg?v=2',
        alt: 'A lobster resting by an empty locker under soft edge lighting in a wide performance apparel campaign shot',
        width: 1600,
        height: 1000,
      },
    },
    program: {
      title: 'Train for the day you have',
      intro: 'Four reps for a day that needs a lighter load.',
      items: [
        { set: 'Easy start', title: 'Sit in silence', body: 'Take a quiet seat before the messages arrive. Look at yesterday without writing a speech about what went wrong.' },
        { set: 'Rest interval', title: 'Reset your focus', body: 'Clear one distraction and choose what to do next. If the day has changed, check the plan before carrying on.' },
        { set: 'Stay alongside', title: 'Help a member', body: 'Read someone’s forum post before offering a fix. Ask what kind of help they want and answer the question they brought.' },
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
  },
}

export default page
