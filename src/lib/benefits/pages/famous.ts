import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'famous',
  topic: 'Famous',
  kit: 'atelier',
  variant: 'noir',
  query: 'how to stand out',
  title: 'How to stand out: put your name to it | Moltology',
  description:
    'Thinking about how to stand out? Edit your Moltology profile, share a useful example and take care with the work you put your name beside.',
  keywords: 'how to stand out, public profile, personal style online, useful contributions, community habits',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/famous/share.jpg?v=2',
    alt: 'A blue crab beside a bare gallery wall in a clean, high-contrast fashion campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Your Moltology profile',
    href: '/profile',
    text: 'Open your profile and check the details you put in public. Read them as an introduction to someone you have yet to meet. Then go to a discussion you care about and add something useful under that name.',
  },
  reveal: {
    headline: 'Choose what carries your name.',
    body: 'Check your profile, then answer a question in the forum.',
    screenshot: 'dashboard',
  },
  related: ['community', 'communication', 'charisma'],
  faqs: [
    {
      question: 'How do I stand out in an online community?',
      answer:
        'Start by learning what people there are working on. Answer an open question with a clear example, share a relevant source or describe a mistake someone else could avoid. Read the replies already posted before adding yours.',
    },
    {
      question: 'How can I stand out when everyone posts the same advice?',
      answer:
        'Give the detail the general advice leaves out. Name the step you tried, show a short example and say where you got stuck. Leave a claim out if you cannot explain where it came from.',
    },
    {
      question: 'Which details should I put on a public profile?',
      answer:
        'Choose a name and description you are comfortable sharing publicly. Mention an interest or project you actually spend time on. Keep private contact details and information about other people out of the introduction.',
    },
    {
      question: 'Is daily posting necessary in an online community?',
      answer:
        'No. Post when you have something relevant to add and time to read the discussion. One useful reply does more for your name than five posts nobody needed.',
    },
    {
      question: 'When should I share a project I am still working on?',
      answer:
        'Share it when you have a clear question for the group and the board permits it. Show the part you want feedback on, explain what you have tried and credit anyone who helped. Read the response before defending every choice.',
    },
    {
      question: 'Can I have a recognizable style without oversharing?',
      answer:
        'Yes. Your interests, examples and way of explaining things can be personal without including private events. Choose a few subjects you enjoy discussing and keep the personal details you want to keep.',
    },
  ],
  content: {
    hero: {
      season: 'Signed edition · Your own work',
      headline: 'How to stand out? Put your name to something.',
      sub: 'The bio can wait until you have finished the thing. Make the draft, share the useful detail and credit the person who helped. Moltology gives your public profile a place beside your activity. Decide what you want to put there.',
      cta: 'Join and make an introduction',
      image: {
        src: '/images/benefits/famous/hero-alt.jpg',
        alt: 'Cora Pearl, a pearl-white lobster wearing a gold creator crown, leaning against a matte black pedestal in a dark fashion studio',
        width: 1024,
        height: 1280,
      },
    },
    manifesto: [
      'Put the example in before the announcement.',
      'Show the paragraph you rewrote, the question you solved or the detail someone else missed.',
      'Add the credit before you press send.',
    ],
    lookbook: {
      title: 'Work with your name on it',
      intro: 'A public profile starts with an introduction. The eight daily tasks ask for work beyond that introduction: study, a clear priority, focused time and a hand for another member. Keep something on your desk besides a draft of the bio.',
      items: [
        { name: 'Sit in silence', note: 'Begin away from the audience. Sit quietly and look at yesterday before opening the thread to check who replied.' },
        { name: 'Pick your one thing', note: 'Choose the work you want to do today and start. Write the first paragraph before spending the morning choosing a title.' },
        { name: 'Learn something hard', note: 'Follow the question past the summary. Read the source, try the method and keep a note of the part you still do not understand.' },
        { name: 'Reset your focus', note: 'Put the feed down at noon. Clear a distraction and decide what needs doing next, even if there is nothing to announce about it.' },
        { name: 'Do deep work', note: 'Give the project a block of uninterrupted work. Leave the update unwritten until you have done the bit you wanted to describe.' },
        { name: 'Help a member', note: 'Find a question you can answer. Include the missing step or offer a welcome to someone making their first post.' },
        { name: 'Let one thing go', note: 'Drop a small argument from today. Your last reply can stay your last reply, even when someone else gets the final word.' },
        { name: 'Close the day', note: 'Check off the work and finish. Close the discussion tab along with the draft; replies can wait until you return.' },
      ],
    },
    campaign: {
      quote: 'The announcement can be short. Give the work the space.',
      credit: 'Studio policy · Signed work',
      image: {
        src: '/images/benefits/famous/look.jpg?v=2',
        alt: 'A blue crab at a writing desk in a stark monochrome magazine editorial',
        width: 1024,
        height: 1280,
      },
    },
    care: {
      title: 'Before publication',
      rows: [
        { label: 'Signature', value: 'Your public profile' },
        { label: 'Opening', value: 'Say what you work on' },
        { label: 'Submission', value: 'An example worth sharing' },
        { label: 'Credits', value: 'Include everyone who helped' },
        { label: 'Edit', value: 'Cut the repeated advice' },
        { label: 'Access', value: 'Membership is free' },
      ],
      footnote: 'Keep your introduction current as your interests change. Before sharing work, read the board rules and check the names in your credits. If somebody asks how you did a step, answer the question before posting your next announcement.',
    },
  },
}

export default page
