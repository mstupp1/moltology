import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'generational',
  topic: 'Generational',
  kit: 'ledger',
  variant: 'heritage-treasury',
  query: 'breaking generational curses',
  title: 'Breaking generational curses, habit by habit | Moltology',
  description:
    'Start breaking generational curses with the everyday habits you learned. Pick what to keep, question an old pattern and practice a different response.',
  keywords: 'breaking generational curses, inherited habits, family patterns, daily choices, personal boundaries',
  indexed: true,
  updated: '2026-11-27',
  disclaimer: 'Moltology offers daily practice, not therapy or financial advice.',
  shareImage: {
    src: '/images/benefits/generational/share.jpg?v=2',
    alt: 'A crab with an old notebook and a blank sheet in a restrained family wealth editorial photograph',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'What the Ledger Records',
    href: '/codex/scr-041#verse-6',
    text: 'Write down the thing you set aside, the work you did, or the help you offered.',
  },
  reveal: {
    headline: 'Make an entry of your own.',
    body: 'Try a different answer to one familiar request.',
    screenshot: 'dashboard',
  },
  related: ['emotional', 'commitment', 'financial'],
  faqs: [
    {
      question: 'What does breaking generational curses mean in everyday life?',
      answer:
        'It means choosing to change patterns passed through a family. Here, the focus is everyday habits: always saying yes, leaving work open through dinner or avoiding something unfamiliar. Pick one action you can describe and practice a different response.',
    },
    {
      question: 'Does breaking generational curses mean leaving your family?',
      answer:
        'No. Changing a habit can sit alongside family ties and traditions you value. Be clear about the action you want to change, and keep the conversation about that action.',
    },
    {
      question: 'How do I spot a habit I learned growing up?',
      answer:
        'Look for a response that feels automatic. You might agree to a request before checking your calendar or apologize for taking a break. Write down one recent example, including what you said or did.',
    },
    {
      question: 'Can I keep family traditions while changing old patterns?',
      answer:
        'Yes. Name what you want to keep as carefully as what you want to change. Keep calling on Sundays if that matters to you, and practice saying when you need to end the call.',
    },
    {
      question: 'Which words can I use when I need time to answer a request?',
      answer:
        'Try: “Let me check my plans and get back to you.” Give a time for your answer if you can. Then check the calendar and reply, instead of leaving the request hanging.',
    },
    {
      question: 'When is a daily review useful for changing a family habit?',
      answer:
        'Use it after a specific moment you want to revisit. Write what happened, what you did and what you want to try next time. In Moltology, Let one thing go asks you to name something from today and set it down.',
    },
  ],
  content: {
    hero: {
      eyebrow: 'Your legacy · Your daily choices',
      headline: 'Breaking generational curses starts with the defaults.',
      sub: 'Keep the Sunday recipe. Rethink the automatic yes.',
      cta: 'Start a free account',
      image: {
        src: '/images/benefits/generational/hero.jpg?v=2',
        alt: 'A blue crab at a green writing desk with stacked notebooks in a softly lit private banking editorial portrait',
        width: 1280,
        height: 960,
      },
    },
    features: {
      title: 'Change one entry',
      items: [
        { title: 'A quiet opening', body: 'Sit in silence before the messages arrive. Look back at yesterday and name the moment you want to handle differently when it comes up again.' },
        { title: 'A priority of your own', body: 'Pick your one thing before filling every gap with someone else’s requests. Check your responsibilities, then name the work you intend to start.' },
        { title: 'A place to ask', body: 'Use the forum to discuss a habit you are practicing. Ask about your own next step and keep relatives’ names and personal stories out of the post.' },
        { title: 'A finish you can name', body: 'Close the day after your review. Put the notebook away, even with work left over. Practice ending the session you started.' },
      ],
    },
    statement: {
      title: 'A day of your own',
      intro: 'A few lines to record choices you made for yourself.',
      rows: [
        { when: 'Before the group chat', label: 'Sit in silence', amount: '+1 entry' },
        { when: 'Check your calendar', label: 'Pick your one thing', amount: '+1 entry' },
        { when: 'Offer a welcome', label: 'Help a member', amount: '+1 entry' },
        { when: 'Name today’s habit', label: 'Let one thing go', amount: '+1 entry' },
      ],
    },
  },
}

export default page
