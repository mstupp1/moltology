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
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/fashion/share.jpg?v=2',
    alt: 'A lobster in a tailored charcoal coat posing in a pale studio',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The character shop',
    href: '/character/shop',
    text: 'Try pieces on your character and find a cut that suits you.',
  },
  reveal: {
    headline: 'Make it yours.',
    body: 'Pick a look and give it one good habit to wear.',
    screenshot: 'dashboard',
  },
  related: ['charisma', 'spirituality', 'strength'],
  faqs: [
    {
      question: 'Is Moltology a fashion brand?',
      answer:
        'No. There are no clothes to buy here, apart from a small merch store. Moltology is a free app built around a daily practice. The point here is where style comes from.',
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
      question: 'How do I find my personal style?',
      answer:
        'Start with what you already reach for, notice what makes you stand differently, and keep a short list of pieces that work together. Style settles once you stop dressing for an imagined audience.',
    },
    {
      question: 'Does confidence change how clothes look?',
      answer:
        'Posture, pace and eye contact change how any outfit reads. Those come from habits more than purchases, which is the part a daily practice works on.',
    },
  ],
  content: {
    hero: {
      season: 'Collection 01 · The daily edit',
      headline: 'Personal style, cut from the inside.',
      sub: 'Dress your character. Practice carrying yourself with a little more care.',
      cta: 'Join free',
      image: {
        src: '/images/benefits/fashion/hero.jpg?v=2',
        alt: 'A crimson lobster in an oversized charcoal coat and black turtleneck, posing in a pale grey studio',
        width: 1024,
        height: 1280,
      },
    },
    lookbook: {
      title: 'The daily collection',
      intro: 'Four looks from the daily practice, cut for repeat wear.',
      items: [
        { name: 'Silence, tailored', note: 'A few quiet minutes before the phone comes out. The base layer for everything after.' },
        { name: 'The one thing', note: 'Choose the single task that would make today count, and write it down.' },
        { name: 'Deep work', note: 'One focused block with the noise switched off. The look of someone who finishes things.' },
        { name: 'Generosity', note: 'Help another member on the forum. Nothing reads as confident like kindness.' },
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
  },
}

export default page
