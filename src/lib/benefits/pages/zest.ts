import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'zest',
  topic: 'Zest',
  kit: 'can',
  variant: 'citrus-burst',
  query: 'zest for life',
  title: 'Zest for life. Go with your own taste. | Moltology',
  description:
    'Make space for zest for life: read for fun, join a conversation and wear what you like. Explore the daily practice and optional Moltology merch.',
  keywords: 'zest for life, everyday enthusiasm, personal interests, Moltology merchandise, making time for fun',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/zest/share.jpg?v=2',
    alt: 'A glossy lobster with folded clothing on a citrus yellow beverage lifestyle set',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Moltology store',
    href: '/store',
    text: 'Find Moltology artwork on clothes and everyday gear.',
  },
  reveal: {
    headline: 'Save room for what you like.',
    body: 'Pick one thing you’d do today just because you like it.',
    screenshot: 'dashboard',
  },
  related: ['spice', 'fashion', 'community'],
  disclaimer: 'If life has felt flat for weeks, or you have lost interest in things you used to enjoy, talk to a doctor.',
  faqs: [
    {
      question: 'What does having zest for life mean?',
      answer:
        'Zest for life means enthusiasm for living and taking part. It can be as ordinary as getting into a book, cooking something you like or joining a conversation. A packed calendar is not part of the definition.',
    },
    {
      question: 'How do you make room for zest for life in a busy schedule?',
      answer:
        'Put something you enjoy on the calendar alongside your obligations. Keep it small enough to fit: a chapter, a recipe or a chat with a friend. For Learn something hard, you can choose a subject simply because it interests you.',
    },
    {
      question: 'Can everyday life be interesting without a big adventure?',
      answer:
        'Yes. Familiar interests offer plenty to do: learn a song, finish a library book or ask a friend to show you their latest project. Choose something you want to take part in, even if it would make a very ordinary photograph.',
    },
    {
      question: 'Where is the Moltology clothing and merch sold?',
      answer:
        'The Moltology merch store sells physical items featuring the artwork. Check each listing for the design and product details before ordering. The character cosmetics shop is a separate place for your digital character.',
    },
    {
      question: 'Does every hobby need a goal?',
      answer:
        'No. You can read about trains without planning to build a railway. Pick a subject you like and spend time on it. The learning task asks you to tackle something difficult, but the subject does not have to belong on your CV.',
    },
    {
      question: 'Which small activities are worth making time for?',
      answer:
        'The ones you already look forward to. Take the camera out of its case, put on an album or invite someone over to cook. On the Moltology forum, answering a question about something you love counts as Help a member.',
    },
  ],
  content: {
    hero: {
      sticker: 'Full flavor. Your taste.',
      headline: 'Zest for life. Serve yourself something good.',
      sub: 'Make time for the book with no exam and the conversation that runs past the dishes.',
      cta: 'Get started free',
      image: {
        src: '/images/benefits/zest/hero.jpg?v=2',
        alt: 'A shiny lobster looking at a colorful shirt on a bright lime and orange beverage campaign set',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Personal taste encouraged', 'Read for the fun of it', 'Wear what you like', 'Make time for company', 'Keep an evening open'],
    flavors: {
      title: 'The good-stuff variety pack',
      items: [
        { name: 'Paperback Lime', note: 'Choose the chapter that interests you, even when it has nothing to do with work.', tone: 'lime' },
        { name: 'Table Talk Berry', note: 'Ask a friend about the project they keep mentioning. Stick around for the answer.', tone: 'berry' },
        { name: 'Wardrobe Orange', note: 'Look through the merch artwork. Choose by what you like wearing.', tone: 'citrus' },
        { name: 'Kitchen Radio Ice', note: 'Put on the album you own but never play. Give it a proper listen.', tone: 'ice' },
      ],
    },
    label: {
      title: 'The good stuff',
      serving: 'Add to an ordinary day',
      rows: [
        { label: 'Reading list', value: 'Pick for pleasure' },
        { label: 'Conversation', value: 'Ask and listen' },
        { label: 'Learning subject', value: 'Follow your interests' },
        { label: 'Dress code for practice', value: 'Come as you are' },
      ],
      footnote: 'Use the good notebook for the unimportant list.',
    },
    story: {
      caption: 'The good shirt is allowed out on Tuesday.',
      image: {
        src: '/images/benefits/zest/story.jpg?v=2',
        alt: 'A crab studying a printed garment at an orange table in crisp citrus colored snack advertising light',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
