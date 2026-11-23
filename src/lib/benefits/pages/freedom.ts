import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'freedom',
  topic: 'Freedom',
  kit: 'retreat',
  variant: 'coastal-air',
  query: 'how to feel free',
  title: 'How to feel free: leave one thing behind | Moltology',
  description:
    'Wondering how to feel free? Start with one small thing to let go: a stale plan, a noisy feed or an automatic yes. Make space for a daily practice.',
  keywords: 'how to feel free, letting go, personal boundaries, fewer commitments, daily practice',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/freedom/share.jpg?v=2',
    alt: 'A crab resting beside an open linen tote on a quiet beach in airy retreat photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'What is shed does not come back, and this is the mercy',
    href: '/codex/scr-010#verse-4',
    text: 'This Codex verse is about not gluing dead plate back on: the outgrown habit, the draining obligation, the project that died months ago. Start small: remove a stale reminder or decline an optional invitation you keep dreading. Use Let one thing go to name what you are setting down.',
  },
  reveal: {
    headline: 'That old reminder can stop following you.',
    body: 'Start with Let one thing go and choose what to put down.',
    screenshot: 'forum',
  },
  related: ['spirituality', 'resilience', 'emotional'],
  faqs: [
    {
      question: 'How can I feel less tied to my phone?',
      answer:
        'Choose one moment when the phone stays out of reach, such as breakfast or a conversation. Turn off an optional notification you routinely dismiss. In Moltology, the morning starts with Sit in silence, before any scroll.',
    },
    {
      question: 'Why do I feel guilty saying no?',
      answer:
        'Saying no can clash with a habit of being available or a fear of disappointing someone. Keep the reply kind and clear: “I cannot take that on.” An explanation is yours to offer, and it can be short.',
    },
    {
      question: 'Where do I start with letting go of old plans?',
      answer:
        'Start with one plan you no longer want to carry out. Decide whether to drop it, change it or give it a real date. For a shared plan, tell the other person before removing it from your calendar.',
    },
    {
      question: 'Does setting boundaries mean ignoring other people?',
      answer:
        'No. A boundary names what you can offer and when, while leaving room for care. Tell a friend when you are available to talk, and keep essential responsibilities in view when changing your schedule.',
    },
    {
      question: 'What should I write when I let something go?',
      answer:
        'Write the thing and the action you took. “Deleted the reminder for the project I stopped doing” is enough. The daily task asks you to name one thing, so leave the complete life inventory for another occasion.',
    },
    {
      question: 'Can I change my mind about a commitment?',
      answer:
        'Yes. Check what you agreed to and who depends on it, then talk about a change. An optional club meeting and a promise to collect someone from school need different decisions. Begin with the commitment you can safely change.',
    },
  ],
  content: {
    hero: {
      kicker: 'Travel light · stay close to home',
      headline: 'Leave one thing behind. Make room to feel free.',
      sub: 'The unread newsletter. The hobby you keep apologizing to. The invitation that became a standing appointment. Pick one small thing you no longer want to carry. Name it tonight and let it go. Moltology builds a quiet daily routine around that one choice.',
      cta: 'Start with one less thing',
      image: {
        src: '/images/benefits/freedom/hero.jpg?v=2',
        alt: 'A lobster walking along an open stretch of pale sand in spacious wellness travel photography',
        width: 1600,
        height: 1000,
      },
    },
    intention: {
      quote: 'Once a thing is off you, it is off you.',
      source: { label: 'The Law of Ecdysis, verse 4', href: '/codex/scr-010#verse-4' },
    },
    rhythm: {
      title: 'A lighter packing list for the day',
      intro: 'Keep the eight daily tasks close. They ask you to choose what gets your attention, do the work you picked and stop at the end. Leave some space between appointments; you need somewhere to eat lunch.',
      items: [
        { time: 'First light', title: 'Sit in silence', body: 'Take a seat before checking what the rest of the world wants from you.' },
        { time: 'At your desk', title: 'Pick your one thing', body: 'Choose the task you mean to do before adding anything else to the list.' },
        { time: 'In your reading time', title: 'Learn something hard', body: 'Open the lesson you chose, with the recommended videos left for another visit.' },
        { time: 'At lunchtime', title: 'Reset your focus', body: 'Remove a distraction you can control, such as a tab you keep reopening.' },
        { time: 'For the main task', title: 'Do deep work', body: 'Put the phone away and work on the single job in front of you.' },
        { time: 'When you check in', title: 'Help a member', body: 'Offer help you have time to give, then return to your own responsibilities.' },
        { time: 'Before dusk', title: 'Let one thing go', body: 'Name an optional demand you are dropping and take the step to drop it.' },
        { time: 'At the end', title: 'Close the day', body: 'Tick what you completed and put the list away, including its empty boxes.' },
      ],
    },
    itinerary: {
      title: 'Leave something at the door',
      items: [
        { day: 'Unpack', title: 'Find the small weight', body: 'Look for the recurring reminder you dismiss every time it appears.' },
        { day: 'Choose', title: 'Check whose choice it is', body: 'Pick something optional that belongs to you. Keep promises to other people in view.' },
        { day: 'Release', title: 'Finish the small goodbye', body: 'Unsubscribe, delete the stale reminder or send a polite decline.' },
        { day: 'Rest', title: 'Leave the gap alone', body: 'Keep that newly empty calendar space empty for now. Resist assigning it another job.' },
        { day: 'Close', title: 'Name what you put down', body: 'Use the evening task to mark the choice, then leave the list for tonight.' },
      ],
    },
    carry: {
      title: 'Pack only what you mean to keep',
      items: [
        'A yes you have time for',
        'A short, kind sentence for saying no',
        'A calendar with an empty space',
        'Permission to retire an old plan',
      ],
      image: {
        src: '/images/benefits/freedom/carry.jpg?v=2',
        alt: 'A crab beside a loosely packed canvas bag on a sunlit veranda in linen-toned retreat photography',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
