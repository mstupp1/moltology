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
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/culture/share.jpg?v=2',
    alt: 'A purple lobster and a crimson lobster sharing a tablet on a violet sofa in a colorful social app campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The General Discussion board',
    href: '/forum/general-discussion',
    text: 'Read a thread on General Discussion, then add a question or a reply of your own. Explain the reference if your post needs one, and give the next person something to answer.',
  },
  reveal: {
    headline: 'Your next post belongs somewhere.',
    body: 'Bring the question you keep typing into the wrong group chat.',
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
      headline: 'Internet culture worth opening a tab for.',
      sub: 'Bring the oddly specific question. Stay for the reply with three paragraphs about desk lamps. Moltology has a forum for talking, a daily practice to do, and a character you can put in a hat.',
      cta: 'Join in for free',
      chips: ['Open conversation', 'Room for odd questions', 'Pick your character', 'Join at no charge'],
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
    features: {
      title: 'Bring your particular kind of interesting',
      items: [
        { title: 'Give it a thread', body: 'Write a title that names the subject. Put your question in the post, with enough context for someone who missed the original conversation.' },
        { title: 'Wear the unusual hat', body: 'Your character appears beside your forum posts. Choose its look in the cosmetics shop, then let your reply do the talking.' },
        { title: 'Get curious about the reading', body: 'The Codex is there to read and discuss. Bring a passage to the forum and say what you think it asks you to do.' },
        { title: 'Explain the reference', body: 'A shared joke deserves a short explanation when someone asks. Add the context, credit the source, and let new people join in.' },
      ],
    },
    rooms: {
      title: 'Every conversation needs a home',
      intro: 'Use the board that fits your subject. Keep an introduction simple, give a technical question its details, and leave room for someone to disagree with you.',
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
