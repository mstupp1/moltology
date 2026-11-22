import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'stature',
  topic: 'Stature',
  kit: 'atelier',
  query: 'how to have presence',
  title: 'How to have presence: take your time | Moltology',
  description:
    'Explore how to have presence through everyday habits. Read The Final Attributes, put the phone aside and practice listening before you answer.',
  keywords: 'how to have presence, personal presence, comfortable posture, speaking pace, The Final Attributes',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/stature/share.jpg?v=2',
    alt: 'A green lobster beside a stone plinth in a spare luxury tailoring campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Final Attributes, Codex verse 9',
    href: '/codex/scr-024#verse-9',
    text: 'Read The Final Attributes in the Codex. Its description includes “calm, unhurried, difficult to move and easy to reach.” Take the unhurried part into your next conversation: let the question finish, pause and give your answer.',
  },
  reveal: {
    headline: 'There is room to take your time.',
    body: 'Carry one line from The Final Attributes into your next conversation.',
    screenshot: 'dashboard',
  },
  related: ['charisma', 'communication', 'fashion'],
  faqs: [
    {
      question: 'Can I have presence while seated?',
      answer:
        'Yes. Sit in a position that is comfortable for you and give the speaker your attention. Set the unrelated task aside, greet them and listen before answering. Use whatever position and movement suit your access needs.',
    },
    {
      question: 'How do I have more presence in meetings?',
      answer:
        'Arrive knowing the point you want to discuss. Listen to what has already been said, then make that point in a clear sentence. Ask for a moment to think if the question needs one.',
    },
    {
      question: 'Does personal presence depend on height?',
      answer:
        'No. Personal presence concerns how you engage with others, including your attention, manner and pace. Practice greeting someone or giving a direct answer in the body and position you have.',
    },
    {
      question: 'What should I do with my posture when speaking?',
      answer:
        'Choose a comfortable position with support where you need it. Turn toward the conversation when practical and let yourself move naturally. Avoid holding a rigid pose just to look composed.',
    },
    {
      question: 'Can I pause before answering a question?',
      answer:
        'Yes. A brief pause is a normal part of conversation. Say “Let me think about that” when you need a moment, then answer the question you were asked.',
    },
    {
      question: 'Why is it hard to slow down when I speak?',
      answer:
        'Excitement, nerves and a habit of rushing are possible reasons. Try finishing a sentence before adding the next point, and allow the other person a turn. Choose an everyday exchange for practice instead of scripting a whole speech.',
    },
  ],
  content: {
    hero: {
      season: 'The still edition · An unhurried manner',
      headline: 'How to have presence, at your own pace.',
      sub: 'Keep your place at the table. Let the question finish. You can take a moment before you answer. Moltology pairs a reading from The Final Attributes with daily tasks in attention, work and helping others. Begin with the conversation already in front of you.',
      cta: 'Take up the practice, free',
      image: {
        src: '/images/benefits/stature/hero.jpg?v=2',
        alt: 'A deep-green lobster in an architectural chair, photographed on a minimalist tailoring editorial set',
        width: 1024,
        height: 1280,
      },
    },
    manifesto: [
      'Sit down before reaching for your phone.',
      'Greet the person beside you and listen to the answer.',
      'Take your turn without rushing to keep it.',
    ],
    lookbook: {
      title: 'A day in good form',
      intro: 'The eight daily tasks ask you to choose your work, give it your attention and stop when the day is done. Read the instructions as they come. Keep a comfortable seat for the quiet parts and a clear desk for the work.',
      items: [
        { name: 'Sit in silence', note: 'Start with a quiet look at yesterday. Settle into a comfortable position and leave the inbox until after this task.' },
        { name: 'Pick your one thing', note: 'Write the priority in a plain sentence and begin. Give it a place in the day before the next request arrives.' },
        { name: 'Learn something hard', note: 'Stay with a difficult idea. Read the passage again if you need to, and write down the question before reaching for an opinion.' },
        { name: 'Reset your focus', note: 'At noon, clear a distraction from your space. Put away the second screen and decide what to return to next.' },
        { name: 'Do deep work', note: 'Work on a single thing with interruptions put aside. Keep your attention on the task, even when nobody is asking for an update.' },
        { name: 'Help a member', note: 'Give a forum question a careful read. Offer an answer the person can use, or welcome someone who is still finding their way.' },
        { name: 'Let one thing go', note: 'Choose a piece of today to release. Leave the conversation you wish had gone differently in the room where it happened.' },
        { name: 'Close the day', note: 'Review your tasks and stop adding to the list. Put the work away with a clear ending, including what remains unfinished.' },
      ],
    },
    campaign: {
      quote: 'You can let the silence last longer than it takes to reach for your phone.',
      credit: 'Fitting room notes · The pause',
      image: {
        src: '/images/benefits/stature/look.jpg?v=2',
        alt: 'A green lobster beside an unoccupied chair in a softly shadowed architectural fashion photograph',
        width: 1024,
        height: 1280,
      },
    },
    care: {
      title: 'Instructions for an unhurried day',
      rows: [
        { label: 'Reading', value: 'The Final Attributes' },
        { label: 'Passage', value: 'Verse 9' },
        { label: 'Seat', value: 'Somewhere comfortable' },
        { label: 'Hands', value: 'Let them rest naturally' },
        { label: 'Speaking', value: 'Finish one thought' },
        { label: 'Welcome', value: 'Join the practice free' },
      ],
      footnote: 'Try the next ordinary greeting. Turn away from the unfinished email, say hello and hear the reply. If you need a moment to answer, take it. Leave enough time in the exchange for the other person to do the same.',
    },
  },
}

export default page
