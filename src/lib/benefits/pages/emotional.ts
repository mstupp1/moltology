import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'emotional',
  topic: 'Emotional',
  kit: 'retreat',
  query: 'emotional regulation',
  title: 'Emotional regulation: let the reply wait | Moltology',
  description:
    'Make time for emotional regulation in an ordinary day. Pause before a reply, name what happened and choose one next step in a quiet daily practice.',
  keywords: 'emotional regulation, pause before replying, naming feelings, daily routine, quiet practice',
  indexed: false,
  updated: '2026-11-22',
  disclaimer: 'Moltology is not therapy; speak with a qualified professional about ongoing distress.',
  shareImage: {
    src: '/images/benefits/emotional/share.jpg?v=2',
    alt: 'A lobster sitting beside a closed journal in a sage-colored room, photographed like a quiet wellness retreat',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Release it, from the Nightly Molt Audit',
    href: '/codex/scr-032#verse-5',
    text: 'Each night, say or write the one thing you are carrying and let it go. The verse is plain about it: it does not have to be resolved, only released. A heavy day gets a small, finishable ending.',
  },
  reveal: {
    headline: 'The reply can wait while you choose your words.',
    body: 'Give one difficult task a quiet place in your day.',
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
      headline: 'Emotional regulation starts with letting the reply wait.',
      sub: 'The email is open. The answer is already getting longer. Put it aside for a moment. Moltology invites you to name what happened, give a difficult task some quiet and choose what to do next. Start where you are, with the day you have.',
      cta: 'Take a moment for yourself',
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
      title: 'A place to pause between the demands',
      intro: 'Use the eight daily tasks as invitations to stop, choose and return. Put a little care around the awkward parts of the day: the tense meeting, the overdue answer, the conversation you keep replaying while making dinner.',
      items: [
        { time: 'As you wake', title: 'Sit in silence', body: 'Sit by the window before reading messages, with whatever mood you woke up in.' },
        { time: 'At the morning table', title: 'Pick your one thing', body: 'Choose one useful job, even when another part of the day feels unsettled.' },
        { time: 'When you open a book', title: 'Learn something hard', body: 'Read slowly through the part you do not understand before judging your attempt.' },
        { time: 'In a midday gap', title: 'Reset your focus', body: 'Close an unrelated conversation and choose the next action on the task at hand.' },
        { time: 'With the door closed', title: 'Do deep work', body: 'Give a difficult job its own block, with the incoming messages left outside it.' },
        { time: 'On the forum', title: 'Help a member', body: 'Read a request carefully and answer the question you have the patience to answer.' },
        { time: 'As work winds down', title: 'Let one thing go', body: 'Name a small frustration from today that you are ready to stop revisiting tonight.' },
        { time: 'Before the lights go out', title: 'Close the day', body: 'Check the actions you completed, then stop checking the list for the evening.' },
      ],
    },
    itinerary: {
      title: 'Before you send that message',
      items: [
        { day: 'Pause', title: 'Leave it in drafts', body: 'Take your hands off the keyboard. Check whether the answer actually needs to go now.' },
        { day: 'Name', title: 'Say what happened', body: 'Write the event in a short sentence. Keep the imagined motives on a separate line.' },
        { day: 'Ask', title: 'Find the request', body: 'Decide what you want to ask for: a correction, a date or a conversation.' },
        { day: 'Choose', title: 'Use the right channel', body: 'Pick a message or a call. Give the other person time to answer.' },
        { day: 'Return', title: 'Do the next ordinary thing', body: 'Go back to your chosen task while you wait. Leave the sent folder closed.' },
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
