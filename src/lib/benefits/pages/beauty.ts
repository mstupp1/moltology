import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'beauty',
  topic: 'Beauty',
  kit: 'atelier',
  variant: 'porcelain-lacquer',
  query: 'inner beauty',
  title: 'Inner beauty, with attention to detail | Moltology',
  description:
    'Make room for inner beauty in your daily routine. Meet your Moltology character, then practice listening, keeping promises and helping someone.',
  keywords: 'inner beauty, everyday kindness, listening habits, personal character, beauty routine',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/beauty/share.jpg?v=2',
    alt: 'A glossy crab beside an ivory pedestal in a softly lit luxury beauty photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Your character in 3D',
    href: '/character/3d',
    text: 'Give your character a look that feels like yours.',
  },
  reveal: {
    headline: 'Start with the everyday pieces.',
    body: 'Choose one small act of care and put it on today’s list.',
    screenshot: 'dashboard',
  },
  related: ['fashion', 'empathy', 'charisma'],
  faqs: [
    {
      question: 'What counts as inner beauty?',
      answer:
        'Inner beauty means qualities such as kindness, honesty and care for others. In daily life, that might mean remembering a name, owning a mistake or keeping a promise nobody else knows about. Pick an action you value and practice it.',
    },
    {
      question: 'How do you practice inner beauty each day?',
      answer:
        'Pick a small act of care you can do today. Ask your friend about the appointment they mentioned, or give someone time to finish a difficult sentence. Moltology’s Help a member task is the same habit, on the forum.',
    },
    {
      question: 'Can I be kind and still say no?',
      answer:
        'Yes. A kind refusal can be short and clear: “I cannot take that on today.” Offer another option if you want to, and avoid agreeing to a favor you already know you cannot do.',
    },
    {
      question: 'Where does listening fit into a beauty routine?',
      answer:
        'Listening belongs in how you treat people throughout the day. Put down the phone, hear the full story and ask a question about what they said. Save your similar story for after they finish theirs.',
    },
    {
      question: 'Is inner beauty more important than looks?',
      answer:
        'They are different things, and you do not have to pick one. Looks are what people notice first. Inner beauty is what they remember after a long conversation, a returned favor or a hard week.',
    },
    {
      question: 'Which small gestures show thoughtfulness?',
      answer:
        'Remembering details and following up are good places to start. Return the borrowed book, send the address you promised and ask before sharing personal news. Choose the gesture the other person asked for, even if something grander would make a better story.',
    },
  ],
  content: {
    hero: {
      season: 'The beauty issue · Daily care',
      headline: 'Inner beauty, in daily wear.',
      sub: 'A quiet start, a promise kept, a little care for the person across from you.',
      cta: 'Join free',
      image: {
        src: '/images/benefits/beauty/hero.jpg?v=2',
        alt: 'A pearl-colored crab against cream studio paper, photographed with soft beauty-editorial lighting',
        width: 1024,
        height: 1280,
      },
    },
    lookbook: {
      title: 'The everyday collection',
      intro: 'Four small acts of care from the daily checklist.',
      items: [
        { name: 'Sit in silence', note: 'Before the inbox, sit quietly and look back at yesterday. Recall the conversation you rushed through. Leave the next message unopened for now.' },
        { name: 'Pick your one thing', note: 'Write down what matters today and begin. Include the promise you keep moving to another list if that is the thing that needs doing.' },
        { name: 'Help a member', note: 'Answer a forum question or welcome someone new. Use their name if they have shared it, and reply to what they actually asked.' },
        { name: 'Close the day', note: 'Check your tasks, put the unfinished work down and stop. Leave the evening some room beyond the checklist.' },
      ],
    },
    campaign: {
      quote: 'Remembering how someone takes their tea is a very small detail. Keep it.',
      credit: 'House notes · Thoughtfulness',
      image: {
        src: '/images/benefits/beauty/look.jpg?v=2',
        alt: 'A pale crab at a dressing table in a tightly framed, softly lit cosmetics editorial',
        width: 1024,
        height: 1280,
      },
    },
  },
}

export default page
