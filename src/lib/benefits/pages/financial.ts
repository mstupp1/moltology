import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'financial',
  topic: 'Financial',
  kit: 'ledger',
  query: 'financial discipline',
  title: 'Financial discipline. Read the terms. | Moltology',
  description:
    'Practice financial discipline with a pause before checkout. Read the currency rules, pick a priority and put your attention into the daily tasks.',
  keywords: 'financial discipline, spending habits, earned currency, daily priorities, purchase decisions',
  indexed: false,
  updated: '2026-11-22',
  disclaimer: 'Moltology is a daily practice, not financial advice.',
  shareImage: {
    src: '/images/benefits/financial/share.jpg?v=2',
    alt: 'A lobster with a closed shopping notebook against a deep green backdrop in polished fintech editorial lighting',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Two Currencies, in the Codex',
    href: '/codex/scr-041#verse-2',
    text: 'Start with The Two Currencies and read the rules that follow. Chitin Gems come from work; Molt Credits are purchased. The reading asks you to spend each for its purpose and keep purchases separate from progress. Check what an item actually does before you buy it.',
  },
  reveal: {
    headline: 'Put the basket down. Pick a task.',
    body: 'Give today a priority before adding another optional extra.',
    screenshot: 'dashboard',
  },
  related: ['investing', 'generational', 'career'],
  faqs: [
    {
      question: 'What does financial discipline mean?',
      answer:
        'Financial discipline means spending and saving by a plan you made in advance, not by the mood you are in at checkout. A simple first habit: write down why you want an optional purchase before you pay for it.',
    },
    {
      question: 'Where can I start with financial discipline?',
      answer:
        'Start with one repeated choice, such as browsing shops whenever a work task gets difficult. Name the moment, then choose what to do when it happens again. Try closing the shop tab and opening the document you meant to work on.',
    },
    {
      question: 'How do I tell a need from an impulse purchase?',
      answer:
        'Ask what job the purchase has to do. Write that job down before reading the product description, then check whether you already have something for it. Leave the decision open if the answer is still unclear.',
    },
    {
      question: 'Why do I shop when I am avoiding a task?',
      answer:
        'Shopping can be another thing to do when the original task feels difficult or dull. Look at what was open just before the shop tab. Reset your focus asks you to clear one distraction and choose the next useful action.',
    },
    {
      question: 'What is the 24-hour rule for spending?',
      answer:
        'It is a pause: wait a day before buying anything you did not plan to buy. If you still want it tomorrow and it fits your budget, buy it then. Some people use a week, or 30 days, for bigger items.',
    },
    {
      question: 'What helps with impulse buying online?',
      answer:
        'Make buying slower. Unsubscribe from sale emails, remove saved card details from shops you browse when bored and close the basket instead of leaving it open in a tab.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Clear terms · Free to join',
      headline: 'Financial discipline. Check the terms before checkout.',
      sub: 'Another tab. Another tempting upgrade. Before you click buy, name what you came to do, then go and do it. Moltology gives that urge eight better places to go.',
      cta: 'Start a free account',
      image: {
        src: '/images/benefits/financial/hero.jpg?v=2',
        alt: 'A purple lobster inspecting two desk trays in a crisp wealth magazine studio photograph',
        width: 1280,
        height: 960,
      },
      card: {
        label: 'Sample task balance',
        value: '8 completed',
        change: 'Example day · Checklist below',
        points: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8],
      },
    },
    compound: {
      title: 'Check the purpose of the purchase',
      intro: 'Keep the decision small and clear. Before another optional extra goes in the basket, give these four questions a straight answer.',
      rows: [
        { label: 'What is it for?', value: 'Purpose', note: 'Name the job you need done, away from the product description.' },
        { label: 'What does it change?', value: 'Details', note: 'Read the item details, including what happens after payment.' },
        { label: 'What have I already got?', value: 'Check', note: 'Look through the tools you own before browsing another collection.' },
        { label: 'Does it belong here?', value: 'Decide', note: 'Keep it, remove it or leave the basket for another time.' },
      ],
    },
    features: {
      title: 'Know what goes into your account',
      items: [
        { title: 'Work on the record', body: 'Tick off an action after doing it. The daily tasks ask for quiet, a priority, learning, focus, useful work, help, letting go and a finish.' },
        { title: 'Optional extras, clearly named', body: 'Oracle MAX, Molt Credits and the merch store are paid options. Read what each offers and choose the one you actually want, if any.' },
        { title: 'A question before the basket', body: 'Ask the Oracle, our AI guide, to help break down the task you are avoiding. Standard chat has a free daily limit.' },
        { title: 'Learning before equipment', body: 'Open the material you already bookmarked. Learn something hard means studying a difficult thing, even when the stationery drawer is fully stocked.' },
      ],
    },
    statement: {
      title: 'Your daily task statement',
      intro: 'All eight daily tasks, shown here as a completed example. Start with the action in front of you. Mark it after doing the work; leave the next entry for its turn.',
      rows: [
        { when: 'Before browsing', label: 'Sit in silence', amount: '+1 task' },
        { when: 'Set a priority', label: 'Pick your one thing', amount: '+1 task' },
        { when: 'Open the lesson', label: 'Learn something hard', amount: '+1 task' },
        { when: 'Close a stray tab', label: 'Reset your focus', amount: '+1 task' },
        { when: 'Stay on the task', label: 'Do deep work', amount: '+1 task' },
        { when: 'Write a reply', label: 'Help a member', amount: '+1 task' },
        { when: 'Set it aside', label: 'Let one thing go', amount: '+1 task' },
        { when: 'Finish the review', label: 'Close the day', amount: '+1 task' },
      ],
    },
  },
}

export default page
