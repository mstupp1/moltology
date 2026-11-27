import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'energy',
  topic: 'Energy',
  kit: 'can',
  variant: 'cobalt-shift',
  query: 'how to have more energy',
  title: 'How to have more energy after hours | Moltology',
  description:
    'Looking up how to have more energy? Put the midnight inbox down. Close the day, shut the laptop and leave room for sleep.',
  keywords: 'how to have more energy, evening routine, bedtime habits, work shutdown, sleep routine',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/energy/share.jpg?v=2',
    alt: 'A glossy lobster beside a bedside light on a bold blue energy drink campaign set',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Carapace Close',
    href: '/codex/scr-030#verse-9',
    text: 'Close your work on purpose and leave tomorrow’s first move written down.',
  },
  reveal: {
    headline: 'Call it a day.',
    body: 'Put an end to the workday, even if the draft stays open.',
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
      headline: 'More energy. Earlier closing time.',
      sub: 'Give the last email a curfew. Moltology puts a closing task on your daily list.',
      cta: 'Get started free',
      image: {
        src: '/images/benefits/energy/hero.jpg?v=2',
        alt: 'A shiny lobster switching off a desk lamp against cobalt blue in punchy beverage advertising light',
        width: 1024,
        height: 1280,
      },
    },
    marquee: ['Zero caffeine added', 'Evenings included', 'Leave the inbox closed', 'Join for free', 'Laptop lid down'],
    flavors: {
      title: 'The after-hours range',
      items: [
        { name: 'Sign-off Lime', note: 'Write the next step for your unfinished job, then save and close it.', tone: 'lime' },
        { name: 'After Hours Berry', note: 'Tell the group chat you are heading off. Put the phone out of reach.', tone: 'berry' },
        { name: 'Loose End Citrus', note: 'Do Let one thing go before you start another argument in your head.', tone: 'citrus' },
        { name: 'Pillow Ice', note: 'Check off Close the day. Leave the evening clear of another work session.', tone: 'ice' },
      ],
    },
    label: {
      title: 'Evening facts',
      serving: 'Best served after work',
      rows: [
        { label: 'Final task', value: 'Close the day' },
        { label: 'Saved draft', value: 'Keep for work hours' },
        { label: 'Phone', value: 'Set aside' },
      ],
      footnote: 'Review the day once. Leave the checklist closed.',
    },
    story: {
      caption: 'The inbox can sleep outside.',
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
