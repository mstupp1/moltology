import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'libido',
  topic: 'Libido',
  kit: 'clinic',
  query: 'low libido and low drive',
  title: 'Libido and low drive: a daily plan | Moltology',
  description:
    'Low libido and low drive can raise different questions. Moltology offers a free daily habit practice for the ordinary parts of your day.',
  keywords: 'low libido, low drive, daily routine, habit practice, quiet morning',
  indexed: true,
  updated: '2026-11-27',
  disclaimer:
    'Moltology offers a habit practice. If you’re worried about a change in libido, talk to a healthcare professional.',
  shareImage: {
    src: '/images/benefits/libido/share.jpg',
    alt: 'A crab in a clinic coat beside the words "Get your drive back"',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Grip',
    href: '/codex/scr-030#verse-3',
    text: 'Choose one thing that matters today and give it the first hour.',
  },
  reveal: {
    headline: 'Give the day a quiet start.',
    body: 'Begin with one small task on the daily checklist.',
    screenshot: 'dashboard',
  },
  related: ['energy-drinks', 'spirituality'],
  faqs: [
    { question: 'What does low libido mean?', answer: 'Low libido means having less interest in sex. Desire can vary over time and from person to person.' },
    { question: 'What can contribute to low libido?', answer: 'Stress, relationship difficulties, medications and hormonal changes are among the possible factors.' },
    { question: 'When should I talk to a healthcare professional about my sex drive?', answer: 'Bring it up if the change worries you or you suspect it may be related to a medication.' },
    { question: 'What does the Moltmax quiz cover?', answer: 'Fifteen questions about everyday habits, including focus, follow-through, adaptability and boundaries.' },
    { question: 'What’s on the daily checklist?', answer: 'A quiet opening, a priority, a hard lesson, a midday reset, deep work, helping someone, letting one thing go, and closing the day.' },
  ],
  content: {
    hero: {
      eyebrow: 'Habit check-in',
      headline: 'Low libido on a low-drive day?',
      sub: 'Build a little structure into a low-drive day, from a quiet start to a deliberate stop.',
      cta: 'Start free',
      image: {
        src: '/images/benefits/libido/hero.jpg',
        alt: 'A calm crab in a pale clinic coat holding a clipboard, soft daylight',
        width: 1024,
        height: 1280,
      },
    },
    steps: {
      title: 'Give the day a shape',
      items: [
        { title: 'Look at your habits', body: 'Take the Moltmax quiz for a snapshot of your everyday routine.' },
        { title: 'Pick one place to start', body: 'Open the checklist and choose a task that fits today.' },
        { title: 'Log the day', body: 'Check off what you did. Come back tomorrow.' },
      ],
    },
    plans: {
      title: 'Three readings to start with',
      intro: 'Pick the one that fits your day.',
      items: [
        {
          name: 'The morning reset',
          tag: 'Start here',
          body: 'Sit quietly before any feed, then pick your one thing. Two tasks, about fifteen minutes.',
          href: '/codex/scr-030#verse-2',
        },
        {
          name: 'The deep work block',
          tag: 'For scattered days',
          body: 'One block a day with notifications off and a single task open.',
          href: '/codex/scr-031',
        },
        {
          name: 'The evening wind down',
          tag: 'For late nights',
          body: 'Let one thing go, close the day and stop. It is done either way.',
          href: '/codex/scr-032',
        },
      ],
    },
  },
}

export default page
