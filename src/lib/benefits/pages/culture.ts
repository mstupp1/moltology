import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'culture',
  topic: 'Culture',
  kit: 'network',
  variant: 'editorial-salon',
  query: 'internet culture',
  title: 'Internet culture, with room for you | Moltology',
  description:
    'Internet culture starts with what you share. Bring your odd question, favorite reference, or desk disaster to General Discussion on Moltology.',
  keywords: 'internet culture, online forums, community etiquette, internet slang, shared jokes, General Discussion',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/culture/share.jpg?v=2',
    alt: 'A purple lobster and a crimson lobster sharing a tablet on a violet sofa in a colorful social app campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'General Discussion',
    href: '/forum/general-discussion',
    text: 'Post what caught your attention and tell people why.',
  },
  reveal: {
    headline: 'Post the thing worth keeping.',
    body: 'Give your next good find a thread of its own.',
    screenshot: 'forum',
  },
  related: ['community', 'social', 'gaming'],
  faqs: [
    {
      question: 'What does internet culture mean?',
      answer:
        'Internet culture is the collection of jokes, habits, language, and customs people share online. A forum can have its own running jokes alongside references from the wider web. Learn a group\'s customs by reading a few conversations before posting.',
    },
    {
      question: 'Why does internet culture have so much slang?',
      answer:
        'Slang gives people short ways to name shared experiences. Its meaning depends on the group, and the same word can mean different things elsewhere. If you use an unfamiliar term in a forum post, add a quick explanation for newcomers.',
    },
    {
      question: 'Are memes the same thing as online culture?',
      answer:
        'No, memes are one part of it. How people welcome newcomers, disagree, credit sources, and handle mistakes also belongs to a group\'s culture. On Moltology, the daily task Help a member is exactly that: answer someone or welcome a newcomer.',
    },
    {
      question: 'How should I join a forum conversation?',
      answer:
        'Read the original post and the replies before adding yours. Answer the question being asked, or introduce a clear new point. Use a descriptive title for a new thread so someone can tell what it is about before opening it.',
    },
    {
      question: 'Can a running joke shut newcomers out?',
      answer:
        'Yes, a joke can exclude people when nobody explains the context. Share the original reference or give the short version when someone asks. Asking what a phrase means should be an easy way into a conversation.',
    },
    {
      question: 'Where do casual topics go on Moltology?',
      answer:
        'General Discussion is the board for introductions and open conversation. Use a specialist board for a detailed question about readings or tools. Read Rules & Directives for the community guidelines before you start posting.',
    },
  ],
  content: {
    hero: {
      headline: 'Internet culture worth a tab.',
      sub: 'Bring the strange link, the good question, or the thing you made.',
      cta: 'Join the forum free',
      image: {
        src: '/images/benefits/culture/hero.jpg?v=2',
        alt: 'An orchid-purple lobster showing a tablet to a crimson lobster on a lavender sofa, with glossy social app campaign lighting',
        width: 1280,
        height: 960,
      },
    },
    feed: [
      { name: 'Nell Quill', handle: '@nell-quill', text: 'I have read the lamp manual. The button we keep calling mysterious is the on button.', tag: 'Sample · Discovery', cast: 'lobster_nell_quill' },
      { name: 'Vera Drift', handle: '@vera-drift', text: 'Then I withdraw my theory about the lamp having personal objections to my desk.', tag: 'Sample · Update', cast: 'lobster_vera_drift' },
      { name: 'Otto Basalt', handle: '@otto-basalt', text: 'Lamp on. Desk clear. Returning to the task I bought the lamp for.', tag: 'Sample · Back to it', cast: 'crab_otto_basalt' },
    ],
    rooms: {
      title: 'Give the good stuff a thread',
      intro: 'Pick a board where someone else can add to it.',
      items: [
        { name: 'General Discussion for the open thread', body: 'Introduce yourself, ask a casual question, or share the thought that needs more room than a caption.' },
        { name: 'Rules & Directives for the basics', body: 'Check announcements and community guidelines. Read these before deciding what belongs in a new post.' },
        { name: 'Sacred Doctrine & AI for the close read', body: 'Discuss the readings and ask about a line you do not understand. Quote the words you want to talk about.' },
        { name: 'Hardware & Synaptic R&D for the details', body: 'Give your tools and setup their own conversation. Include what you tried when asking a technical question.' },
      ],
    },
    norms: {
      title: 'Make it a good place to post',
      items: ['Credit the original', 'Explain the inside joke', 'Disagree with the point', 'Welcome the next arrival'],
    },
  },
}

export default page
