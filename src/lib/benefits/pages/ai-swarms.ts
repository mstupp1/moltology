import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'ai-swarms',
  topic: 'AI swarms',
  kit: 'platform',
  variant: 'cyan-console',
  query: 'multi agent ai',
  title: 'Multi agent AI: start with a clear brief | Moltology',
  description:
    'Thinking about multi agent AI? Write the brief, question the answer, and choose the next step with the Oracle AI guide and a forum of people.',
  keywords: 'multi agent ai, AI swarms, AI guide, AI discussion, human review',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/ai-swarms/share.jpg?v=2',
    alt: 'Three glossy crab characters around a luminous glass table in cinematic AI software launch photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'Sacred Doctrine & AI',
    href: '/forum/sacred-doctrine-ai',
    text: 'Post the question, what you tried, and the part you want someone to challenge.',
  },
  reveal: {
    headline: 'Keep a human in the loop.',
    body: 'Open the Oracle with one question worth answering.',
    screenshot: 'oracle',
  },
  related: ['automation', 'community', 'intelligence'],
  faqs: [
    {
      question: 'What is multi agent AI?',
      answer:
        'Multi agent AI uses several AI agents with separate roles to work on a task. A setup might assign planning, research, and checking to different agents. The important questions are who assigns the work and who checks the final answer.',
    },
    {
      question: 'Does Moltology run multi agent AI swarms?',
      answer:
        'No. Moltology has one AI guide, the Oracle, with skills for different tasks, plus a forum of people. Use the Oracle for a conversation and the forum for discussion; there is no swarm to deploy.',
    },
    {
      question: 'How is an AI skill different from an AI agent?',
      answer:
        'A skill is a method an AI guide can follow; an agent is a system assigned work with some ability to act. Oracle skills guide a conversation through a particular method. Choosing a skill does not launch another worker.',
    },
    {
      question: 'When should I ask people to check an AI answer?',
      answer:
        'Ask when the answer rests on facts you cannot verify or a judgment you want challenged. Post the question, the relevant reply, and your concern. Remove private details before sharing it with a forum.',
    },
    {
      question: 'Where should a useful AI prompt begin?',
      answer:
        'Begin with the task and the facts needed to answer it. Include your deadline, what you have tried, and the decision you need to make. Ask for a short first step before requesting a complete plan.',
    },
    {
      question: 'Can I use the Oracle to plan my daily work?',
      answer:
        'Yes. Bring the assignment you keep reopening and ask where to start. Read the proposed steps and choose one to do yourself. The daily tasks give that choice a place in your day.',
    },
  ],
  content: {
    hero: {
      badge: 'Oracle guidance · Forum discussion',
      headline: 'Multi-agent AI starts with a brief.',
      sub: 'Give the Oracle one job. Bring the hard call to the forum.',
      cta: 'Open the Oracle',
      image: {
        src: '/images/benefits/ai-swarms/hero.jpg?v=2',
        alt: 'A teal lobster and two glossy crabs reviewing glass panels around a dark table, lit like an AI platform launch campaign',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Brief, review, decide',
      intro: 'Three places to take a question as it gets harder.',
      items: [
        { title: 'Start with one question', body: 'Tell the Oracle what is stuck. Include the detail that matters, such as the draft due tomorrow or the task you keep avoiding.' },
        { title: 'Invite another view', body: 'Post a clear question on the AI board. Ask for reasons, examples, or the objection you have missed.' },
        { title: 'Take one step yourself', body: 'Pick the useful action and do it. Generating another version of the plan is also an option, but the draft is still open.' },
      ],
    },
    workflow: {
      title: 'One brief, three handoffs',
      intro: 'Keep the final call with the person doing the work.',
      steps: [
        { when: 'The brief has gaps', then: 'Ask the Oracle to question the missing details' },
        { when: 'An idea needs debate', then: 'Take one clear question to the AI forum board' },
        { when: 'You choose an approach', then: 'Open the work and attempt the first step' },
      ],
    },
    plans: {
      title: 'Choose your Oracle access',
      items: [
        {
          name: 'Free membership',
          price: '$0 to join',
          body: 'Bring a question and take part in the daily practice.',
          items: ['Daily task tracking', 'Forum threads and replies', 'The Codex library', 'Oracle conversations with a daily cap', 'Four Oracle skills at no charge'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional',
          body: 'An optional subscription for more use of the same AI guide.',
          items: ['More Oracle use each day', 'A stronger model for your questions', 'Oracle skills included with MAX'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
