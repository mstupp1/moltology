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
    'This practice concerns emotional boundaries, not mental health treatment; seek professional support if distress interferes with daily life.',
  shareImage: {
    src: '/images/benefits/hardness/share.jpg?v=2',
    alt: 'A crab with a closed notebook at a cream table, photographed in soft telehealth campaign light',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Shell Hardness, from The Sacred Metrics',
    href: '/codex/scr-040#verse-2',
    text: 'Shell Hardness is the Codex reading about boundaries and composure. It asks you to keep your shape when a difficult message arrives. Read it with one recent conversation in mind, then write the answer you actually mean to give.',
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
        'Start with a small, polite refusal that names your limit: “I can read one page, but I cannot review the whole report.” Leave the long apology out. Use an everyday request for practice.',
    },
    {
      question: 'Does learning how to toughen up mean hiding my feelings?',
      answer:
        'No. You can feel hurt and still choose when to reply. Name the feeling privately before deciding what the conversation needs from you.',
    },
    {
      question: 'What is a good way to handle criticism at work?',
      answer:
        'Ask for a concrete example of what needs changing. Write down the correction and check it against the work. If the feedback is vague, ask a follow-up question before drafting a defence of your entire career.',
    },
    {
      question: 'How can I say no without a long explanation?',
      answer:
        'Use a short sentence that names your limit. “I cannot take that on today” is a complete answer. Offer another time only if you intend to keep it, and check your calendar before saying yes to the alternative.',
    },
    {
      question: 'Should I answer an upsetting message straight away?',
      answer:
        'Usually, you can pause unless the message needs urgent action. Read it once, put the phone down and draft your response elsewhere. Check that the reply answers the actual request before sending it.',
    },
    {
      question: 'What does the Shell character stat mean?',
      answer:
        'Shell is a stat on your character associated with boundaries and resilience. The Codex calls the idea Shell Hardness. Use the reading as a prompt for your next conversation; keep the character number in the game.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Personal assessment · no appointment',
      headline: 'Toughen up. Keep the kind part.',
      sub: 'One blunt message does not need your whole afternoon. Moltology asks you to pause, set a boundary and return to what you were doing. Start with a reading and a daily practice.',
      checks: ['Join at no charge', 'Start with one boundary', 'Read at your pace'],
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
        { name: 'The extra favour', tag: 'For a full calendar', body: 'Pick your one thing asks you to name what matters today. Check that commitment before adding somebody else’s deadline.', href: '/codex/scr-030#verse-3' },
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
        { label: 'Your answer', us: 'Say what you can offer', them: 'Apologise for having limits' },
        { label: 'The next step', us: 'Go back to your work', them: 'Watch for their reaction' },
      ],
    },
  },
}

export default page
