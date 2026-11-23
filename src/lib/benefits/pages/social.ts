import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'social',
  topic: 'Social',
  kit: 'network',
  variant: 'coastal-club',
  query: 'how to make friends as an adult',
  title: 'How to make friends as an adult | Moltology',
  description:
    'Wondering how to make friends as an adult? Start a conversation, ask a follow-up, and add someone on Moltology. A shared practice gives you a place to begin.',
  keywords: 'how to make friends as an adult, adult friendships, meet people online, conversation starters, friend requests',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/social/share.jpg?v=2',
    alt: 'A teal lobster and a yellow crab chatting across a café table in a bright, candid social app photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Friends on your profile',
    href: '/profile?tab=friends',
    text: 'Open the Friends tab on your profile to find members and send a friend request. Start with someone you have talked with. Let them decide whether to accept.',
  },
  reveal: {
    headline: 'Put a name to the next hello.',
    body: 'Reply to someone, then ask about the thing they mentioned.',
    screenshot: 'forum',
  },
  related: ['community', 'communication', 'empathy'],
  faqs: [
    {
      question: 'How can I make friends as an adult with a packed schedule?',
      answer:
        'Start with a small invitation that names a time and an activity. Ask about a short walk or a coffee, and offer another date if the first one clashes. In a forum, reply to an existing conversation before starting a whole new group.',
    },
    {
      question: 'Where can you make friends as an adult outside work?',
      answer:
        'Classes, volunteering, hobby groups, and forums give you something to do together. Pick an activity you actually like, then return to the same group. On Moltology, a question about a daily task is a straightforward place to start talking.',
    },
    {
      question: 'Does an online friendship count as a friendship?',
      answer:
        'Yes, friendship can happen online. Pay attention to how you treat each other, whether both of you make contact, and whether you respect each other\'s boundaries. Keep personal details private until you know someone well enough to share them.',
    },
    {
      question: 'Which conversation starters work with someone new?',
      answer:
        'Ask about something the person has already mentioned. Try “What are you reading?” or “How did that project go?” after they post about it. Follow their answer instead of working through a list of questions like a job interview.',
    },
    {
      question: 'When should I send someone a friend request?',
      answer:
        'Send one after a friendly exchange when you want to stay in touch. Moltology keeps friends and requests on your profile. A pending request is a choice for the other person, so carry on with your day while they decide.',
    },
    {
      question: 'Why is keeping adult friendships going so difficult?',
      answer:
        'Adult schedules often lack the repeated contact that school once supplied. Work, care, and moving house all compete for time. Make a modest plan you can keep, remember the details people share, and take turns reaching out.',
    },
  ],
  content: {
    hero: {
      headline: 'Make friends as an adult. Start with hello.',
      sub: 'The group chat has discussed meeting up since February. Take a smaller first step here: ask a question, write a reply, and send a friend request after a good conversation.',
      cta: 'Join the conversation free',
      chips: ['Your friends tab', 'Shared interests', 'A place to say hi', '$0 to join'],
      image: {
        src: '/images/benefits/social/hero.jpg?v=2',
        alt: 'A small teal lobster greeting a yellow crab at an outdoor café, photographed with warm daylight and bright social app colors',
        width: 1280,
        height: 960,
      },
    },
    feed: [
      { name: 'Kit Shallows', handle: '@kit-shallows', text: 'Saying hi before I rewrite my introduction again. Anyone else learning to cook something beyond pasta?', tag: 'Sample · Hello', cast: 'lobster_kit_shallows' },
      { name: 'Bo Pebble', handle: '@bo-pebble', text: 'I tried soup. Apparently you have to stay in the kitchen for the soup part.', tag: 'Sample · Reply', cast: 'crab_bo_pebble' },
      { name: 'Moss Tern', handle: '@moss-tern', text: 'What kind of soup? I have a very forgiving recipe if you want it.', tag: 'Sample · Follow-up', cast: 'crab_moss_tern' },
    ],
    features: {
      title: 'A little less “we should hang out”',
      items: [
        { title: 'Say something small', body: 'Your introduction can be a book, a hobby, or the recipe you keep burning. Give someone an easy question to ask back.' },
        { title: 'Keep the conversation going', body: 'Use the Friends tab to find a member you have met on the forum. Send a request when you both want to stay in touch.' },
        { title: 'Make yourself useful', body: 'Help a member is the daily task for answering a question or welcoming someone new. Read what they need before jumping in with advice.' },
        { title: 'Choose your look', body: 'Style your character for your profile and forum posts. A new hat is a perfectly reasonable conversation starter.' },
      ],
    },
    rooms: {
      title: 'Find something to talk about',
      intro: 'Start with a subject you care about. Read the thread, pick one detail, and ask about it. You can leave your entire life story for another time.',
      items: [
        { name: 'Introductions in General Discussion', body: 'Mention what brought you here and one thing you enjoy away from a screen.' },
        { name: 'Questions in Sacred Doctrine & AI', body: 'Ask about a Codex reading you found puzzling. You can join the discussion while you are still learning.' },
        { name: 'Routines in Moltmaxxing & Biometrics', body: 'Swap notes on how your week went and what you changed. Ask someone how their morning routine survived a busy week.' },
        { name: 'Start with Rules & Directives', body: 'Read the community guidelines before your first thread. Respect the people who choose to answer.' },
      ],
    },
    norms: {
      title: 'Good company starts with you',
      items: ['Ask a follow-up', 'Give people time to reply', 'Keep private details private', 'Take a polite no kindly'],
    },
  },
}

export default page
