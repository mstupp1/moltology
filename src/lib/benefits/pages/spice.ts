import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'spice',
  topic: 'Spice',
  kit: 'can',
  query: 'how to spice up your life',
  title: 'How to spice up your life: break the repeat | Moltology',
  description:
    'How to spice up your life when every day is a rerun: pick a hard question, open the sketchbook and do something beyond your usual scroll with Moltology.',
  keywords: 'how to spice up your life, bored with routine, stuck in a rut, new interests, daily learning',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/spice/share.jpg?v=2',
    alt: 'A bright red crab with a sketchbook on a hot orange snack advertising set',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Prime Directive in the Codex',
    href: '/codex/scr-001#verse-5',
    text: 'The Prime Directive says, “Nothing grows inside the shell that grew it”. The fifth verse is honest about the awkward part: to get larger, you first have to be briefly uncovered. Read it, then name a routine you keep because you already know how it goes.',
  },
  reveal: {
    headline: 'Your next subject is allowed to surprise you.',
    body: 'Use Learn something hard for the subject you keep putting off.',
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
      sub: 'Same feed. Same saved videos. That sketchbook still in its wrapper. Pick something difficult and have a go. Open the book, ask the beginner question and put a little unfamiliar on the menu.',
      cta: 'Join the daily practice',
      image: {
        src: '/images/benefits/spice/hero.jpg?v=2',
        alt: 'A glossy red crab showing an open sketchbook against vivid yellow in a bold snack advertisement',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Extra bite', 'Bring your questions', 'Beginner status welcome', 'No special kit needed', 'Curiosity on the menu'],
    flavors: {
      title: 'Go off your usual order',
      items: [
        { name: 'First Bite Lime', note: 'Read the chapter you skipped because you did not understand the opening.', tone: 'lime' },
        { name: 'Wild Question Berry', note: 'Ask someone how their hobby works. Follow up on the bit you do not get.', tone: 'berry' },
        { name: 'Rough Draft Orange', note: 'Draw the mug on your desk. Leave the search for better pencils until later.', tone: 'citrus' },
        { name: 'Fresh Page Ice', note: 'Choose a question outside your usual subjects for Learn something hard.', tone: 'ice' },
      ],
    },
    label: {
      title: 'What is in the mix',
      serving: 'Best opened with a question',
      rows: [
        { label: 'Main ingredient', value: 'A new attempt' },
        { label: 'Learning task', value: 'Learn something hard' },
        { label: 'Topic selection', value: 'Your call' },
        { label: 'Prior experience', value: 'Start at the beginning' },
        { label: 'Equipment upgrade', value: 'Use what you own' },
        { label: 'First draft', value: 'Rough is fine' },
      ],
      footnote: 'Pick one thing to attempt before collecting supplies. A pencil and the back of an envelope count as drawing equipment.',
    },
    crash: {
      title: 'Change what is on repeat',
      without: ['The same clips in a new order', 'Another tutorial saved for later', 'A hobby shopping basket', 'Waiting until you know enough'],
      with: ['Choose a subject off the feed', 'Follow the lesson with an attempt', 'Try the supplies in the drawer', 'Ask the first question now'],
    },
    story: {
      title: 'Beginner is a perfectly good flavor',
      body: [
        'The sketchbook has been waiting politely. Break the seal and draw the nearest thing. A lopsided mug is a fine place to start. Keep the page, turn it over and try another angle.',
        'Bring that approach to Learn something hard. Pick a topic with a question attached: how bread rises, how a camera works, why the moon changes shape. Read past the easy opening. Write down what you still cannot explain.',
        'The Prime Directive asks you to leave a familiar fit when it is time to grow. For an ordinary evening, try the ordinary version: stop replaying the tutorial you know by heart. Open the lesson where you need to pause and ask for help.',
      ],
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
