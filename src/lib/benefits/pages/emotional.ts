import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'emotional',
  topic: 'Emotional',
  kit: 'retreat',
  variant: 'terracotta-courtyard',
  query: 'emotional regulation',
  title: 'Emotional regulation: let the reply wait | Moltology',
  description:
    'Make time for emotional regulation in an ordinary day. Pause before a reply, name what happened and choose one next step in a quiet daily practice.',
  keywords: 'emotional regulation, pause before replying, naming feelings, daily routine, quiet practice',
  indexed: true,
  updated: '2026-11-27',
  disclaimer: 'Moltology is not therapy; speak with a qualified professional about ongoing distress.',
  shareImage: {
    src: '/images/benefits/emotional/share.jpg?v=2',
    alt: 'A lobster sitting beside a closed journal in a sage-colored room, photographed like a quiet wellness retreat',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Nightly Molt Audit',
    href: '/codex/scr-032#verse-5',
    text: 'Name one replay you’re ready to put down for the night.',
  },
  reveal: {
    headline: 'The draft can wait.',
    body: 'Give yourself a quiet minute before your next reply.',
    screenshot: 'forum',
  },
  related: ['resilience', 'communication', 'spirituality'],
  faqs: [
    {
      question: 'What does emotional regulation mean?',
      answer:
        'Emotional regulation means noticing emotions and choosing how to respond to them. It includes naming a feeling, pausing before an action and deciding what the situation needs. Feeling angry and sending an angry message are separate things.',
    },
    {
      question: 'How can I practice emotional regulation during an argument?',
      answer:
        'Ask for a pause if you need one, and agree when to return to the conversation. Say what happened and what you need without guessing the other person’s motives. Start with one issue, such as the plan that changed without a message.',
    },
    {
      question: 'Is suppressing emotions the same as managing them?',
      answer:
        'No. Suppressing an emotion means pushing it away or hiding it. Managing your response can include admitting you are upset and choosing to speak later. A quiet moment does not require a blank mind or a cheerful mood.',
    },
    {
      question: 'Which words can I use when I cannot name a feeling?',
      answer:
        'Simple ones work: angry, sad, afraid or disappointed. Describe the event separately: “The meeting moved, and I missed it.” Leave room to change the word as you work out what bothered you.',
    },
    {
      question: 'Should I reply to a difficult message immediately?',
      answer:
        'You can pause when the message is not urgent. Save a draft, check what the person actually asked and decide whether a call would suit the conversation. If you promised an answer, tell them when you plan to respond.',
    },
    {
      question: 'Can I do a daily task while I am upset?',
      answer:
        'Yes. Choose a task that fits the moment, such as putting an unrelated screen away or sitting quietly. The task list asks what you did; it does not ask you to rate whether your feelings were acceptable.',
    },
  ],
  content: {
    hero: {
      kicker: 'An unhurried daily practice',
      headline: 'Emotional regulation before you hit send.',
      sub: 'Let the draft sit. Come back when you know what you want to say.',
      cta: 'Begin free',
      image: {
        src: '/images/benefits/emotional/hero.jpg?v=2',
        alt: 'A crab resting on a cushioned bench beside a courtyard pool in soft wellness retreat photography',
        width: 1600,
        height: 1000,
      },
    },
    intention: {
      quote: 'At the surface, pressure feels like chaos because every shove hits you from a different angle. Below, it presses evenly from all sides.',
      source: { label: 'Even Pressure, from the Codex', href: '/codex/scr-011#verse-3' },
    },
    rhythm: {
      title: 'Leave a little space',
      intro: 'Four quiet places to put a pause in the day.',
      items: [
        { time: 'As you wake', title: 'Sit in silence', body: 'Sit by the window before reading messages, with whatever mood you woke up in.' },
        { time: 'In a midday gap', title: 'Reset your focus', body: 'Close an unrelated conversation and choose the next action on the task at hand.' },
        { time: 'As work winds down', title: 'Let one thing go', body: 'Name a small frustration from today that you are ready to stop revisiting tonight.' },
        { time: 'Before the lights go out', title: 'Close the day', body: 'Check the actions you completed, then stop checking the list for the evening.' },
      ],
    },
    carry: {
      title: 'Keep a kind note to yourself',
      items: [
        'I can name a feeling without arguing with it',
        'I can ask to finish this conversation later',
        'I can make one request in a short message',
        'I can stop working with the day unfinished',
      ],
      image: {
        src: '/images/benefits/emotional/carry.jpg?v=2',
        alt: 'A lobster closing a notebook next to a ceramic tea cup in warm linen-toned retreat photography',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
