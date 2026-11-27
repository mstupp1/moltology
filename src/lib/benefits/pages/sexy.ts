import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'sexy',
  topic: 'Sexy',
  kit: 'atelier',
  variant: 'milan-terracotta',
  query: 'how to be more attractive',
  title: 'How to be more attractive: the daily edit | Moltology',
  description:
    'Wondering how to be more attractive? Start with the Moltmax quiz, then practice giving your attention, speaking plainly and keeping your own plans.',
  keywords: 'how to be more attractive, quiet confidence, conversation habits, bearing, Moltmax quiz',
  indexed: true,
  updated: '2026-11-27',
  disclaimer: 'Moltology offers a daily practice, not health advice or a promise that anyone will find you attractive.',
  shareImage: {
    src: '/images/benefits/sexy/share.jpg?v=2',
    alt: 'A lobster wearing evening tailoring against a black studio backdrop in a fashion campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Moltmax quiz',
    href: '/moltmax',
    text: 'Answer 15 questions about the week you actually had.',
  },
  reveal: {
    headline: 'Start before the reservation.',
    body: 'Take the quiz and pick one habit to practice this week.',
    screenshot: 'dashboard',
  },
  related: ['charisma', 'fashion', 'beauty'],
  faqs: [
    {
      question: 'What makes someone attractive in conversation?',
      answer:
        'Attention, mostly. Ask a question you want answered, listen to the reply and share something honest about yourself. Put the phone away while you talk, including when the story takes a detour.',
    },
    {
      question: 'Can a quiet person be more attractive?',
      answer:
        'Yes, and without becoming loud. Say hello, ask about a shared interest and give your opinion when you have one. You can leave a pause in the conversation without apologizing for it.',
    },
    {
      question: 'What does confident body language look like?',
      answer:
        'Comfortable posture, natural gestures and attention to the person speaking are common examples. Let your hands rest, face the conversation when practical and use eye contact in a way that suits you. Skip the pose that requires constant checking.',
    },
    {
      question: 'Should I rehearse what to say before a date?',
      answer:
        'A little preparation is fine. Check the meeting place and think of something you would like to ask. Leave space for an answer you did not plan for; a date does not need a running order.',
    },
    {
      question: 'Why does my phone distract me during a conversation?',
      answer:
        'Habit, boredom and waiting for a message are all possible reasons. Put the phone in a bag and choose when to check it next. If you are waiting on one call, say so once instead of glancing at the screen all evening.',
    },
    {
      question: 'Does the Moltmax quiz score my appearance?',
      answer:
        'No. Its questions concern boundaries, follow-through, focus, adaptability and calm under pressure. Answer them as a check on your habits, then read the daily tasks before choosing where to start.',
    },
  ],
  content: {
    hero: {
      season: 'After hours · The confidence edit',
      headline: 'More attractive. Off script.',
      sub: 'Put the phone away. Say hello. Give the evening a little room.',
      cta: 'Join free',
      image: {
        src: '/images/benefits/sexy/hero.jpg?v=2',
        alt: 'A red-brown lobster in a dark silk jacket under sharp studio lighting for an eveningwear editorial',
        width: 1024,
        height: 1280,
      },
    },
    lookbook: {
      title: 'The off-script collection',
      intro: 'Four everyday habits for the part of the evening nobody rehearses.',
      items: [
        { name: 'Sit in silence', note: 'Sit quietly before checking messages. Look back at yesterday, including the moment you agreed to something you did not want to do.' },
        { name: 'Learn something hard', note: 'Spend time on a subject you genuinely want to understand. Write the question you still have instead of memorizing a clever line.' },
        { name: 'Help a member', note: 'Offer an answer on the forum or welcome a newcomer. Keep the reply about them, even if your best anecdote remains unused.' },
        { name: 'Close the day', note: 'Check what you did and stop for the night. Put the outfit away with the running commentary on how the evening went.' },
      ],
    },
    campaign: {
      quote: 'Ask a good question. Resist planning your next outfit while they answer.',
      credit: 'Evening notes · Attention',
      image: {
        src: '/images/benefits/sexy/look.jpg?v=2',
        alt: 'A lobster in dark eveningwear on a shadowed editorial set with warm side lighting',
        width: 1024,
        height: 1280,
      },
    },
  },
}

export default page
