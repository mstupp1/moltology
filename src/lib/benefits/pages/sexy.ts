import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'sexy',
  topic: 'Sexy',
  kit: 'atelier',
  query: 'how to be more attractive',
  title: 'How to be more attractive: the daily edit | Moltology',
  description:
    'Wondering how to be more attractive? Start with the Moltmax quiz, then practice giving your attention, speaking plainly and keeping your own plans.',
  keywords: 'how to be more attractive, quiet confidence, conversation habits, bearing, Moltmax quiz',
  indexed: false,
  updated: '2026-11-22',
  disclaimer: 'Moltology offers a daily practice, not health advice or a promise that anyone will find you attractive.',
  shareImage: {
    src: '/images/benefits/sexy/share.jpg?v=2',
    alt: 'A lobster wearing evening tailoring against a black studio backdrop in a fashion campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The 15-question Moltmax quiz',
    href: '/moltmax',
    text: 'Take the Moltmax quiz and answer its 15 questions about your habits. Use your actual week, including the unfinished jobs and the phone at dinner. Then pick a task to do today. Leave the imaginary perfect week out of the fitting.',
  },
  reveal: {
    headline: 'Start before the dinner reservation.',
    body: 'Answer the quiz, then put one daily task into practice.',
    screenshot: 'dashboard',
  },
  related: ['charisma', 'fashion', 'beauty'],
  faqs: [
    {
      question: 'How to be more attractive in conversation?',
      answer:
        'Give the conversation your attention. Ask a question you want answered, listen to the reply and share something honest about yourself. Put the phone away while you talk, including when the story takes a detour.',
    },
    {
      question: 'How to be more attractive as a quiet person?',
      answer:
        'Keep your own speaking style. Say hello, ask about a shared interest and give your opinion when you have one. You can leave a pause in the conversation without apologizing for it.',
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
        'Habit, boredom and waiting for a message are all possible reasons. Put the phone in a bag and choose when to check it next. Use Reset your focus to clear a distraction during your day too.',
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
      headline: 'Be more attractive. Put the script away.',
      sub: 'The jacket is ready. Put the phone away, say hello and let the evening happen off script. Start with the Moltmax quiz, then take up a daily practice in attention and follow-through. Keep a few plans that belong to you, too.',
      cta: 'Make your daily edit, free',
      image: {
        src: '/images/benefits/sexy/hero.jpg?v=2',
        alt: 'A red-brown lobster in a dark silk jacket under sharp studio lighting for an eveningwear editorial',
        width: 1024,
        height: 1280,
      },
    },
    manifesto: [
      'Wear the outfit you can sit down in.',
      'Ask the question you actually want answered.',
      'Let the next sentence arrive after you have heard theirs.',
    ],
    lookbook: {
      title: 'Before you go out',
      intro: 'Moltology has eight daily tasks. Follow them through your own day, including the parts nobody is watching. Start a piece of work, learn something difficult and lend a hand. Leave the entrance music to the restaurant.',
      items: [
        { name: 'Sit in silence', note: 'Sit quietly before checking messages. Look back at yesterday, including the moment you agreed to something you did not want to do.' },
        { name: 'Pick your one thing', note: 'Choose a priority of your own and start it. Keep that appointment with yourself before checking who has replied.' },
        { name: 'Learn something hard', note: 'Spend time on a subject you genuinely want to understand. Write the question you still have instead of memorizing a clever line.' },
        { name: 'Reset your focus', note: 'Close the message thread you keep reopening. Clear that distraction and choose the next useful thing to do.' },
        { name: 'Do deep work', note: 'Switch off interruptions for a block of work. Give the draft, the drawing or the repair your attention until you stop.' },
        { name: 'Help a member', note: 'Offer an answer on the forum or welcome a newcomer. Keep the reply about them, even if your best anecdote remains unused.' },
        { name: 'Let one thing go', note: 'Choose something from today to put down. An unanswered message can stay unanswered while you get on with your evening.' },
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
    care: {
      title: 'Evening instructions',
      rows: [
        { label: 'First fitting', value: 'The Moltmax quiz' },
        { label: 'Questions', value: '15 about your habits' },
        { label: 'Carry', value: 'A genuine interest' },
        { label: 'Phone', value: 'Keep in your bag' },
        { label: 'Dress code', value: 'Comfortable enough to stay' },
        { label: 'Entry', value: 'Join free' },
      ],
      footnote: 'Before you leave, check the address and put your keys somewhere sensible. Once you arrive, say what you mean, ask before making plans for someone else and let a polite goodbye be the end of the evening.',
    },
  },
}

export default page
