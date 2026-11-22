import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'hardness',
  topic: 'Hardness',
  kit: 'clinic',
  query: 'how to toughen up',
  title: 'How to toughen up and keep your kindness | Moltology',
  description:
    'Wondering how to toughen up? Start with a boundary, a short reading and a daily checklist. Practice saying what you mean before typing another apology.',
  keywords: 'how to toughen up, thick skin, emotional toughness, setting boundaries, handling criticism',
  indexed: false,
  updated: '2026-11-22',
  disclaimer:
    'Moltology is a free practice and community, not mental health care. If distress is getting in the way of daily life, talk to a professional.',
  shareImage: {
    src: '/images/benefits/hardness/share.jpg?v=2',
    alt: 'A crab with a closed notebook at a cream table, photographed in soft telehealth campaign light',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Shell Hardness, from The Sacred Metrics',
    href: '/codex/scr-040#verse-2',
    text: 'Shell Hardness is the Codex reading about boundaries and composure. Its point is simple: a strong shell still feels everything, it just keeps its shape. Read it with one recent conversation in mind, then write the answer you mean to give.',
  },
  reveal: {
    headline: 'Kindness can come with office hours.',
    body: 'Put a boundary into words, then return to your daily checklist.',
    screenshot: 'dashboard',
  },
  related: ['resilience', 'emotional', 'communication'],
  faqs: [
    {
      question: 'How can I toughen up without being rude?',
      answer:
        'Use a small, polite refusal that names your limit: “I can read one page, but I cannot review the whole report.” Leave the long apology out. Use an everyday request for practice.',
    },
    {
      question: 'Does learning how to toughen up mean hiding my feelings?',
      answer:
        'No. You can feel hurt and still choose when to reply. Name the feeling privately before deciding what the conversation needs from you.',
    },
    {
      question: 'What is a good way to handle criticism at work?',
      answer:
        'Ask for a concrete example of what needs changing. Write down the correction and check it against the work. If the feedback is vague, ask a follow-up question before drafting a defense of your entire career.',
    },
    {
      question: 'How can I say no without a long explanation?',
      answer:
        'Use a short sentence that names your limit. “I cannot take that on today” is a complete answer. Offer another time only if you intend to keep it, and check your calendar before saying yes to the alternative.',
    },
    {
      question: 'Should I answer an upsetting message straight away?',
      answer:
        'Usually not. Unless it needs urgent action, read it once, put the phone down and draft your reply somewhere else. Before you send it, check that it answers what was asked.',
    },
    {
      question: 'What makes a conversation replay in your head?',
      answer:
        'Usually because part of it still feels unfinished. Write down what was said and whether anything needs doing about it. If there is an action, put it on tomorrow’s list; if there is none, the replay has no job left. Then switch to something that uses your hands, like cooking or a walk.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Personal assessment · no appointment',
      headline: 'Toughen up. Keep the kind part.',
      sub: 'One blunt message does not need your whole afternoon. Pause, say what you can offer and get back to what you were doing. Your plan starts with a short reading and eight daily tasks.',
      checks: ['Free, no card', 'Start with one boundary', 'Read at your pace'],
      cta: 'Start your boundary plan',
      image: {
        src: '/images/benefits/hardness/hero.jpg?v=2',
        alt: 'A crab holding a notebook in a pale consultation room, with soft portrait lighting and clean clinic styling',
        width: 1024,
        height: 1280,
      },
    },
    trust: ['No appointment needed', 'Readings included', 'Daily check-ins', 'Your own pace'],
    signs: {
      title: 'Still thinking about that comment?',
      intro: 'Start with the moment you keep replaying. Pick a situation small enough to practice with today.',
      items: [
        'You type “sorry” before checking what the request is',
        'A short reply gets a very long explanation',
        'You say yes while your calendar says otherwise',
        'An old conversation comes back during dinner',
        'You ask three friends whether your answer was all right',
      ],
    },
    steps: {
      title: 'Your next reply, in three steps',
      items: [
        { title: 'Read before replying', body: 'Open the boundary reading. Think of the last message that got under your skin and write down what it asked for.' },
        { title: 'Choose your limit', body: 'Decide what you have time to offer. A clear answer might be one sentence, a later date or a polite refusal.' },
        { title: 'Put the phone down', body: 'Send the answer when it is ready. Then use Pick your one thing to choose the work you are returning to.' },
      ],
    },
    plans: {
      title: 'Start where you keep saying yes',
      intro: 'These readings belong to the same practice. Choose the one that fits the conversation in front of you.',
      items: [
        { name: 'The sharp remark', tag: 'For criticism', body: 'Read about Shell Hardness. Separate the correction you can use from the tone you do not need to copy.', href: '/codex/scr-040#verse-2' },
        { name: 'The extra favor', tag: 'For a full calendar', body: 'Name what matters today in Pick your one thing. Check it before you accept somebody else’s deadline.', href: '/codex/scr-030#verse-3' },
        { name: 'The reply never sent', tag: 'For evening replays', body: 'Use Let one thing go to name a conversation you are done rehearsing. Stop editing the imaginary follow-up.', href: '/codex/scr-032' },
      ],
    },
    compare: {
      title: 'Before you press send',
      us: 'A clear boundary',
      them: 'An automatic yes',
      rows: [
        { label: 'The request', us: 'Check what is being asked', them: 'Assume you must handle it' },
        { label: 'Your calendar', us: 'Look before committing', them: 'Find room somehow' },
        { label: 'Your answer', us: 'Say what you can offer', them: 'Apologize for having limits' },
        { label: 'The next step', us: 'Go back to your work', them: 'Watch for their reaction' },
      ],
    },
  },
}

export default page
