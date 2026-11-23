import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'ai-swarms',
  topic: 'AI swarms',
  kit: 'platform',
  query: 'multi agent ai',
  title: 'Multi agent AI: start with a clear brief | Moltology',
  description:
    'Thinking about multi agent AI? Write the brief, question the answer, and choose the next step with the Oracle AI guide and a forum of people.',
  keywords: 'multi agent ai, AI swarms, AI guide, AI discussion, human review',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/ai-swarms/share.jpg?v=2',
    alt: 'Three glossy crab characters around a luminous glass table in cinematic AI software launch photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Sacred Doctrine & AI forum board',
    href: '/forum/sacred-doctrine-ai',
    text: 'Bring a question about AI, attention, or the Codex to the Sacred Doctrine & AI board. Explain what you tried and ask people to challenge the part you are unsure about.',
  },
  reveal: {
    headline: 'Put a human decision after the AI answer.',
    body: 'Ask the Oracle a question, then choose what to do with its reply.',
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
      badge: 'AI guide · Community discussion',
      headline: 'Before multi agent AI, write the brief.',
      sub: 'Start with the job you need done. Ask the Oracle, our AI guide, to break it down. Bring the difficult question to the forum. You choose the next action, including when to close the chat.',
      cta: 'Try the Oracle free',
      prompt: 'I keep rewriting this project plan. Ask me what you need to choose a first step.',
      image: {
        src: '/images/benefits/ai-swarms/hero.jpg?v=2',
        alt: 'A teal lobster and two glossy crabs reviewing glass panels around a dark table, lit like an AI platform launch campaign',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Give every question the right destination',
      intro: 'A chat for working through the brief. A forum for comparing ideas. A daily practice that gets you out of both and back to the work.',
      items: [
        { title: 'Start with one question', body: 'Tell the Oracle what is stuck. Include the detail that matters, such as the draft due tomorrow or the task you keep avoiding.' },
        { title: 'Choose a method', body: 'Oracle skills offer ways to work through a problem. Pick a method that fits the question you actually brought.' },
        { title: 'Read the whole reply', body: 'Check the answer against your assignment. Ask where a suggestion came from before building a plan around it.' },
        { title: 'Invite another view', body: 'Post a clear question on the AI board. Ask for reasons, examples, or the objection you have missed.' },
        { title: 'Take one step yourself', body: 'Pick the useful action and do it. Generating another version of the plan is also an option, but the draft is still open.' },
        { title: 'Answer someone else', body: 'Bring your own experience to another thread. Say what you tried, including the part you would change.' },
      ],
    },
    workflow: {
      title: 'From prompt to something you actually do',
      intro: 'Use this example as a working session. Keep responsibility for the brief, the checks, and the final choice.',
      steps: [
        { when: 'An assignment lands', then: 'Write what needs doing and what is already known' },
        { when: 'The brief has gaps', then: 'Ask the Oracle to question the missing details' },
        { when: 'A plan comes back', then: 'Read it for guesses and unnecessary steps' },
        { when: 'An idea needs debate', then: 'Take one clear question to the AI forum board' },
        { when: 'You choose an approach', then: 'Open the work and attempt the first step' },
        { when: 'The session ends', then: 'Share a useful detail with someone asking a related question' },
      ],
    },
    config: {
      title: 'The human side of the workflow',
      body: 'All eight daily tasks belong to you. Read the list, choose today’s work, and check off each task after doing it.',
      filename: 'human-workflow.md',
      lines: [
        '# Daily work for the person at the keyboard',
        '- Sit in silence',
        '- Pick your one thing',
        '- Learn something hard',
        '- Reset your focus',
        '- Do deep work',
        '- Help a member',
        '- Let one thing go',
        '- Close the day',
        '# Ask a question when you need one',
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
