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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/zest/share.jpg?v=2',
    alt: 'A glossy lobster with folded clothing on a citrus yellow beverage lifestyle set',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Moltology merch store',
    href: '/store',
    text: 'The merch store sells physical goods with Moltology artwork. Browse the designs, read the item details and pick something you would actually use. Merch is paid and optional. This is the shop for your wardrobe, not your character.',
  },
  reveal: {
    headline: 'Save some room for the things you like.',
    body: 'Bring your own interests to the daily practice, wardrobe optional.',
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
      headline: 'Zest for life comes in your flavor.',
      sub: 'The book with no exam at the end. The conversation that runs past the washing up. The shirt you pick because you like it. Bring your interests to Moltology. Do the daily practice, and browse the merch if the artwork is your thing.',
      cta: 'Make room. Join free.',
      image: {
        src: '/images/benefits/zest/hero.jpg?v=2',
        alt: 'A shiny lobster looking at a colorful shirt on a bright lime and orange beverage campaign set',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Personal taste encouraged', 'Read for the fun of it', 'Wear what you like', 'Make time for company', 'Keep an evening open'],
    flavors: {
      title: 'A mixed pack of good reasons',
      items: [
        { name: 'Paperback Lime', note: 'Choose the chapter that interests you, even when it has nothing to do with work.', tone: 'lime' },
        { name: 'Table Talk Berry', note: 'Ask a friend about the project they keep mentioning. Stick around for the answer.', tone: 'berry' },
        { name: 'Wardrobe Orange', note: 'Look through the merch artwork. Choose by what you like wearing.', tone: 'citrus' },
        { name: 'Kitchen Radio Ice', note: 'Put on the album you own but never play. Give it a proper listen.', tone: 'ice' },
      ],
    },
    label: {
      title: 'Check the good stuff',
      serving: 'Add to an ordinary day',
      rows: [
        { label: 'Reading list', value: 'Pick for pleasure' },
        { label: 'Conversation', value: 'Ask and listen' },
        { label: 'Learning subject', value: 'Follow your interests' },
        { label: 'Merch artwork', value: 'Browse the store' },
        { label: 'Shopping rule', value: 'Choose what you like' },
        { label: 'Dress code for practice', value: 'Come as you are' },
      ],
      footnote: 'Read the product listing before ordering a design. Leave room in the day for using the things already on your shelf, too.',
    },
    crash: {
      title: 'Leave a little room in the mix',
      without: ['Every book has to be useful', 'Every hobby needs a side business', 'Every choice needs an audience', 'Every evening is spoken for'],
      with: ['Read the chapter you fancy', 'Make something for the fun of it', 'Pick the design that suits you', 'Keep some time for your interests'],
    },
    story: {
      title: 'The good shirt is allowed out on Tuesday',
      body: [
        'Some things earn their place because you like them. Wear the shirt on an ordinary day. Play the record while you cook. Use the notebook with the nice cover for an entirely unimportant list.',
        'Browse the Moltology merch store with that sort of choice in mind. Look at the artwork and the item itself. Would you wear it? Would you use it? Those are enough questions for a shopping trip.',
        'Then bring an interest back to the daily practice. Learn something hard can mean studying the music you keep playing or finding out how a favorite building was made. Ask a question in the forum and read the replies. Let your curiosity pick the subject for once.',
      ],
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
