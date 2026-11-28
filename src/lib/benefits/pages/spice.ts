import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'spice',
  topic: 'Spice',
  kit: 'can',
  variant: 'solar-chili',
  query: 'how to spice up your life',
  title: 'How to spice up your life: break the repeat | Moltology',
  description:
    'How to spice up your life when every day is a rerun: pick a hard question, open the sketchbook and do something beyond your usual scroll with Moltology.',
  keywords: 'how to spice up your life, bored with routine, stuck in a rut, new interests, daily learning',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/spice/share.jpg?v=2',
    alt: 'A bright red crab with a sketchbook on a hot orange snack advertising set',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Prime Directive',
    href: '/codex/scr-001#verse-5',
    text: 'Make room to grow by leaving one familiar routine behind.',
  },
  reveal: {
    headline: 'Put a little heat on the calendar.',
    body: 'Give the daily learning task a subject you’ve never tried.',
    screenshot: 'dashboard',
  },
  related: ['zest', 'intelligence', 'adaptive'],
  faqs: [
    {
      question: 'How do I spice up my life when every day repeats?',
      answer:
        'Change one thing you normally do on autopilot. Cook an unfamiliar recipe, sketch the view from your window or ask someone about their hobby. Then do the part that needs practice, not another introduction video.',
    },
    {
      question: 'How can I spice up my life without a major overhaul?',
      answer:
        'Start with something you are curious about, not a plan to replace your whole personality. Pick a question, find a good explanation and have a go. Your first drawing can stay in the notebook; it does not need a launch announcement.',
    },
    {
      question: 'Should I change my whole routine to stop being bored?',
      answer:
        'No. Keep the parts that matter, such as work commitments and meals. Change the subject of your reading, the route of an ordinary outing or what you do with a spare evening. Moltology keeps the tasks fixed while you choose what to learn.',
    },
    {
      question: 'Which hobbies suit someone who has no idea what to pick?',
      answer:
        'Hobbies with a small first step are a sensible starting point. Borrow a book, draw with a pencil you own or try a beginner lesson before ordering equipment. Choose by what you want to do, not how impressive it sounds.',
    },
    {
      question: 'Why does being a beginner feel so awkward?',
      answer:
        'Because unfamiliar activities come with questions and mistakes. Ask the basic question and make a rough first attempt. Feeling clumsy is part of learning, not a sign you picked the wrong thing.',
    },
    {
      question: 'What could I do instead of scrolling through another evening?',
      answer:
        'Choose an activity before opening the feed. Put the book on the table, lay out the drawing paper or write down the question you want to study. Once it is sitting there, it is the easy choice.',
    },
  ],
  content: {
    hero: {
      sticker: 'Now with extra curiosity',
      headline: 'Spice up your life. Retire the reruns.',
      sub: 'Open the sketchbook. Ask the beginner question. Order something unfamiliar.',
      cta: 'Get started free',
      image: {
        src: '/images/benefits/spice/hero.jpg?v=2',
        alt: 'A glossy red crab showing an open sketchbook against vivid yellow in a bold snack advertisement',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Extra bite', 'Bring your questions', 'Beginner status welcome', 'No special kit needed', 'Curiosity on the menu'],
    flavors: {
      title: 'The extra-bite range',
      items: [
        { name: 'First Bite Lime', note: 'Read the chapter you skipped because you did not understand the opening.', tone: 'lime' },
        { name: 'Wild Question Berry', note: 'Ask someone how their hobby works. Follow up on the bit you do not get.', tone: 'berry' },
        { name: 'Rough Draft Orange', note: 'Draw the mug on your desk. Leave the search for better pencils until later.', tone: 'citrus' },
        { name: 'Fresh Page Ice', note: 'Choose a question outside your usual subjects for Learn something hard.', tone: 'ice' },
      ],
    },
    label: {
      title: 'In the mix',
      serving: 'Best opened with a question',
      rows: [
        { label: 'Main ingredient', value: 'A new attempt' },
        { label: 'Learning task', value: 'Learn something hard' },
        { label: 'Prior experience', value: 'Start at the beginning' },
        { label: 'First draft', value: 'Rough is fine' },
      ],
      footnote: 'A pencil and the back of an envelope will do.',
    },
    story: {
      caption: 'Beginner is a perfectly good flavor.',
      image: {
        src: '/images/benefits/spice/story.jpg?v=2',
        alt: 'A lobster drawing at a sunny yellow table with saturated red snack campaign colors',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
