import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'adaptive',
  topic: 'Adaptive',
  kit: 'platform',
  variant: 'crimson-grid',
  query: 'how to be more adaptable',
  title: 'How to be more adaptable when plans change | Moltology',
  description:
    'Ask how to be more adaptable when the old plan stops fitting. Name what changed, drop one stale routine, and choose your next action with Moltology.',
  keywords: 'how to be more adaptable, adaptability, changing plans, flexible routines, letting go',
  indexed: true,
  updated: '2026-11-27',
  shareImage: {
    src: '/images/benefits/adaptive/share.jpg?v=2',
    alt: 'A glossy coral lobster beside a shed shell and rearranged glass panels in minimalist software launch photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Law of Ecdysis',
    href: '/codex/scr-010#verse-3',
    text: 'Keep the useful part of a routine. Shed the part that stopped fitting.',
  },
  reveal: {
    headline: 'Ship the next version.',
    body: 'Try one change in today’s practice.',
    screenshot: 'oracle',
  },
  related: ['resilience', 'technique', 'freedom'],
  faqs: [
    {
      question: 'How do I learn to be more adaptable at work?',
      answer:
        'Start by naming what changed and what still needs doing. Ask which deadline, requirement, or resource is different before rewriting the plan. Choose one next action that fits the new facts and tell the people affected.',
    },
    {
      question: 'What does being more adaptable look like day to day?',
      answer:
        'It means changing your approach when the situation calls for it. Move the work block when the appointment moves, or ask for another explanation when a lesson does not click. Keep the purpose clear while changing the method.',
    },
    {
      question: 'When is it time to drop an old routine?',
      answer:
        'When the reason for it has changed. A commute habit may need replacing when you work from home. Ask what the routine is for now before keeping it out of loyalty to the calendar.',
    },
    {
      question: 'Does being adaptable mean saying yes to everything?',
      answer:
        'No. You can change a method and still keep a boundary. When a new request arrives, ask what it replaces and which commitment takes priority. Agree on the change before trying to fit both jobs into the same hour.',
    },
    {
      question: 'Can a fixed daily routine leave room for change?',
      answer:
        'Yes. A task can stay the same while its subject changes. Learn something hard might mean practicing a new tool today and working through a difficult chapter next time. Moltology keeps the task titles fixed; you choose the work.',
    },
    {
      question: 'Why am I defending a plan that no longer fits?',
      answer:
        'Often because of what you already put into it, a pull known as the sunk cost effect. Write down what you spent separately from what the next attempt needs. Then ask whether you would pick this plan today, starting from the current facts.',
    },
  ],
  content: {
    hero: {
      badge: 'Daily practice',
      headline: 'More adaptable by design.',
      sub: 'When the plan breaks, keep the goal and swap the next step.',
      cta: 'Create a free account',
      image: {
        src: '/images/benefits/adaptive/hero.jpg?v=2',
        alt: 'A glossy coral lobster stepping past a shed shell toward rearranged glass blocks, with clean violet software campaign lighting',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Revise the plan',
      intro: 'Keep the goal visible while you replace the step that broke.',
      items: [
        { title: 'State the new condition', body: 'Write what changed: a different deadline, a shorter afternoon, or a tool you have not used. Start there.' },
        { title: 'Keep one clear purpose', body: 'Choose the thing that still matters today. Update the way you approach it when the old route is closed.' },
        { title: 'Drop a stale step', body: 'Name one action you keep doing because it is on the old list. Decide whether to stop it.' },
      ],
    },
    workflow: {
      title: 'Change request',
      intro: 'Try it on the routine you keep rescheduling.',
      steps: [
        { when: 'The schedule changes', then: 'Write the new fact at the top of your notes' },
        { when: 'You spot a mismatch', then: 'Pick one step to remove or replace' },
        { when: 'You pick a replacement', then: 'Try its first step' },
      ],
    },
    plans: {
      title: 'A daily place to try the next approach',
      items: [
        {
          name: 'Practice account',
          price: '$0 a month',
          body: 'Choose your work, try it, and mark the tasks you complete.',
          items: ['Daily checklist', 'Activity history', 'Codex and forum', 'Limited Oracle chat'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional',
          body: 'For long Oracle sessions in a week when plans keep changing.',
          items: ['Higher Oracle limits', 'Stronger Oracle model'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
