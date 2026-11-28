import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'hardness',
  topic: 'Hardness',
  kit: 'clinic',
  variant: 'graphite-protocol',
  query: 'how to toughen up',
  title: 'How to toughen up and keep your kindness | Moltology',
  description:
    'Wondering how to toughen up? Start with a boundary, a short reading and a daily checklist. Practice saying what you mean before typing another apology.',
  keywords: 'how to toughen up, thick skin, emotional toughness, setting boundaries, handling criticism',
  indexed: true,
  updated: '2026-11-27',
  disclaimer:
    'Moltology is a free practice and community, not mental health care. If distress is getting in the way of daily life, talk to a professional.',
  shareImage: {
    src: '/images/benefits/hardness/share.jpg?v=2',
    alt: 'A crab with a closed notebook at a cream table, photographed in soft telehealth campaign light',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Shell Hardness',
    href: '/codex/scr-040#verse-2',
    text: 'Hold your shape when the conversation puts pressure on you.',
  },
  reveal: {
    headline: 'Kindness can have office hours.',
    body: 'Practice one clear boundary today.',
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
      eyebrow: 'Boundary check-in',
      headline: 'Toughen up. Stay kind.',
      sub: 'Take the useful part of a blunt message. Give the rest of your afternoon back to yourself.',
      cta: 'Start free',
      image: {
        src: '/images/benefits/hardness/hero.jpg?v=2',
        alt: 'A crab holding a notebook in a pale consultation room, with soft portrait lighting and clean clinic styling',
        width: 1024,
        height: 1280,
      },
    },
    steps: {
      title: 'The reply protocol',
      items: [
        { title: 'Read before replying', body: 'Open the boundary reading. Think of the last message that got under your skin and write down what it asked for.' },
        { title: 'Choose your limit', body: 'Decide what you have time to offer. A clear answer might be one sentence, a later date or a polite refusal.' },
        { title: 'Put the phone down', body: 'Send the answer when it is ready. Then use Pick your one thing to choose the work you are returning to.' },
      ],
    },
    plans: {
      title: 'Ways to draw a line',
      intro: 'Pick the reading that fits the conversation.',
      items: [
        { name: 'The sharp remark', tag: 'For criticism', body: 'Read about Shell Hardness. Separate the correction you can use from the tone you do not need to copy.', href: '/codex/scr-040#verse-2' },
        { name: 'The extra favor', tag: 'For a full calendar', body: 'Name what matters today in Pick your one thing. Check it before you accept somebody else’s deadline.', href: '/codex/scr-030#verse-3' },
        { name: 'The reply never sent', tag: 'For evening replays', body: 'Use Let one thing go to name a conversation you are done rehearsing. Stop editing the imaginary follow-up.', href: '/codex/scr-032' },
      ],
    },
  },
}

export default page
