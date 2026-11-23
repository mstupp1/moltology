import type { BenefitPage } from '../types'

const page: BenefitPage = {
  slug: 'self-help-books',
  topic: 'Self help Books',
  kit: 'seminar',
  query: 'best self help books',
  title: 'Best self help books: put a chapter to work | Moltology',
  description:
    'Looking for the best self help books? Open the Codex, pick one passage, and put down the highlighter. Then do what it says, with a daily practice to hold it.',
  keywords: 'best self help books, self improvement reading, Codex, daily reading practice',
  indexed: false,
  updated: '2026-11-22',
  shareImage: {
    src: '/images/benefits/self-help-books/share.jpg?v=2',
    alt: 'A rust-red lobster beside a clothbound book on a navy seminar lectern, warm publisher portrait lighting',
    width: 1200,
    height: 630,
  },
  hook: {
    label: 'The Codex, Moltology’s book of readings',
    href: '/codex',
    text: 'Read a passage in the Codex, then do the thing it asks. Start with the Daily Shedding Routine for the daily tasks, or the Nightly Molt Audit for something to put down before bed.',
  },
  reveal: {
    headline: 'Put a bookmark in it. Use what you read.',
    body: 'Take one instruction from the Codex into your next ordinary day.',
    screenshot: 'forum',
  },
  related: ['commitment', 'truth', 'answers'],
  faqs: [
    {
      question: 'Which are the best self help books for beginners?',
      answer:
        'The best one for a beginner is a short book about one problem you can name. Read a sample and look for clear exercises, sensible limits, and claims you can check. The Codex offers short readings about attention, boundaries, and daily work.',
    },
    {
      question: 'How do I choose the best self help books for my goals?',
      answer:
        'Choose by the work you want to do. For an unfinished project, look for concrete instructions about starting and protecting work time. Keep a note of the exercise you plan to use before adding another title to your reading list.',
    },
    {
      question: 'Should I read several self improvement books at once?',
      answer:
        'You can, but pick one exercise to practice at a time. Keep other ideas in a separate note. A bedside stack does not need a project manager.',
    },
    {
      question: 'What should I write down after reading a chapter?',
      answer:
        'Write the instruction in your own words and name where you plan to use it. For example, put the phone in another room before opening your draft. Keep quotations separate from your own notes.',
    },
    {
      question: 'Does the Codex need to be read in order?',
      answer:
        'No. You can open an individual scripture and read its verses directly. Choose a passage that fits the question in front of you, then read the surrounding text before applying a single line.',
    },
    {
      question: 'When is it time to stop reading and take action?',
      answer:
        'Stop when you have an instruction you understand and can attempt. Close the chapter and do that exercise before searching for another explanation. In Moltology, Pick your one thing asks you to name today’s priority and start.',
    },
  ],
  content: {
    hero: {
      kicker: 'The reading room · open to everyone',
      headline: 'The best self help books deserve more than a highlighter.',
      sub: 'You have marked the paragraph. Now close the book and use it. Moltology pairs the Codex with a daily practice: choose the work, give it your attention, and call it a day when the day is done.',
      cta: 'Begin your practice free',
      image: {
        src: '/images/benefits/self-help-books/hero.jpg?v=2',
        alt: 'A rust-red lobster at a gold-trimmed lectern holding an open book, navy backdrop and book-launch spotlight',
        width: 1024,
        height: 1280,
      },
      book: { title: 'The Codex', subtitle: 'Read a little. Put it to work.', author: 'Readings from Moltology' },
    },
    promise: {
      title: 'Bring a pencil. Leave room for the work.',
      items: [
        'Choose a question before you open the contents',
        'Read the whole passage around the line you underline',
        'Write one instruction on paper beside your desk',
        'Try the exercise before collecting another recommendation',
        'Return with a note about what you actually did',
      ],
    },
    chapters: {
      title: 'From the reading chair to the rest of your day',
      items: [
        { title: 'Before the first page', body: 'Leave the feed closed while you sit quietly. Give the question you brought a little room before taking in more words.' },
        { title: 'An instruction worth trying', body: 'Choose one action from your reading. Put it beside the task you have already decided matters today.' },
        { title: 'The difficult paragraph', body: 'Stay with a passage you do not understand. Look up the unfamiliar word and explain the idea in your own notebook.' },
        { title: 'Pause the collection', body: 'Close the recommendation tab at midday. Clear one distraction from the place where you intend to work.' },
        { title: 'Off the page', body: 'Open the actual assignment. Put your attention on that work instead of another article about how to begin it.' },
        { title: 'A useful reply', body: 'Answer a member’s question with something you know. Say when you do not know, and leave the lecture unwritten.' },
        { title: 'The margin note', body: 'Name one thing to release from today. Leave the grand rewrite of your entire personality out of the exercise.' },
        { title: 'Book closed', body: 'Mark the tasks you completed and stop. An unfinished chapter can keep its bookmark until you choose to return.' },
      ],
    },
    passage: {
      quote: 'This is a log entry, not a courtroom.',
      source: { label: 'The Nightly Molt Audit, verse 3', href: '/codex/scr-032#verse-3' },
    },
    agenda: {
      title: 'Your reading-day workshop',
      intro: 'Use these moments alongside the daily tasks. No reading quota, speed-reading challenge, or pile of required purchases.',
      items: [
        { time: 'Before reading', title: 'Write the question at the top of the page' },
        { time: 'At the contents', title: 'Choose the passage that speaks to that question' },
        { time: 'Pencil out', title: 'Underline an instruction you can attempt' },
        { time: 'Book down', title: 'Give the exercise a place in your day' },
        { time: 'After doing', title: 'Note what happened, including what you skipped' },
        { time: 'Reading finished', title: 'Keep one bookmark and close the extra tabs' },
      ],
    },
  },
}

export default page
