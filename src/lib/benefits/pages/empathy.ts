import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'empathy',
  topic: 'Empathy',
  kit: 'retreat',
  variant: 'amber-hearth',
  query: 'how to be more empathetic',
  title: 'How to be more empathetic: begin by listening | Moltology',
  description:
    'Learn how to be more empathetic through small acts of attention. Hear the whole story, ask before offering advice and make time to help a member.',
  keywords: 'how to be more empathetic, listening, understanding others, thoughtful replies, helping others',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/empathy/share.jpg?v=2',
    alt: 'A crab and lobster seated at a garden table in warm, welcoming wellness retreat photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Benthic Pod',
    href: '/codex/scr-030#verse-7',
    text: 'The Benthic Pod asks you to check in with the community, answer a question or welcome a newcomer. Put that into practice with Help a member. Read their words first, then write a reply that speaks to what they asked.',
  },
  reveal: {
    headline: 'Pull up a chair for someone else’s story.',
    body: 'Make Help a member a thoughtful part of your daily routine.',
    screenshot: 'forum',
  },
  related: ['communication', 'social', 'loyalty'],
  faqs: [
    {
      question: 'How do I learn to be more empathetic?',
      answer:
        'Practice listening through to the end before planning your reply. Ask a question about the part you do not understand, then check that you heard correctly. Try this with one forum post when you do Help a member.',
    },
    {
      question: 'Can I be more empathetic when I disagree?',
      answer:
        'Yes. You can take someone’s feelings seriously and still disagree with their conclusion. Say which part you understand before explaining your own view. “I can see why that upset you” leaves room for a different opinion about what to do.',
    },
    {
      question: 'What is the difference between empathy and sympathy?',
      answer:
        'Empathy is trying to understand someone’s experience from their point of view. Sympathy is feeling concern for what they are going through. In either case, ask what they need before deciding how to help.',
    },
    {
      question: 'When should I give advice instead of listening?',
      answer:
        'Give advice when someone asks for it, or ask permission if you are unsure. “Would you like ideas, or do you want to talk it through?” is a useful question. Keep your suggestion close to the problem they described.',
    },
    {
      question: 'Do I need a similar experience to understand someone?',
      answer:
        'No. You can ask, listen and accept that their experience differs from yours. Avoid matching every detail to a story about yourself. A short question about their situation is often the better next thing to say.',
    },
    {
      question: 'How much support should I offer someone?',
      answer:
        'Offer what you have the time and knowledge to give. Be clear about whether you can listen now, answer a question or help with a practical job. Keep that offer honest, and respect their choice to decline it.',
    },
  ],
  content: {
    hero: {
      kicker: 'Good company · thoughtful conversation',
      headline: 'Be more empathetic. Let them finish the story.',
      sub: 'Set your own story aside for a moment. Let someone finish theirs. Moltology makes space for that simple act through Help a member: a daily invitation to answer a question, welcome someone new and take an interest before offering an opinion.',
      cta: 'Join the conversation',
      image: {
        src: '/images/benefits/empathy/hero.jpg?v=2',
        alt: 'A crab and lobster facing each other on a garden bench in soft, sunlit wellness retreat photography',
        width: 1600,
        height: 1000,
      },
    },
    intention: {
      quote: 'Check in with the Benthic Community, answer one question, or welcome someone new.',
      source: { label: 'The Benthic Pod, from the Codex', href: '/codex/scr-030#verse-7' },
    },
    rhythm: {
      title: 'Make room for a person in your day',
      intro: 'The eight daily tasks include time for your own work and an invitation to help someone else. Keep both in view. A thoughtful answer needs a little attention; it does not need your entire afternoon or a speech.',
      items: [
        { time: 'Over the first cup', title: 'Sit in silence', body: 'Leave yesterday’s unfinished argument alone while you sit quietly before the day starts.' },
        { time: 'When planning work', title: 'Pick your one thing', body: 'Name your own priority before offering a helping hand with someone else’s.' },
        { time: 'With a fresh page', title: 'Learn something hard', body: 'Read a view unlike your own and stay with the part that surprises you.' },
        { time: 'Between appointments', title: 'Reset your focus', body: 'Put the other screens away before opening the message you mean to answer.' },
        { time: 'In your work block', title: 'Do deep work', body: 'Keep the appointment with your own task before promising another block of time.' },
        { time: 'When visiting the community', title: 'Help a member', body: 'Welcome someone by name or answer a question you have the experience to answer.' },
        { time: 'After the conversation', title: 'Let one thing go', body: 'Set down the urge to have the last word when a discussion is finished.' },
        { time: 'As you put work away', title: 'Close the day', body: 'Mark your completed tasks and leave any further conversation for a time you can offer.' },
      ],
    },
    itinerary: {
      title: 'A small guide to a good reply',
      items: [
        { day: 'Welcome', title: 'Meet the actual question', body: 'Read a forum post to the end. Notice what the member wants help with.' },
        { day: 'Listen', title: 'Keep their detail', body: 'Remember the part about their situation that your usual advice might miss.' },
        { day: 'Ask', title: 'Check before guessing', body: 'Ask one short question if you need context. Leave them room to answer.' },
        { day: 'Offer', title: 'Give what you know', body: 'Share a relevant example or a practical suggestion. Say where your experience ends.' },
        { day: 'Leave space', title: 'Let them choose', body: 'Offer your reply without requiring agreement. Their next step belongs to them.' },
      ],
    },
    carry: {
      title: 'Bring these to the next conversation',
      items: [
        'A phone put away while someone speaks',
        'A question you have not answered for them',
        'An offer that fits your time',
        'Enough space for a different point of view',
      ],
      image: {
        src: '/images/benefits/empathy/carry.jpg?v=2',
        alt: 'A lobster leaning toward a crab across a linen-covered table in intimate wellness retreat editorial photography',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
