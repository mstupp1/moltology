import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'focus',
  topic: 'Focus',
  kit: 'clinic',
  query: 'how to focus better',
  title: 'How to focus better: give one task a turn | Moltology',
  description:
    'Learn how to focus better with a simple work routine: pick one task, mute routine messages and set a stopping time. Read the plan and begin where you are.',
  keywords: 'how to focus better, deep work, distractions at work, single tasking, focus routine',
  indexed: false,
  updated: '2026-11-22',
  disclaimer:
    'Moltology does not diagnose or treat ADHD; see a qualified professional if focus problems are severe or disrupt your daily life.',
  shareImage: {
    src: '/images/benefits/focus/share.jpg?v=2',
    alt: 'A lobster beside a single open document on a tidy desk, in warm telehealth editorial photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Isolation Protocols, for Do deep work',
    href: '/codex/scr-031',
    text: 'The Isolation Protocols ask you to arrange the work before starting it. Choose one objective, decide whose urgent calls can reach you and set a timer for the end. Do deep work is the daily task that puts those instructions into practice.',
  },
  reveal: {
    headline: 'Give the draft its turn.',
    body: 'Open Do deep work with one job already chosen.',
    screenshot: 'dashboard',
  },
  related: ['clarity', 'intelligence', 'technique'],
  faqs: [
    {
      question: 'How can I focus better when my phone keeps interrupting?',
      answer:
        'Put your phone out of reach and mute routine notifications before you start. Keep an emergency route open for anyone who depends on you. In Moltology, the Isolation Protocols ask you to make those choices before opening the work.',
    },
    {
      question: 'How do I focus better on boring work?',
      answer:
        'Choose a small, clear piece of the job. “Check the first section” gives you somewhere to begin; “sort everything out” does not. Set a stopping time and work on that piece until then, even if the subject remains thoroughly ordinary.',
    },
    {
      question: 'What does single tasking mean?',
      answer:
        'Single tasking means working on one task at a time. A reference beside your draft can belong to the same task; replying to an unrelated chat is another task. Keep the materials you need and close the rest.',
    },
    {
      question: 'Can I do deep work if I need to stay available?',
      answer:
        'Yes. Tell people when you plan to check messages, and agree on a way to reach you for something urgent. Choose a work session that fits your responsibilities, as the protocol asks.',
    },
    {
      question: 'Where should I start when a project feels too big?',
      answer:
        'Write the next action you can actually do. Open the file, label the first diagram or draft the opening paragraph. Use Pick your one thing to name the priority, then keep the work session about that action.',
    },
    {
      question: 'When should I take a break from a focused task?',
      answer:
        'Use a stopping time chosen before the session, and pause sooner if you need to. Leave a note about where to restart. Then check the messages you held and step away from the work before choosing another session.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Focus routine · available online',
      headline: 'Focus better, one task at a time.',
      sub: 'The same email, six readings later. Start smaller: choose the reply you need to write, put your phone aside and stay with that job. Moltology has a daily task and a written plan for the setup.',
      checks: ['A clear place to start', 'Use the tools you have', 'Emergency calls stay open'],
      cta: 'Set up your focus routine',
      image: {
        src: '/images/benefits/focus/hero.jpg?v=2',
        alt: 'A lobster working at a simple desk in warm daylight, styled as a calm online care campaign portrait',
        width: 1024,
        height: 1280,
      },
    },
    trust: ['Free membership', 'No equipment to order', 'Written work protocol', 'Set your own schedule'],
    signs: {
      title: 'A busy screen. An untouched draft.',
      intro: 'Look at what keeps taking the next turn. Choose one interruption to handle before your next work session.',
      items: [
        'You check chat while the file is still opening',
        'A quick search ends on a different subject',
        'You switch projects whenever a paragraph gets difficult',
        'Every notification arrives with the same importance',
        'You reach lunchtime with the first sentence still waiting',
      ],
    },
    steps: {
      title: 'How to begin a work session',
      items: [
        { title: 'Name the job', body: 'Write what this session is for. Choose a piece of work you can point to, such as drafting a reply or checking a table.' },
        { title: 'Set the conditions', body: 'Keep the references you need. Mute everyday messages, leave urgent contacts reachable and choose when to stop.' },
        { title: 'Work, then check in', body: 'Stay with the chosen job. When the timer ends, reopen your messages and tick Do deep work after doing the practice.' },
      ],
    },
    plans: {
      title: 'Pick the part that needs attention',
      intro: 'Read a short instruction for the sticking point. You can use the same readings again when the next project starts.',
      items: [
        { name: 'Too much on the list', tag: 'Choose first', body: 'Start with Pick your one thing. Name today’s priority before arranging tabs, notebooks or a very convincing new folder system.', href: '/codex/scr-030#verse-3' },
        { name: 'Too much coming in', tag: 'Prepare the desk', body: 'Follow the Isolation Protocols before Do deep work. Decide what gets through while you work and what waits until the end.', href: '/codex/scr-031' },
        { name: 'A loose end at lunch', tag: 'Pause and restart', body: 'Reset your focus asks you to clear one distraction. Answer the nagging message or close the spare tab, then choose what comes next.', href: '/codex/scr-030#verse-5' },
      ],
    },
    compare: {
      title: 'Give your next session a plan',
      us: 'One task chosen',
      them: 'Everything open',
      rows: [
        { label: 'First move', us: 'Write the next action', them: 'Check what arrived' },
        { label: 'Phone', us: 'Urgent contacts allowed', them: 'All alerts welcome' },
        { label: 'Browser', us: 'Keep the working references', them: 'Keep every possible detour' },
        { label: 'Stop time', us: 'Set before starting', them: 'Whenever something pings' },
      ],
    },
  },
}

export default page
