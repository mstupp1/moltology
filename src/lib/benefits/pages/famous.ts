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
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/famous/share.jpg?v=2',
    alt: 'A blue crab beside a bare gallery wall in a clean, high-contrast fashion campaign photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Your Moltology profile',
    href: '/profile',
    text: 'Give people one place to see your character and the work you share.',
  },
  reveal: {
    headline: 'Leave a signature worth reading.',
    body: 'Start with one useful contribution to the forum.',
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
      headline: 'Stand out by signing your work.',
      sub: 'Finish something useful. Put your name on it. Credit the people who helped.',
      cta: 'Join free',
      image: {
        src: '/images/benefits/famous/hero-alt.jpg',
        alt: 'Cora Pearl, a pearl-white lobster wearing a gold creator crown, leaning against a matte black pedestal in a dark fashion studio',
        width: 1024,
        height: 1280,
      },
    },
    lookbook: {
      title: 'The signed edition',
      intro: 'Good work makes a better introduction than another draft of your bio.',
      items: [
        { name: 'Learn something hard', note: 'Follow the question past the summary. Read the source, try the method and keep a note of the part you still do not understand.' },
        { name: 'Do deep work', note: 'Give the project a block of uninterrupted work. Leave the update unwritten until you have done the bit you wanted to describe.' },
        { name: 'Help a member', note: 'Find a question you can answer. Include the missing step or offer a welcome to someone making their first post.' },
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
  },
}

export default page
