import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'fashion',
  topic: 'Fashion',
  kit: 'atelier',
  query: 'how to find your personal style',
  title: 'How to find your personal style, from the inside | Moltology',
  description:
    'Personal style starts before the closet. Moltology is a free daily practice that builds the posture, focus and calm that make any outfit look like yours.',
  keywords: 'personal style, how to find your personal style, confidence, self presentation, style tips, daily routine',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/fashion/share.jpg?v=2',
    alt: 'A lobster in a tailored charcoal coat posing in a pale studio',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Daily Shedding Routine, in the Codex',
    href: '/codex/scr-030',
    text: 'Each look below is one step of the Daily Shedding Routine, the Codex passage the eight daily tasks come from.',
  },
  reveal: {
    headline: 'The coat was borrowed. The confidence is yours to keep.',
    body: 'Moltology is a free practice of eight small tasks a day, with readings, an AI guide called the Oracle and a forum of people doing the same. Join to start your first day, or open the demo as a guest.',
    screenshot: 'dashboard',
  },
  related: ['charisma', 'spirituality', 'strength'],
  faqs: [
    {
      question: 'Is Moltology a fashion brand?',
      answer:
        'No. There are no clothes to buy here, apart from a small merch store. Moltology is a free app built around a daily practice. This page borrows the look of a fashion house to make a point about where style comes from.',
    },
    {
      question: 'How does a daily practice help my style?',
      answer:
        'Style people notice is mostly how you carry yourself: posture, eye contact, a calm pace, knowing what you want. Those come from sleep, focus and fewer anxious loops, which is what the daily tasks work on.',
    },
    {
      question: 'Will it tell me what to wear?',
      answer:
        'Not directly. You can ask the Oracle, our AI guide, for help putting outfits together, but the practice itself is about the person inside the outfit.',
    },
    {
      question: 'How much time does it take?',
      answer: 'Most of the eight tasks take a few minutes each. The deep work block is the longest, and you choose its length.',
    },
    {
      question: 'What does it cost?',
      answer:
        'Nothing to start. Tasks, readings and the forum are free. Oracle MAX is an optional paid plan if you use the AI guide heavily.',
    },
    {
      question: 'Can I look around before signing up?',
      answer: 'Yes. Try the demo to walk through the dashboard as a guest without making an account.',
    },
  ],
  content: {
    hero: {
      season: 'Collection 01 · The daily edit',
      headline: 'Personal style, cut from the inside.',
      sub: 'The best dressed person in the room is rarely the one in the newest coat. It is the one who looks settled in their own skin. Moltology is a free daily practice for exactly that.',
      cta: 'Join the collection, free',
      image: {
        src: '/images/benefits/fashion/hero.jpg?v=2',
        alt: 'A crimson lobster in an oversized charcoal coat and black turtleneck, posing in a pale grey studio',
        width: 1024,
        height: 1280,
      },
    },
    manifesto: [
      'Clothes are the last layer.',
      'Under them is posture, under that is attention, and under that is how you spent this morning.',
      'We design that part.',
    ],
    lookbook: {
      title: 'The eight looks',
      intro: 'One collection, worn every day. Each look is a small task you tick off in the app, and together they shape the person wearing the clothes.',
      items: [
        { name: 'Silence, tailored', note: 'A few quiet minutes before the phone comes out. The base layer for everything after.' },
        { name: 'The one thing', note: 'Choose the single task that would make today count, and write it down.' },
        { name: 'Hard study', note: 'Learn something that resists you. Range shows in conversation.' },
        { name: 'Midday reset', note: 'A real break: step away, breathe, come back with a clear head.' },
        { name: 'Deep work', note: 'One focused block with the noise switched off. The look of someone who finishes things.' },
        { name: 'Generosity', note: 'Help another member on the forum. Nothing reads as confident like kindness.' },
        { name: 'Let it go', note: 'Drop one grudge, worry or habit that no longer fits.' },
        { name: 'Close the day', note: 'Review, tidy, rest. Tomorrow starts here.' },
      ],
    },
    campaign: {
      quote: 'You can buy the coat in an afternoon. The way you stand in it takes practice.',
      credit: 'Look 05, Deep work, worn daily',
      image: {
        src: '/images/benefits/fashion/look.jpg?v=2',
        alt: 'The lobster walking across a sunlit plaza in a cream trench coat and dark sunglasses',
        width: 1024,
        height: 1280,
      },
    },
    care: {
      title: 'Care label',
      rows: [
        { label: 'Composition', value: '100% habit' },
        { label: 'Fit', value: 'Grows with the wearer' },
        { label: 'Wear', value: 'Daily, eight small tasks' },
        { label: 'Wash', value: 'Do not dry clean. Reset at noon.' },
        { label: 'Price', value: 'Free' },
        { label: 'Made in', value: 'Your own mornings' },
      ],
      footnote: 'Sizing is personal. Results depend on sleep, effort and showing up most days.',
    },
  },
}

export default page
