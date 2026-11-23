import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'energy',
  topic: 'Energy',
  kit: 'can',
  query: 'how to have more energy',
  title: 'How to have more energy after hours | Moltology',
  description:
    'Looking up how to have more energy? Put the midnight inbox down. Close the day, shut the laptop and leave room for sleep.',
  keywords: 'how to have more energy, evening routine, bedtime habits, work shutdown, sleep routine',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/energy/share.jpg?v=2',
    alt: 'A glossy lobster beside a bedside light on a bold blue energy drink campaign set',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Carapace Close in the Codex',
    href: '/codex/scr-030#verse-9',
    text: 'Carapace Close is the passage behind Close the day. Its instruction is short: log the day, then stop, whether or not it went well. Read it before you open that work document again.',
  },
  reveal: {
    headline: 'Bedtime has right of way.',
    body: 'Check off Close the day, then leave the laptop shut.',
    screenshot: 'dashboard',
  },
  related: ['energy-drinks', 'focus', 'freedom'],
  disclaimer: 'Constant tiredness can have medical causes; talk to a healthcare professional if it persists or worries you.',
  faqs: [
    {
      question: 'How can I have more energy when my evenings disappear into work?',
      answer:
        'Start by giving work a clear stopping point. Write down the next step for unfinished jobs, save your files and put the laptop away. In Moltology, that last step is a task called Close the day.',
    },
    {
      question: 'Does having more energy mean packing more into each day?',
      answer:
        'No. A full calendar and enough room for sleep are different things. Look at what keeps bedtime sliding, from an unfinished email to another episode, and choose what to stop doing tonight.',
    },
    {
      question: 'What goes into a simple bedtime routine?',
      answer:
        'A simple routine leaves time for quiet activities before bed. Put work away, set your phone aside and read a book or take a bath. Keep the sequence easy to repeat instead of making bedtime a second project.',
    },
    {
      question: 'Can a shutdown routine fit around night shifts?',
      answer:
        'Yes. Use the end of your working period, even when that falls in the morning. The Daily Shedding Routine allows for night work: follow the order of the tasks around your own schedule.',
    },
    {
      question: 'Should I keep working until every task is checked off?',
      answer:
        'No. Mark what you did and leave the rest unchecked. The eight daily tasks are Sit in silence, Pick your one thing, Learn something hard, Reset your focus, Do deep work, Help a member, Let one thing go, and Close the day.',
    },
    {
      question: 'Which steps belong on a work shutdown checklist?',
      answer:
        'Three actions: save the work, write its next step and close the tools you used. Keep the note somewhere you already look when you start work. In Moltology, finish by checking the actions you actually completed.',
    },
  ],
  content: {
    hero: {
      sticker: 'Midnight is off the clock',
      headline: 'More energy starts with a closing time.',
      sub: 'The inbox has no bedtime. You do. Tick off what you did, close the day and stop. The unfinished draft keeps until morning, and sleep gets its slot back.',
      cta: 'Start my routine free',
      image: {
        src: '/images/benefits/energy/hero.jpg?v=2',
        alt: 'A shiny lobster switching off a desk lamp against cobalt blue in punchy beverage advertising light',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Zero caffeine added', 'Evenings included', 'Leave the inbox closed', 'Join for free', 'Laptop lid down'],
    flavors: {
      title: 'Meet the late shift lineup',
      items: [
        { name: 'Sign-off Lime', note: 'Write the next step for your unfinished job, then save and close it.', tone: 'lime' },
        { name: 'After Hours Berry', note: 'Tell the group chat you are heading off. Put the phone out of reach.', tone: 'berry' },
        { name: 'Loose End Citrus', note: 'Do Let one thing go before you start another argument in your head.', tone: 'citrus' },
        { name: 'Pillow Ice', note: 'Check off Close the day. Leave the evening clear of another work session.', tone: 'ice' },
      ],
    },
    label: {
      title: 'Evening facts',
      serving: 'Suggested use: when work is done',
      rows: [
        { label: 'Caffeine supplied', value: '0 mg' },
        { label: 'Sugar supplied', value: '0 g' },
        { label: 'Final task', value: 'Close the day' },
        { label: 'Saved draft', value: 'Keep for work hours' },
        { label: 'Phone', value: 'Set aside' },
        { label: 'Perfect day required', value: 'Never' },
      ],
      footnote: 'Check the day once. The checklist can stay closed while you read a book, wash up or get ready for bed.',
    },
    crash: {
      title: 'Give the last email a curfew',
      without: ['One more inbox refresh', 'A laptop on the pillow', 'An unfinished task on repeat', 'Work squeezed in before sleep'],
      with: ['Close the mail window', 'Leave the laptop at the desk', 'Write down the next step', 'Stop at your chosen time'],
    },
    story: {
      title: 'The inbox can sleep outside',
      body: [
        'That email marked unread can stay marked unread. Unless you are on call, choose when work ends and keep the laptop out of bed. There is always another message. It does not need a place beside your pillow.',
        'Close the day comes at the end of the daily routine. Review what you did, tick those actions and stop checking. A rough afternoon still gets a closing time. Put the unfinished proposal in its folder, with a note about where to pick it up.',
        'Keep the rest simple. Wash the mug, put the phone down, read a few pages. Skip the elaborate evening system with its own spreadsheet. The last task asks you to finish the day, including the part where you keep planning it.',
      ],
      image: {
        src: '/images/benefits/energy/story.jpg?v=2',
        alt: 'A crab placing a closed laptop on a shelf under sharp blue and orange snack campaign lighting',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
