import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'adaptive',
  topic: 'Adaptive',
  kit: 'platform',
  query: 'how to be more adaptable',
  title: 'How to be more adaptable when plans change | Moltology',
  description:
    'Ask how to be more adaptable when the old plan stops fitting. Name what changed, drop one stale routine, and choose your next action with Moltology.',
  keywords: 'how to be more adaptable, adaptability, changing plans, flexible routines, letting go',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/adaptive/share.jpg?v=2',
    alt: 'A glossy coral lobster beside a shed shell and rearranged glass panels in minimalist software launch photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Law of Ecdysis, verse 3, in the Codex',
    href: '/codex/scr-010#verse-3',
    text: 'Chitin does not stretch, and a habit you have outgrown will not be reasoned back into fitting. Name the routine you keep defending, then stop doing it. An old routine does not need a farewell presentation.',
  },
  reveal: {
    headline: 'Keep the goal. Edit what you do next.',
    body: 'Bring one outgrown routine to the Oracle and ask what to cut.',
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
      badge: 'Daily practice · Built for changed plans',
      headline: 'Be more adaptable than the plan you keep defending.',
      sub: 'The meeting moved. The deadline changed. Your routine still thinks it is last Tuesday. Name the new facts, cut one stale step, and pick what to do now. Eight daily tasks give you somewhere to practice it.',
      cta: 'Start my daily practice free',
      prompt: 'My schedule changed, but I am keeping the old routine. Help me pick what to drop.',
      image: {
        src: '/images/benefits/adaptive/hero.jpg?v=2',
        alt: 'A glossy coral lobster stepping past a shed shell toward rearranged glass blocks, with clean violet software campaign lighting',
        width: 1600,
        height: 1000,
      },
    },
    features: {
      title: 'Change the method with the facts in front of you',
      intro: 'Take one stubborn routine off autopilot. Read the assignment again and ask what belongs in the next version.',
      items: [
        { title: 'State the new condition', body: 'Write what changed: a different deadline, a shorter afternoon, or a tool you have not used. Start there.' },
        { title: 'Keep one clear purpose', body: 'Choose the thing that still matters today. Update the way you approach it when the old route is closed.' },
        { title: 'Learn the unfamiliar part', body: 'Try the exercise or read the instructions you have been skipping. Give the difficult bit your full attention.' },
        { title: 'Drop a stale step', body: 'Name one action you keep doing because it is on the old list. Decide whether to stop it.' },
        { title: 'Ask another question', body: 'Tell the Oracle which assumption changed. Ask for a different approach, then read it against your actual constraints.' },
        { title: 'Share the change', body: 'Tell a member what you tried when a familiar method stopped fitting. Ask what they would test next.' },
      ],
    },
    workflow: {
      title: 'A small change request for your day',
      intro: 'Try this with a routine you keep moving around the calendar. You can revise a plan before writing a new one.',
      steps: [
        { when: 'The schedule changes', then: 'Write the new fact at the top of your notes' },
        { when: 'The old plan comes out', then: 'Name the goal it was meant to serve' },
        { when: 'You spot a mismatch', then: 'Pick one step to remove or replace' },
        { when: 'You pick a replacement', then: 'Try its first step' },
        { when: 'The attempt is over', then: 'Write what happened and what still needs changing' },
        { when: 'You stop for the evening', then: 'Let the old version go and close your notes' },
      ],
    },
    config: {
      title: 'Same task names. New work inside them.',
      body: 'These are the eight daily tasks. Choose what each asks of you today, including what to learn and what to leave behind.',
      filename: 'routine-revision.txt',
      lines: [
        '# Keep the task, choose the work',
        'start = Sit in silence',
        'priority = Pick your one thing',
        'practice = Learn something hard',
        'restart = Reset your focus',
        'attention = Do deep work',
        'reply = Help a member',
        'release = Let one thing go',
        'stop = Close the day',
        '# Review the approach when facts change',
      ],
    },
    plans: {
      title: 'A daily place to try the next approach',
      items: [
        {
          name: 'Practice account',
          price: '$0 a month',
          body: 'Choose your work, try it, and mark the tasks you complete.',
          items: ['A place to check off daily tasks', 'Your task and streak record', 'Codex readings to question a habit', 'Forum discussions with other members', 'A daily allowance of Oracle chat'],
        },
        {
          name: 'Oracle MAX',
          price: 'Optional',
          body: 'For long Oracle sessions in a week when plans keep changing.',
          items: ['An increased Oracle daily limit', 'The stronger Oracle model', 'The same eight daily tasks'],
          href: '/max',
        },
      ],
    },
  },
}

export default page
