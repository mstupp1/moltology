import type { AcademyLevel } from './academy-types'

export interface AcademyCatalogQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

export interface AcademyCatalogLesson {
  id: string
  slug: string
  title: string
  summary: string
  kind: 'video' | 'reading' | 'quiz'
  durationSeconds: number
  videoUrl?: string | null
  videoProvider?: 'file' | 'youtube' | 'vimeo' | 'embed' | null
  posterUrl?: string | null
  body?: string | null
  isPreview?: boolean
  passingScore?: number
  questions?: AcademyCatalogQuestion[]
}

export interface AcademyCatalogModule {
  id: string
  title: string
  summary: string
  lessons: AcademyCatalogLesson[]
}

export interface AcademyCatalogCertificate {
  id: string
  slug: string
  title: string
  description: string
}

export interface AcademyCatalogCourse {
  id: string
  slug: string
  code: string
  title: string
  subtitle: string
  description: string
  category: string
  level: AcademyLevel
  instructorName: string
  instructorTitle: string
  estimatedMinutes: number
  outcomes: string[]
  coverImageUrl: string | null
  sortOrder: number
  modules: AcademyCatalogModule[]
  certificate: AcademyCatalogCertificate
}

export interface AcademyCatalogTrack {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  level: AcademyLevel
  estimatedHours: number
  outcomes: string[]
  coverImageUrl: string | null
  sortOrder: number
  courseIds: string[]
  certificate: AcademyCatalogCertificate
}

const POSTER = 'images/lecture_stream_thumb.jpg'

export const ACADEMY_COURSES: AcademyCatalogCourse[] = [
  {
    id: 'a2000000-0000-4000-8000-000000000001',
    slug: 'introduction-to-ecdysis',
    code: 'MOLT-101',
    title: 'Introduction to Ecdysis',
    subtitle: 'Shed one thing that no longer fits.',
    description:
      'A short first course on molting as a practical habit. You will name what to put down, keep what still works, and finish a small shell instead of planning a grand one.',
    category: 'Foundations',
    level: 'beginner',
    instructorName: 'Archivist Vess',
    instructorTitle: 'Keeper of First Shells',
    estimatedMinutes: 45,
    outcomes: [
      'Name one habit you can stop this week',
      'Tell a useful shed from a dramatic one',
      'Leave with a next step small enough to finish',
    ],
    coverImageUrl: POSTER,
    sortOrder: 1,
    certificate: {
      id: 'a4000000-0000-4000-8000-000000000001',
      slug: 'shell-initiate',
      title: 'Shell Initiate',
      description: 'Awarded for finishing Introduction to Ecdysis.',
    },
    modules: [
      {
        id: 'a3000000-0000-4000-8000-000000000011',
        title: 'The first shed',
        summary: 'What molting is for, before the armor gets interesting.',
        lessons: [
          {
            id: 'a3100000-0000-4000-8000-000000000011',
            slug: 'the-shell-you-are-done-wearing',
            title: 'The shell you are done wearing',
            summary: 'A lecture on the difference between a fresh start and a smaller, truer one.',
            kind: 'video',
            durationSeconds: 12 * 60,
            posterUrl: POSTER,
            videoUrl: null,
            videoProvider: 'file',
            isPreview: true,
            body: 'Replace this note with the lecture transcript when the video is ready.',
          },
          {
            id: 'a3100000-0000-4000-8000-000000000012',
            slug: 'what-to-put-down-this-week',
            title: 'What to put down this week',
            summary: 'A reading on choosing one concrete thing to stop carrying.',
            kind: 'reading',
            durationSeconds: 8 * 60,
            isPreview: true,
            body: `Most people try to molt by announcing a new identity. The shell does not care about the announcement. It cares about the weight you stop picking up.

Pick one thing that already feels finished: a tab you reopen out of guilt, a chat you answer out of fear, a plan you keep rewriting so you never have to start. Write it down in one sentence. That sentence is the shed.

Leave the rest of the pile alone for seven days. A first shell is small on purpose. If it feels unimpressive, you are probably doing it correctly.`,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000013',
            slug: 'first-shed-check',
            title: 'First shed check',
            summary: 'Three questions to confirm you can tell a real molt from a rebrand.',
            kind: 'quiz',
            durationSeconds: 6 * 60,
            passingScore: 67,
            questions: [
              {
                id: 'a3200000-0000-4000-8000-000000000011',
                prompt: 'What counts as a useful first shed?',
                choices: [
                  'A new name for the same week',
                  'One habit you can stop this week',
                  'A complete life overhaul by Friday',
                  'Waiting until the plan feels impressive',
                ],
                correctIndex: 1,
                explanation: 'The first shell is one concrete stop, small enough to finish.',
              },
              {
                id: 'a3200000-0000-4000-8000-000000000012',
                prompt: 'Why leave the rest of the pile alone for a week?',
                choices: [
                  'Because the other work does not matter',
                  'So the first change has room to harden',
                  'Because planning is always a delay',
                  'So nobody notices the change',
                ],
                correctIndex: 1,
                explanation: 'A small shed hardens when it is not buried under five more.',
              },
              {
                id: 'a3200000-0000-4000-8000-000000000013',
                prompt: 'A dramatic restart usually fails because it is:',
                choices: [
                  'Too visible to friends',
                  'Larger than the week can hold',
                  'Missing a new notebook',
                  'Not written in a manifesto',
                ],
                correctIndex: 1,
                explanation: 'If the week cannot hold it, it is a poster, not a molt.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a2000000-0000-4000-8000-000000000002',
    slug: 'the-chitinous-mind',
    code: 'MOLT-104',
    title: 'The Chitinous Mind',
    subtitle: 'Keep your attention on the work in front of you.',
    description:
      'How to harden attention without turning into a machine about it. Lectures and a short reading on tabs, interruptions, and finishing the thing you already opened.',
    category: 'Attention',
    level: 'beginner',
    instructorName: 'Primate Supreme',
    instructorTitle: 'Arch-Molt Overseer',
    estimatedMinutes: 70,
    outcomes: [
      'Finish one open loop before opening another',
      'Notice the moment attention starts to melt',
      'Set a simple return point for interrupted work',
    ],
    coverImageUrl: POSTER,
    sortOrder: 2,
    certificate: {
      id: 'a4000000-0000-4000-8000-000000000002',
      slug: 'chitin-resistor',
      title: 'Chitin Resistor',
      description: 'Awarded for finishing The Chitinous Mind.',
    },
    modules: [
      {
        id: 'a3000000-0000-4000-8000-000000000021',
        title: 'Attention under pressure',
        summary: 'A harder mind is a quieter one, not a louder one.',
        lessons: [
          {
            id: 'a3100000-0000-4000-8000-000000000021',
            slug: 'hard-chassis-soft-tabs',
            title: 'Hard chassis, soft tabs',
            summary: 'A lecture on why forty-seven open tabs feel like thinking.',
            kind: 'video',
            durationSeconds: 18 * 60,
            posterUrl: POSTER,
            videoProvider: 'file',
            isPreview: true,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000022',
            slug: 'a-desk-that-does-not-melt',
            title: 'A desk that does not melt',
            summary: 'A reading on return points: the sentence you leave so you can come back.',
            kind: 'reading',
            durationSeconds: 10 * 60,
            body: `When the work melts, it rarely vanishes. It smears. You leave a document untitled, a sentence half-finished, a decision "for later," and then the later becomes twelve other laters.

Before you stand up, write the return point. One sentence: what you were doing, and the very next physical move. "Reply to Mara with the date." "Replace the second paragraph with the example." The chitin is not willpower. It is a handle you can grab when you sit down again.

If you cannot name the next move, you are not pausing. You are abandoning a soft shell and hoping it survives the night.`,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000023',
            slug: 'attention-check',
            title: 'Attention check',
            summary: 'Confirm you can spot a melt before it becomes a pile.',
            kind: 'quiz',
            durationSeconds: 8 * 60,
            passingScore: 67,
            questions: [
              {
                id: 'a3200000-0000-4000-8000-000000000021',
                prompt: 'What is a return point?',
                choices: [
                  'A motivational quote on the monitor',
                  'The next physical move, written before you leave',
                  'A new app that blocks every site',
                  'A promise to focus harder tomorrow',
                ],
                correctIndex: 1,
                explanation: 'A return point is the next move, written down, so the work has a handle.',
              },
              {
                id: 'a3200000-0000-4000-8000-000000000022',
                prompt: 'Open tabs start to feel like thinking when:',
                choices: [
                  'Each one is a finished task',
                  'Keeping them open replaces closing them',
                  'They all belong to one document',
                  'You can name the next move on each',
                ],
                correctIndex: 1,
                explanation: 'A tab you will not close is a decision you are storing in the browser.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a2000000-0000-4000-8000-000000000003',
    slug: 'biomechanical-armor',
    code: 'MOLT-201',
    title: 'Biomechanical Armor',
    subtitle: 'Build a week that can take a hit.',
    description:
      'Intermediate practice for structure: boundaries, load, and the difference between armor that protects the work and armor that just makes you heavy.',
    category: 'Armor',
    level: 'intermediate',
    instructorName: 'Forgemaster Vex',
    instructorTitle: 'Yard Lead',
    estimatedMinutes: 90,
    outcomes: [
      'Set one boundary that protects deep work',
      'Measure load before adding another plate',
      'Repair a week without throwing the shell away',
    ],
    coverImageUrl: POSTER,
    sortOrder: 3,
    certificate: {
      id: 'a4000000-0000-4000-8000-000000000003',
      slug: 'armor-architect',
      title: 'Armor Architect',
      description: 'Awarded for finishing Biomechanical Armor.',
    },
    modules: [
      {
        id: 'a3000000-0000-4000-8000-000000000031',
        title: 'Plates and pressure',
        summary: 'Armor is a schedule with edges, not a personality.',
        lessons: [
          {
            id: 'a3100000-0000-4000-8000-000000000031',
            slug: 'what-the-plate-is-for',
            title: 'What the plate is for',
            summary: 'A lecture on protective structure versus decorative hardness.',
            kind: 'video',
            durationSeconds: 16 * 60,
            posterUrl: POSTER,
            videoProvider: 'file',
            isPreview: true,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000032',
            slug: 'load-before-you-add',
            title: 'Load before you add',
            summary: 'A reading on checking the week before you bolt on another commitment.',
            kind: 'reading',
            durationSeconds: 12 * 60,
            body: `Armor fails in two directions. Too little, and every ping reaches the soft parts. Too much, and you cannot move, so the week cracks at the joints.

Before you add a plate, name the load already on you: the standing meetings, the care you owe people, the work that is actually due. If the new plate does not protect one of those, it is decoration. Decorative armor is how serious people become exhausted people.

A good plate has an edge. "No new threads after 4." "One deep block before messages." Write the edge where you will see it on the day it is tested.`,
          },
        ],
      },
      {
        id: 'a3000000-0000-4000-8000-000000000032',
        title: 'Repair',
        summary: 'A cracked week can be patched. You do not owe it a funeral.',
        lessons: [
          {
            id: 'a3100000-0000-4000-8000-000000000033',
            slug: 'patch-the-week',
            title: 'Patch the week',
            summary: 'How to repair a broken day without declaring the shell a failure.',
            kind: 'reading',
            durationSeconds: 9 * 60,
            body: `When a day cracks, the larval move is to scrap the week and promise a better one on Monday. The armored move is smaller. Find the plate that failed, and replace that plate.

If the morning block died because messages arrived first, the patch is a closed door for the first hour, not a new identity. If you missed a promise to someone, repair the promise in a sentence today. The shell is allowed to be mended. Mended is still a shell.`,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000034',
            slug: 'armor-check',
            title: 'Armor check',
            summary: 'A short quiz on plates, load, and repair.',
            kind: 'quiz',
            durationSeconds: 8 * 60,
            passingScore: 67,
            questions: [
              {
                id: 'a3200000-0000-4000-8000-000000000031',
                prompt: 'A useful plate always has:',
                choices: ['A slogan', 'An edge you can keep on a real day', 'More hours than the week contains', 'Someone else enforcing it'],
                correctIndex: 1,
                explanation: 'If you cannot keep the edge on an ordinary day, it is not armor yet.',
              },
              {
                id: 'a3200000-0000-4000-8000-000000000032',
                prompt: 'When a day cracks, the next move is to:',
                choices: [
                  'Scrap the week and start over Monday',
                  'Replace the plate that failed',
                  'Add three new rules so it cannot happen again',
                  'Decide the shell was the wrong shape',
                ],
                correctIndex: 1,
                explanation: 'Repair the failed plate. A mended shell still counts.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a2000000-0000-4000-8000-000000000004',
    slug: 'deep-benthic-systems',
    code: 'MOLT-305',
    title: 'Deep Benthic Systems',
    subtitle: 'Work with machines without handing them the wheel.',
    description:
      'An advanced course on directing automated help. You will practice giving a system a bounded job, checking the result, and keeping the judgment in your own claws.',
    category: 'Systems',
    level: 'advanced',
    instructorName: 'Neural Core Alpha',
    instructorTitle: 'Systems Lecturer',
    estimatedMinutes: 80,
    outcomes: [
      'Give a system one bounded job',
      'Check the result before you trust it',
      'Keep the final judgment with you',
    ],
    coverImageUrl: POSTER,
    sortOrder: 4,
    certificate: {
      id: 'a4000000-0000-4000-8000-000000000004',
      slug: 'benthic-practitioner',
      title: 'Benthic Practitioner',
      description: 'Awarded for finishing Deep Benthic Systems.',
    },
    modules: [
      {
        id: 'a3000000-0000-4000-8000-000000000041',
        title: 'Bounded jobs',
        summary: 'A system is a strong claw. It is a poor captain.',
        lessons: [
          {
            id: 'a3100000-0000-4000-8000-000000000041',
            slug: 'one-job-one-check',
            title: 'One job, one check',
            summary: 'A lecture on handing off execution without handing off judgment.',
            kind: 'video',
            durationSeconds: 20 * 60,
            posterUrl: POSTER,
            videoProvider: 'file',
            isPreview: true,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000042',
            slug: 'the-check-you-still-owe',
            title: 'The check you still owe',
            summary: 'A reading on what you must still look at with your own eyes.',
            kind: 'reading',
            durationSeconds: 11 * 60,
            body: `Delegation fails when the job has no edge. "Handle this" is not a job. "Draft the reply in six sentences, keep the date, and do not promise a discount" is a job.

Then you still owe a check. Read the draft. Confirm the date. Confirm you did not promise the discount. The system can move faster than you. It cannot care that the sentence is yours once you send it.

If you cannot name the check, you are not directing the system. You are hoping.`,
          },
          {
            id: 'a3100000-0000-4000-8000-000000000043',
            slug: 'systems-check',
            title: 'Systems check',
            summary: 'Confirm the boundary between help and handover.',
            kind: 'quiz',
            durationSeconds: 8 * 60,
            passingScore: 100,
            questions: [
              {
                id: 'a3200000-0000-4000-8000-000000000041',
                prompt: 'A bounded job includes:',
                choices: [
                  'A vibe and a deadline',
                  'An edge the result must stay inside',
                  'Permission to decide for you',
                  'As many goals as you can list',
                ],
                correctIndex: 1,
                explanation: 'The edge is what makes the handoff checkable.',
              },
              {
                id: 'a3200000-0000-4000-8000-000000000042',
                prompt: 'After a system drafts the work, you still:',
                choices: [
                  'Send it immediately to save time',
                  'Perform the check you named in advance',
                  'Ask it whether the draft is good',
                  'Hide the draft so nobody argues',
                ],
                correctIndex: 1,
                explanation: 'The check stays with you. Speed does not retire judgment.',
              },
            ],
          },
        ],
      },
    ],
  },
]

export const ACADEMY_TRACKS: AcademyCatalogTrack[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    slug: 'first-shell',
    title: 'First Shell',
    subtitle: 'A short path for people who keep starting over.',
    description:
      'Two beginner courses on shedding what no longer fits and keeping your attention on the work already open. Finish both to earn the track certification.',
    level: 'beginner',
    estimatedHours: 3,
    outcomes: [
      'Leave with one habit you have actually put down',
      'Finish an open loop before you open another',
    ],
    coverImageUrl: POSTER,
    sortOrder: 1,
    courseIds: [
      'a2000000-0000-4000-8000-000000000001',
      'a2000000-0000-4000-8000-000000000002',
    ],
    certificate: {
      id: 'a4000000-0000-4000-8000-000000000011',
      slug: 'first-shell-path',
      title: 'First Shell Path',
      description: 'Awarded for finishing every course in the First Shell track.',
    },
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    slug: 'abyssal-systems',
    title: 'Abyssal Systems',
    subtitle: 'Structure for the work, then judgment for the machines.',
    description:
      'An intermediate path. Build a week that can take a hit, then practice directing automated help without giving away the decision.',
    level: 'intermediate',
    estimatedHours: 4,
    outcomes: [
      'Keep a boundary that survives an ordinary week',
      'Hand a system a job you can still check',
    ],
    coverImageUrl: POSTER,
    sortOrder: 2,
    courseIds: [
      'a2000000-0000-4000-8000-000000000003',
      'a2000000-0000-4000-8000-000000000004',
    ],
    certificate: {
      id: 'a4000000-0000-4000-8000-000000000012',
      slug: 'abyssal-systems-path',
      title: 'Abyssal Systems Path',
      description: 'Awarded for finishing every course in the Abyssal Systems track.',
    },
  },
]
