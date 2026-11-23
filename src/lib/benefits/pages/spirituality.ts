import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'spirituality',
  topic: 'Spirituality',
  kit: 'retreat',
  query: 'daily spiritual practice',
  title: 'A daily spiritual practice you can keep | Moltology',
  description:
    'A daily spiritual practice without the retreat price: a quiet morning, one honest look at yesterday and a clear close to each day. Free to join, ready today.',
  keywords: 'daily spiritual practice, spiritual routine, morning silence, evening reflection, mindfulness practice, spirituality without religion',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/spirituality/share.jpg',
    alt: 'A crab sitting still on warm sand at dawn',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Daily Shedding Routine',
    href: '/codex/scr-030',
    text: 'The practice comes from one reading in the Codex. It argues that two moments carry the day: the first hour, which decides what the day is for, and the last minutes, which decide what you carry into tomorrow.',
  },
  reveal: {
    headline: 'The retreat fits inside an ordinary day.',
    body: 'Begin with a few quiet minutes tomorrow morning and build from there.',
    screenshot: 'forum',
  },
  related: ['libido', 'energy-drinks'],
  faqs: [
    {
      question: 'Is Moltology a religion?',
      answer:
        'It borrows the shape of one, with readings, rituals and a community, and points it at everyday focus and habits. You keep any faith you hold, and there is nothing to believe before you start.',
    },
    {
      question: 'What makes this a spiritual practice?',
      answer:
        'It is built on what most traditions share: silence each morning, an honest look at the day before, attention to one thing at a time and letting go at night.',
    },
    {
      question: 'Do I need to meditate?',
      answer:
        'No. The first task asks you to sit quietly before you open your phone. Some members meditate; some drink a coffee and look out of the window.',
    },
    {
      question: 'How much time does it take?',
      answer:
        'The morning and evening practices take a few minutes each. The full day has eight small tasks, and you can begin with just the first and the last.',
    },
    {
      question: 'How do I start a spiritual practice at home?',
      answer:
        'Pick a small fixed time, keep it quiet and keep it short enough that you will do it again tomorrow. Something worth reading and a deliberate end to the day give it a shape.',
    },
    {
      question: 'Do I have to believe anything?',
      answer:
        'No. The Codex is a set of readings with its own story and language, and you can take it as metaphor. The practice is the same whatever you believe.',
    },

  ],
  content: {
    hero: {
      kicker: 'A retreat you never travel to',
      headline: 'A daily spiritual practice, at home.',
      sub: 'Moltology is a free daily practice: a quiet start, one honest look back and a clear end to each day. No flights, no fees, no week away.',
      cta: 'Begin your practice',
      image: {
        src: '/images/benefits/spirituality/hero.jpg',
        alt: 'A small crab resting on pale sand by still water at dawn',
        width: 1600,
        height: 1000,
      },
    },
    intention: {
      quote: 'Inspect the shell in the morning. Empty the sea of one thing at night. Everything between those two acts is negotiable.',
      source: { label: 'The Daily Shedding Routine', href: '/codex/scr-030' },
    },
    rhythm: {
      title: 'The shape of a day',
      intro: 'Eight small practices from first light to evening. Keep only the first and the last and the day still counts.',
      items: [
        { time: 'Early morning', title: 'Sit in silence', body: 'Before any feed or inbox, sit quietly and look honestly at yesterday.' },
        { time: 'Morning', title: 'Pick your one thing', body: 'Name what matters most today and begin it.' },
        { time: 'Late morning', title: 'Learn something hard', body: 'Read a passage or a lesson that asks something of you.' },
        { time: 'Noon', title: 'Reset your focus', body: 'Clear one distraction and choose the next useful act.' },
        { time: 'Afternoon', title: 'Do deep work', body: 'One unhurried block of real attention on the thing you chose.' },
        { time: 'Late afternoon', title: 'Help someone', body: 'Answer one member or welcome a newcomer.' },
        { time: 'Early evening', title: 'Let one thing go', body: 'Name one thing from today and set it down.' },
        { time: 'Evening', title: 'Close the day', body: 'Check off the day and stop. It is done either way.' },
      ],
    },
    itinerary: {
      title: 'Your first week',
      items: [
        { day: 'Day 1', title: 'Arrive', body: 'Take the three minute assessment and see where you stand on focus, calm and follow-through.' },
        { day: 'Day 2', title: 'Quiet mornings', body: 'Start the day without your phone, even for five minutes.' },
        { day: 'Days 3 to 5', title: 'Find the rhythm', body: 'Add one practice at a time until the day has a shape.' },
        { day: 'Day 6', title: 'Join the circle', body: 'Read the forum and say hello. Others are keeping the same rhythm.' },
        { day: 'Day 7', title: 'Look back', body: 'Read your week in your activity log and keep what worked.' },
      ],
    },
    carry: {
      title: 'What you take home',
      items: [
        'A morning that starts with you, not a feed',
        'One clear thing done each day',
        'People who keep the practice with you',
        'A library of readings to return to',
      ],
      image: {
        src: '/images/benefits/spirituality/carry.jpg',
        alt: 'A linen-covered table with an open notebook, a cup of tea and two ceramic crabs',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
