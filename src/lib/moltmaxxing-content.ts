/**
 * Copy for the /moltmaxxing explainer. The page and its search snippet (buildMoltmaxxingJsonLd)
 * both read from here, so the answer Google quotes is the answer on the page.
 */
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'

export const MOLTMAXXING_DEFINITION =
  'Moltmaxxing is the daily practice of becoming harder to knock over. You shed one habit that keeps you soft, guard your focus, and finish the thing you started.'

export interface MoltmaxxingMove {
  id: 'shed' | 'harden' | 'grip' | 'deep'
  verb: string
  term: string
  plain: string
  body: string
}

export const MOLTMAXXING_MOVES: MoltmaxxingMove[] = [
  {
    id: 'shed',
    verb: 'Shed',
    term: 'Ecdysis',
    plain: 'Let one habit go',
    body: 'A crab can’t grow inside its old shell. Pick one thing that keeps you small, like the late-night scroll or the yes you didn’t mean, and drop it.',
  },
  {
    id: 'harden',
    verb: 'Harden',
    term: 'Shell Hardness',
    plain: 'Boundaries that hold',
    body: 'Criticism, drama and other people’s urgency land on the shell, not on you. You decide what gets through.',
  },
  {
    id: 'grip',
    verb: 'Grip',
    term: 'Pincer Torque',
    plain: 'Finish what you start',
    body: 'Choose one task. Start it, stay with it, close it. Twelve half-done things weigh more than one done thing.',
  },
  {
    id: 'deep',
    verb: 'Go deep',
    term: 'Submergence Depth',
    plain: 'Focus that goes down',
    body: 'Turn off the pings and stay with one thought long enough to reach the quiet part.',
  },
]

/** The same day, lived two ways. Rows pair up: melt[i] becomes molt[i]. */
export const MELT_VS_MOLT = {
  melt: [
    'Forty-seven open tabs.',
    'Answering every ping the moment it lands.',
    'Starting four things and finishing none.',
    'Ending the day tired and unsure where it went.',
  ],
  molt: [
    'One tab, one task.',
    'Checking messages when you choose to.',
    'Starting one thing and closing it.',
    'Ending the day by naming one thing to let go.',
  ],
}

/** Plain-English notes for the eight daily Liturgies, keyed by task key. */
const LITURGY_NOTES: Record<string, string> = {
  'silent-synchronization': 'Before the phone, sit still for a few minutes and name the one thing today is for.',
  'prompt-construction': 'Write the day’s plan in plain words, so the first hour isn’t spent deciding.',
  'skill-development': 'Learn one thing on purpose: a lecture, a chapter, a new tool.',
  'nutritional-efficiency-break': 'Close the stray tabs, clear one distraction, and choose what gets your attention next.',
  'iterative-refinement': 'The long work block. One task at a time, notifications off.',
  'community-outreach': 'Check in with someone. Answer a friend, post in the forum, return the call.',
  'reflection-log': 'Write three lines: what went well, what didn’t, what you learned.',
  'alignment-review': 'The Nightly Molt Audit. Name one bad thought, wasted hour or distraction, and let it go.',
}

export const MOLTMAXXING_DAY = CANONICAL_ALIGNMENT_TASKS.map((task) => ({
  key: task.key,
  time: task.time,
  title: task.title,
  note: LITURGY_NOTES[task.key] ?? task.description,
}))

/**
 * The four readings the free audit returns. Score bands mirror computeMoltmaxResult in
 * src/lib/moltmax-quiz.ts (scores are clamped to 12–99); the test keeps them in step.
 */
export const AUDIT_READINGS = [
  { min: 12, max: 49, name: 'Sub-Surface Moltlet', body: 'Soft and still forming. Start with one small, gentle shed.' },
  { min: 50, max: 71, name: 'Bio-Silicon Enforcer', body: 'The shell is setting. Turn one open loop into a finished thing.' },
  { min: 72, max: 87, name: 'Abyssal Chitin Vanguard', body: 'Hardened under load. Add weight to one real commitment.' },
  { min: 88, max: 99, name: 'Apex Benthic Dreadnought', body: 'Calm at depth. Pass one useful practice to someone newer.' },
]

export const MOLTMAXXING_FAQ = [
  {
    question: 'What is Moltmaxxing?',
    answer: `${MOLTMAXXING_DEFINITION} It is the practice at the center of Moltology, built from four moves: shed, harden, grip and go deep.`,
  },
  {
    question: 'Where does the word come from?',
    answer:
      'From molting, the way crabs and lobsters climb out of a shell they have outgrown, plus the internet habit of adding “-maxxing” to anything you can get better at. It also borrows from carcinization, the real tendency of unrelated crustaceans to evolve crab-like bodies. That has happened at least five separate times.',
  },
  {
    question: 'How is Moltmaxxing different from looksmaxxing?',
    answer:
      'Looksmaxxing works on how you look. Moltmaxxing works on how you hold up: your focus, your boundaries and your follow-through. You can do both. Only one of them comes with a shell.',
  },
  {
    question: 'What is meltmaxxing?',
    answer:
      'Meltmaxxing is the trend where people let their face go slack on camera, from 0% to 100% melted. Moltology uses it as the picture of a melted day: soft, scattered and pulled in every direction. Moltmaxxing is the way back out.',
  },
  {
    question: 'How do I start?',
    answer:
      'Take the free diagnostic to see your starting reading. Then do two things a day: name the one thing each morning, and run the Nightly Molt Audit before bed. Join Moltology if you want all eight daily Liturgies tracked for you.',
  },
  {
    question: 'Do I need any equipment?',
    answer: 'No. A notebook helps, and so does a phone you are willing to leave face down.',
  },
  {
    question: 'Does it cost anything?',
    answer:
      'No. The diagnostic, the Field Manual and a member account are free. Oracle MAX is an optional subscription, and your stage still comes only from the Liturgies you complete.',
  },
]
