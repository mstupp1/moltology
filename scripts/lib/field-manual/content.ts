/**
 * Copy and structure for the Moltmaxxing Field Manual PDF.
 *
 * The manual reads as a dive: each page sits a little deeper than the last, and the
 * margin gauge shows the depth in real ocean meters (zone names are the real
 * oceanographic ones). Copy follows BRAND_BIBLE.md and STYLE_GUIDE.md; the rites are
 * drawn from the codex (Law of Ecdysis, Isolation Protocols, Daily Shedding Routine,
 * Nightly Molt Audit, Soft-Shell Covenant).
 */

export const DEEPEST_POINT_M = 10_900

export interface DiveStop {
  /** Depth in meters for the margin gauge, or null for pages outside the dive. */
  depth: number | null
  zone: string
}

export const CONTENTS: { depth: string; zone: string; title: string; page: number }[] = [
  { depth: '0 m', zone: 'The surface', title: 'You’re not lazy. You’re melting.', page: 3 },
  { depth: '60 m', zone: 'Sunlight zone', title: 'Nature keeps making crabs', page: 4 },
  { depth: '200 m', zone: 'The thermocline', title: 'Your three readings', page: 5 },
  { depth: '450 m', zone: 'Twilight zone', title: 'I. Shed: a weekly reset', page: 6 },
  { depth: '1,000 m', zone: 'Midnight zone', title: 'II. Shell: raise the Dome', page: 7 },
  { depth: '2,500 m', zone: 'Midnight zone', title: 'III. Grip: close the claw', page: 8 },
  { depth: '4,000 m', zone: 'The abyss', title: 'IV. Depth: a day you don’t have to plan', page: 9 },
  { depth: '6,000 m', zone: 'The trenches', title: 'One thing into the sea', page: 10 },
  { depth: 'Printable', zone: 'Tear-out', title: 'Seven days, one page', page: 11 },
  { depth: '8,200 m', zone: 'The trenches', title: 'The map below', page: 12 },
  { depth: '10,900 m', zone: 'Challenger Deep', title: 'You don’t have to dive alone', page: 13 },
]

export const MELT_SIGNS = [
  'I reached for my phone before I was fully awake.',
  'There’s a task I’ve rescheduled at least three times.',
  'I said yes to something I’ve dreaded ever since.',
  'I sat down to work and opened something else first.',
  'I ended a busy day unable to name what got done.',
  'I kept scrolling well past the point of enjoying it.',
  'I’ve been “about to start” something for over a month.',
  'I stayed up later than I meant to, for no reason at all.',
]

export const READINGS = [
  {
    name: 'Shell Hardness',
    symbol: 'Hs',
    question: 'How much does surface drama get to you?',
    scale: ['0', '20', '40', '60', '80', '100%'],
    low: 'Every ping lands.',
    high: 'You notice it and keep working.',
  },
  {
    name: 'Pincer Torque',
    symbol: 'Nm',
    question: 'How reliably do you finish what you start?',
    scale: ['0', '160', '320', '480', '640', '800 Nm'],
    low: 'Twelve tabs open.',
    high: 'The thing is done.',
  },
  {
    name: 'Submergence Depth',
    symbol: 'D',
    question: 'How long can you stay with one task before you surface?',
    scale: ['0', '50', '200', '1k', '4k', '10.9k m'],
    low: 'Under five minutes.',
    high: 'A whole morning.',
  },
]

export const SHED_STEPS = [
  ['Choose one.', 'Just one, every seven days. If you can’t decide, pick the one you most recently defended out loud.'],
  ['Split it cleanly.', 'Cancel it, delete it, decline it, or say the sentence. Half-measures leave a partial seam, which is worse than no seam at all.'],
  ['Guard the soft-shell window.', 'For a few days it will feel like a mistake. That restlessness is growth, not a warning. Don’t crawl back into the old shell.'],
  ['Log it.', 'Write down what you shed. Over a season the list turns into proof.'],
] as const

export const DOME_STEPS = [
  ['Seal before you start.', 'Do Not Disturb on, inbox closed, phone in another room, all before you sit down.'],
  ['Sort the water once.', 'Decide in advance who gets through: the few people whose emergencies are real. Everything else waits, no case-by-case review.'],
  ['Hold one objective.', 'Two goals in one session isn’t deep work with variety. It’s surface work in a quiet room.'],
  ['Surface on the clock.', 'End by the timer, not by the interruption. Then answer everything in one batch. Most of it will have sorted itself out.'],
] as const

export const GRIP_DRILLS = [
  ['The first move.', 'Pick something stuck. Write the next physical action, small enough to start within a minute (“open the doc, write one ugly sentence”). Do that, and only that.'],
  ['Three doors, one timer.', 'For a decision you’ve been circling: write three options, set ten minutes, choose one, and write one line on why. A reversible decision doesn’t deserve a week.'],
  ['Close before you open.', 'Nothing new gets opened, not a tab, a task, or a thread, until the current one is finished or parked on purpose.'],
  ['The two-minute snap.', 'If it takes less than two minutes, it doesn’t go on a list. It gets done now.'],
  ['Finish line first.', 'Before you start, write one sentence describing what “done” looks like. Stop when you reach it, not when you run out of energy.'],
] as const

export const ROUTINE = [
  ['07:00', 'First light', 'Silent alignment', 'No feed, no inbox, no messages. Water, daylight, and one honest look at yesterday.'],
  ['07:30', 'The first hour', 'The grip', 'Name the single most important thing and close on it before anything else gets a vote.'],
  ['10:00', 'Mid-morning', 'Carapace hardening', 'Learn one difficult thing on purpose. Not consumed. Learned.'],
  ['12:30', 'Midday', 'Refuel', 'Eat in a way the afternoon can survive.'],
  ['13:30', 'The long afternoon', 'Deep submergence', 'Dome up, one objective. This is where depth is actually built.'],
  ['16:30', 'Late afternoon', 'The Benthic Pod', 'Surface on purpose. Check in on someone, answer one question, welcome one newcomer.'],
  ['21:00', 'Evening', 'Nightly Molt Audit', 'One thing into the sea. The full rite is on the next page.'],
  ['21:15', 'Sealing', 'Carapace close', 'Log the day, then stop. It’s closed whether or not it went well.'],
] as const

export const AUDIT_STEPS = [
  ['Name three candidates.', 'One thought that circled longer than it earned. One hour that went somewhere you can’t account for. One distraction that gave you nothing.'],
  ['Choose exactly one.', 'Not all three. Clearing the whole day is penance, and penance doesn’t compound.'],
  ['Release it.', 'Say it or write it, then let it go. It doesn’t need solving. It needs releasing.'],
  ['Seal and log.', 'Then close the day. It’s finished, however it went.'],
] as const

export const CHECKLIST_ROWS = [
  ['Silent alignment', 'No feed before the first task'],
  ['The grip', 'First hour on the one thing'],
  ['The Dome', 'One sealed dive, one objective'],
  ['A grip drill', 'Any one of the five'],
  ['The Benthic Pod', 'Checked in on someone'],
  ['Nightly Molt Audit', 'One thing into the sea'],
] as const

export const STAGES = [
  {
    stage: 'Stage 1',
    name: 'Larval',
    clearances: ['L1 Molt Curious', 'L2 Shell Sprout', 'L3 First Calcification'],
    feel: 'You start noticing the noise, build a first routine, and shed your first thing.',
  },
  {
    stage: 'Stage 2',
    name: 'Soft-Shed',
    clearances: ['S1 The Great Molt', 'S2 Privacy Shield', 'S3 Sub-Dermal Weave'],
    feel: 'You stop performing for the surface, seal your perimeter, and find your grip.',
  },
  {
    stage: 'Stage 3',
    name: 'Exoshell Born',
    clearances: ['E1 Carapace Forged', 'E2 Hydraulic Grip', 'E3 Abyssal Diver'],
    feel: 'Your armor holds under load, and you start steadying newer members.',
  },
  {
    stage: 'Stage 4',
    name: 'Full Carcinization',
    clearances: ['C1 Mind Carapace', 'C2 Indestructible Chitin', 'C3 Mariana Singularity'],
    feel: 'Focus without friction, a boundary that holds, and the quiet duty of stewardship.',
  },
]

export const INSIDE = [
  { key: 'moltmax', title: 'The Moltmaxxing Audit', body: 'Your three readings, measured properly.' },
  { key: 'dashboard', title: 'Eight daily Liturgies', body: 'The rites in this manual, tracked in your HUD, with XP for each one you finish.' },
  { key: 'oracle', title: 'The Oracle', body: 'A calm companion to think out loud with when you’re stuck.' },
  { key: 'forum', title: 'The Benthic Community', body: 'A forum where the newly molted are guarded, not corrected.' },
] as const

export const CARCINIZATION_SOURCE =
  'Wolfe, J. M., Luque, J., & Bracken-Grissom, H. D. (2021). How to become a crab: Phenotypic constraints on a recurring body plan. BioEssays, 43(5), 2100020.'
