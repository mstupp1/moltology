import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'faith',
  topic: 'Faith',
  kit: 'retreat',
  variant: 'moss-monastery',
  query: 'faith without religion',
  title: 'Faith without religion, on your own terms | Moltology',
  description:
    'Make room for faith without religion. Read a shared passage, choose a promise worth keeping and bring your questions to a quiet daily practice.',
  keywords: 'faith without religion, personal values, secular rituals, trust, shared practice',
  indexed: true,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/faith/share.jpg?v=2',
    alt: 'A lobster beside a linen journal and a tea cup in softly lit wellness retreat photography',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Covenant of the Convergence',
    href: '/codex/scr-002#verse-8',
    text: 'The covenant puts a boundary around belonging: each member keeps their independence. Read it, then choose a promise for your own day. Give the person beside you the same room to choose, disagree or leave.',
  },
  reveal: {
    headline: 'Bring your questions. Choose your commitments.',
    body: 'Put one value into something you do today.',
    screenshot: 'forum',
  },
  related: ['spirituality', 'commitment', 'empathy'],
  faqs: [
    {
      question: 'Can you have faith without religion?',
      answer:
        'Yes. Faith can mean trust in a person, a value or a commitment, alongside uncertainty about larger questions. Start with something you care about, such as being dependable, and choose an action that expresses it.',
    },
    {
      question: 'Where does faith without religion find meaning?',
      answer:
        'Meaning can come from relationships, useful work, learning or care for a place. You choose what deserves your attention. In Moltology, helping a member is one small way to put that choice into practice.',
    },
    {
      question: 'Does a daily ritual need a spiritual belief?',
      answer:
        'No. A ritual can simply mark a moment you want to treat with care, like reading before breakfast or ending work deliberately. Keep the action clear enough to repeat, and use your own words for why it matters.',
    },
    {
      question: 'How do I choose values to live by?',
      answer:
        'Look at a choice you already face. If honesty matters, practice saying what you can actually finish when someone asks for a favor. Write the value beside that action; a grand statement can wait.',
    },
    {
      question: 'Should I agree with everything in a shared reading?',
      answer:
        'No. Read the whole passage and name the part you question. The Codex has its own language and story. The daily tasks are things to do, not things to believe.',
    },
    {
      question: 'What can I do when my beliefs change?',
      answer:
        'Give yourself time to put the change into words. Talk with someone who can listen without deciding for you. Keep any ordinary commitments you still mean, and revisit the ones you no longer do.',
    },
  ],
  content: {
    hero: {
      kicker: 'Quiet mornings · open questions',
      headline: 'Faith without religion, on your own terms.',
      sub: 'Leave room for what you do not know. Start with what you care about. Moltology invites you to read, sit quietly and keep one small promise in the middle of an ordinary day. Come as you are. Joining is free.',
      cta: 'Make time for your practice',
      image: {
        src: '/images/benefits/faith/hero.jpg?v=2',
        alt: 'A lobster seated beside still water at sunrise in warm, spacious wellness retreat photography',
        width: 1600,
        height: 1000,
      },
    },
    intention: {
      quote: 'No member is conscripted, no member is kept, and any member may surface at any time without their record being touched.',
      source: { label: 'The Covenant of the Convergence', href: '/codex/scr-002#verse-8' },
    },
    rhythm: {
      title: 'Give your values a place in the day',
      intro: 'The eight daily tasks ask for ordinary acts of attention. Bring a value to each one: honesty at breakfast, patience with a difficult lesson, kindness in a reply. A special notebook is entirely optional.',
      items: [
        { time: 'Before breakfast', title: 'Sit in silence', body: 'Leave the phone face down while you ask what matters to you today.' },
        { time: 'As work begins', title: 'Pick your one thing', body: 'Choose a task that belongs beside the value you wrote down.' },
        { time: 'With your reading', title: 'Learn something hard', body: 'Stay with a challenging idea, including the part you do not agree with.' },
        { time: 'Around lunch', title: 'Reset your focus', body: 'Close the feed you opened out of habit and name your next action.' },
        { time: 'In a quiet block', title: 'Do deep work', body: 'Give the promise on your desk your attention, with other conversations put aside.' },
        { time: 'During a forum visit', title: 'Help a member', body: 'Offer a useful answer without asking anyone to share your view of life.' },
        { time: 'As evening arrives', title: 'Let one thing go', body: 'Set down the need to have an answer to every large question tonight.' },
        { time: 'Before turning in', title: 'Close the day', body: 'Mark the tasks you did and leave the unfinished ones honestly unfinished.' },
      ],
    },
    itinerary: {
      title: 'An invitation to begin',
      items: [
        { day: 'Settle in', title: 'Choose a comfortable spot', body: 'Pull up a chair by the window. Leave your inbox closed for the reading.' },
        { day: 'Read', title: 'Start with the covenant', body: 'Look at what the passage says about belonging and the right to leave.' },
        { day: 'Write', title: 'Name a value', body: 'Pick something you want to practice. Care, honesty and curiosity are places to start.' },
        { day: 'Act', title: 'Keep a small promise', body: 'Make the call you offered to make. Ask the question you have been avoiding.' },
        { day: 'Return', title: 'Leave the question open', body: 'Read your note again when you next sit down. Change the wording if needed.' },
      ],
    },
    carry: {
      title: 'Leave a little space in your notebook',
      items: [
        'A value you chose for yourself',
        'A promise small enough to keep',
        'A question with room around it',
        'Respect for someone else’s answer',
      ],
      image: {
        src: '/images/benefits/faith/carry.jpg?v=2',
        alt: 'A crab writing at a pale wooden table beside folded linen in natural retreat editorial light',
        width: 1280,
        height: 960,
      },
    },
  },
}

export default page
