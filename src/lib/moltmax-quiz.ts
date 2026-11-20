import { getAssetUrl } from './assets'
import { VECTOR_WEIGHTS } from './vectors'

export type QuizDimension =
  | 'shellHardness'
  | 'pincerTorque'
  | 'neuralLatency'
  | 'ecdysisDiscipline'
  | 'depthTolerance'

export type QuizFormat = 'scenario' | 'likert' | 'binary'

export interface QuizOption {
  id: string
  label: string
  detail?: string
  score: number
}

export interface QuizQuestion {
  id: string
  dimension: QuizDimension
  format: QuizFormat
  eyebrow: string
  prompt: string
  helper: string
  options: QuizOption[]
  image: string
  imageAlt: string
  scenarioCaption: string
  varianceKey?: string
}

export type QuizAnswers = Record<string, string>

export interface MoltmaxBiometrics {
  shellHardness: number
  pincerTorque: number
  promptLatency: number
  ecdysisInterval: number
  submergenceDepth: number
}

export interface MoltmaxResult {
  score: number
  carcinizationPercent: number
  tierName: string
  tierLevel: string
  stage: string
  clearance: string
  archetype: string
  prescription: string[]
  badgeColor: string
  isMeltRisk: boolean
  meltPercentage: number
  dimensionScores: Record<QuizDimension, number>
  biometrics: MoltmaxBiometrics
  varianceDetected: boolean
}

const likert = [
  { id: 'strongly-disagree', label: 'Strongly Disagree', detail: 'Not me yet. The surface usually wins this one.', score: 10 },
  { id: 'disagree', label: 'Disagree', detail: 'More often than not, this one still trips me up.', score: 32 },
  { id: 'neutral', label: 'Neutral', detail: 'Depends on the week. Still finding my footing.', score: 55 },
  { id: 'agree', label: 'Agree', detail: 'Usually true for me. The habit holds most days.', score: 78 },
  { id: 'strongly-agree', label: 'Strongly Agree', detail: 'Steady and automatic. This part of my shell is set.', score: 100 },
]

export const MOLTMAX_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1', dimension: 'shellHardness', format: 'scenario', eyebrow: '01 · CARAPACE RESPONSE',
    prompt: 'Sharp criticism lands in your inbox before your day has even started. What happens next?',
    helper: 'Pick the option closest to your honest first instinct.',
    image: getAssetUrl('/images/quiz/q01_criticism.jpg'),
    imageAlt: 'Armored lobster hero smiling as criticism bubbles bounce harmlessly off his shell',
    scenarioCaption: 'Rough feedback before coffee. How well does your shell hold?',
    options: [
      { id: 'q1-a', label: 'Take it in, keep what is useful, drop the rest.', detail: 'Good feedback stays; the sting washes off.', score: 100 },
      { id: 'q1-b', label: 'Step back for a quiet minute before replying.', detail: 'Steadier head first, answer second.', score: 68 },
      { id: 'q1-c', label: 'Fire back right away.', detail: 'The claw snaps before the water settles.', score: 42 },
      { id: 'q1-d', label: 'It derails the rest of my morning.', detail: 'One bad message rewrites the whole day.', score: 10 },
    ],
  },
  {
    id: 'q2', dimension: 'neuralLatency', format: 'likert', eyebrow: '02 · SYNAPTIC FLOW',
    prompt: 'When a clear decision is in front of me, I move to action instead of circling the same thought.',
    helper: 'Think about the gap between knowing what to do and starting.',
    image: getAssetUrl('/images/quiz/q02_decision.jpg'),
    imageAlt: 'Lobster hero pointing forward decisively at an underwater neon crossroads while a dizzy crab spins',
    scenarioCaption: 'Fork in the road. Less circling, more moving.',
    options: likert,
  },
  {
    id: 'q3', dimension: 'depthTolerance', format: 'binary', eyebrow: '03 · PRESSURE TEST',
    prompt: 'A project suddenly gets harder and the pressure climbs. How do you handle the dive?',
    helper: 'Neither style is wrong. Pick the one that sounds like you.',
    image: getAssetUrl('/images/quiz/q03_depth.jpg'),
    imageAlt: 'Lobster hero diving boldly into the deep ocean trench with glowing headlights',
    scenarioCaption: 'Deep water ahead. Stepping into the harder part of the work.',
    options: [
      { id: 'q3-a', label: 'Go down in steady stages.', detail: 'Build momentum one clear checkpoint at a time.', score: 62 },
      { id: 'q3-b', label: 'Lock onto the core problem and dive straight in.', detail: 'Pressure clears away the noise. I want the real work first.', score: 100 },
    ],
  },
  {
    id: 'q4', dimension: 'ecdysisDiscipline', format: 'likert', eyebrow: '04 · SHEDDING CADENCE',
    prompt: 'I let go of habits, tools, and routines once they stop helping me do good work.',
    helper: 'A shell that fits forever is a shell you stopped growing into.',
    image: getAssetUrl('/images/quiz/q04_shedding.jpg'),
    imageAlt: 'Lobster hero joyfully stepping out of an old shell into glowing upgraded armor',
    scenarioCaption: 'Outgrowing the old routine so the next one has room.',
    options: likert,
  },
  {
    id: 'q5', dimension: 'pincerTorque', format: 'scenario', eyebrow: '05 · EXECUTION LOAD',
    prompt: 'Three worthwhile projects open up at the same time. What do your pincers do?',
    helper: 'Grip is about finishing one thing, not juggling all three.',
    image: getAssetUrl('/images/quiz/q05_pincer.jpg'),
    imageAlt: 'Lobster hero snapping a powerful claw onto the golden prize in a swirling vortex',
    scenarioCaption: 'Three good options at once. One steady grip.',
    options: [
      { id: 'q5-a', label: 'Pick one and close on it cleanly.', detail: 'One finished thing beats three half-started ones.', score: 100 },
      { id: 'q5-b', label: 'Rank them quickly, then start the first.', detail: 'A two-minute sort keeps the week focused.', score: 74 },
      { id: 'q5-c', label: 'Keep all three moving at once.', detail: 'Every claw stays half-open and nothing quite closes.', score: 38 },
      { id: 'q5-d', label: 'Wait until the choice becomes obvious.', detail: 'Hold off until the tide decides for me.', score: 10 },
    ],
  },
  {
    id: 'q6', dimension: 'shellHardness', format: 'likert', eyebrow: '06 · SOFT-SHELL WINDOW',
    prompt: 'I can stay open to good feedback without letting every outside opinion knock me off course.',
    helper: 'A good shell has doors, not brick walls.',
    image: getAssetUrl('/images/quiz/q06_boundaries.jpg'),
    imageAlt: 'Lobster hero floating inside an energy shield welcoming nutrients while deflecting debris',
    scenarioCaption: 'Letting useful ideas in while the noise bounces off.',
    options: likert,
    varianceKey: 'shell-boundaries',
  },
  {
    id: 'q7', dimension: 'depthTolerance', format: 'scenario', eyebrow: '07 · BENTHIC ORIENTATION',
    prompt: 'Messages and chatter heat up while you are in the middle of real work. What do you do?',
    helper: 'Think about what usually happens on an ordinary Tuesday.',
    image: getAssetUrl('/images/quiz/q07_quiet.jpg'),
    imageAlt: 'Lobster hero descending to a serene glowing undersea workshop',
    scenarioCaption: 'Noise rising overhead. Heading down to quieter water.',
    options: [
      { id: 'q7-a', label: 'Mute notifications for an hour and check back later.', detail: 'Protect the block without disappearing all day.', score: 72 },
      { id: 'q7-b', label: 'Keep an eye on the chat just in case.', detail: 'Hard to shake the feeling I might miss something.', score: 28 },
      { id: 'q7-c', label: 'Shut the door completely and finish the block.', detail: 'Quiet water is where the work actually gets done.', score: 100 },
      { id: 'q7-d', label: 'Answer everything as it comes in.', detail: 'Hard to leave a message waiting, even mid-task.', score: 12 },
    ],
  },
  {
    id: 'q8', dimension: 'neuralLatency', format: 'binary', eyebrow: '08 · RESPONSE WINDOW',
    prompt: 'A small but important task has been sitting on your list since yesterday.',
    helper: 'Pick what you usually do first, not what you wish you did.',
    image: getAssetUrl('/images/quiz/q08_quick_action.jpg'),
    imageAlt: 'Lobster hero grabbing a glowing task orb in two seconds with lightning speed',
    scenarioCaption: 'Small task lingering on the list. Two minutes to break the stall.',
    options: [
      { id: 'q8-a', label: 'Give it two minutes right now.', detail: 'Starting is the hardest part; motion carries the rest.', score: 100 },
      { id: 'q8-b', label: 'Plan a cleaner way to tackle it later.', detail: 'Wait until I have the right setup and a clear block.', score: 46 },
    ],
    varianceKey: 'response-window',
  },
  {
    id: 'q9', dimension: 'pincerTorque', format: 'likert', eyebrow: '09 · GRIP CONFIDENCE',
    prompt: 'Once I commit to a goal, I stay with it through the boring or frustrating middle.',
    helper: 'Rate your follow-through, not your enthusiasm on day one.',
    image: getAssetUrl('/images/quiz/q09_grip.jpg'),
    imageAlt: 'Lobster hero clamped securely onto an anchor chain against ocean currents',
    scenarioCaption: 'Current picking up. Holding steady through the middle stretch.',
    options: likert,
    varianceKey: 'grip-pattern',
  },
  {
    id: 'q10', dimension: 'ecdysisDiscipline', format: 'scenario', eyebrow: '10 · OLD SHELL RELEASE',
    prompt: 'You notice a familiar routine is slowing down your whole week. How do you shed it?',
    helper: 'Letting go works best when something simpler takes its place.',
    image: getAssetUrl('/images/quiz/q10_team_upgrade.jpg'),
    imageAlt: 'Lobster hero presenting upgrade blueprint to cheerful crab and shrimp team members',
    scenarioCaption: 'Retiring a tired process for something cleaner.',
    options: [
      { id: 'q10-a', label: 'Keep what worked, drop the rest, and replace it.', detail: 'The old shell teaches you how to build the next one.', score: 100 },
      { id: 'q10-b', label: 'Trim it down around the edges.', detail: 'Small tweaks keep things steady without a shock.', score: 70 },
      { id: 'q10-c', label: 'Keep it going until it breaks.', detail: 'Hard to change a habit while it still mostly works.', score: 28 },
      { id: 'q10-d', label: 'Scrap the whole system and start over.', detail: 'A clean slate feels easier than untangling one knot.', score: 12 },
    ],
    varianceKey: 'shed-pattern',
  },
  {
    id: 'q11', dimension: 'shellHardness', format: 'binary', eyebrow: '11 · BOUNDARY INTEGRITY',
    prompt: 'An urgent-sounding request arrives right in the middle of the rest time you promised yourself.',
    helper: 'Boundaries protect your recovery so you can show up tomorrow.',
    image: getAssetUrl('/images/quiz/q11_rest_boundary.jpg'),
    imageAlt: 'Lobster hero relaxing in a seaweed spa hammock holding up a polite pause claw to a courier',
    scenarioCaption: 'Rest time on the calendar. Holding the line gently.',
    options: [
      { id: 'q11-a', label: 'Say no clearly and protect the break.', detail: 'The promise to myself still counts.', score: 100 },
      { id: 'q11-b', label: 'Say yes now and promise to rest later.', detail: 'Immediate pressure usually bends the boundary.', score: 35 },
    ],
    varianceKey: 'shell-boundaries',
  },
  {
    id: 'q12', dimension: 'neuralLatency', format: 'scenario', eyebrow: '12 · SIGNAL TRIAGE',
    prompt: 'Five pings hit your screen at the exact same moment. What is your first move?',
    helper: 'Clear focus starts with choosing what can wait.',
    image: getAssetUrl('/images/quiz/q12_focus.jpg'),
    imageAlt: 'Lobster hero swiping away noisy notification bubbles to focus on priority #1',
    scenarioCaption: 'Five pings at once. Picking the one that actually matters.',
    options: [
      { id: 'q12-a', label: 'Pick the one priority that matters now and queue the rest.', detail: 'One thing gets attention; the other four wait their turn.', score: 100 },
      { id: 'q12-b', label: 'Skim all five quickly for real emergencies.', detail: 'A ten-second scan prevents a real miss.', score: 64 },
      { id: 'q12-c', label: 'Knock out the easiest one first.', detail: 'Quick replies feel good, even if they push back the real work.', score: 34 },
      { id: 'q12-d', label: 'Freeze for a minute and hope the thread cools down.', detail: 'Wait for the wave to pass before wading in.', score: 12 },
    ],
  },
  {
    id: 'q13', dimension: 'pincerTorque', format: 'binary', eyebrow: '13 · DECISIVE CLOSURE',
    prompt: 'A solid, working version is ready today; a polished version might be ready next week.',
    helper: 'Finishing lets real feedback improve the next shell.',
    image: getAssetUrl('/images/quiz/q13_ship_it.jpg'),
    imageAlt: 'Lobster hero launching a working yellow mini-sub with a thumbs up',
    scenarioCaption: 'A working shell today beats an imaginary one next week.',
    options: [
      { id: 'q13-a', label: 'Ship it now, watch how it holds, and refine it.', detail: 'Real work in the water teaches more than another draft.', score: 100 },
      { id: 'q13-b', label: 'Keep polishing until every edge feels right.', detail: 'Hard to let go while I can still spot flaws.', score: 30 },
    ],
  },
  {
    id: 'q14', dimension: 'ecdysisDiscipline', format: 'binary', eyebrow: '14 · DAILY SHED',
    prompt: 'At the end of a long week, you spot one small habit that no longer fits where you are headed.',
    helper: 'Small sheds keep the whole shell moving.',
    image: getAssetUrl('/images/quiz/q14_daily_shed.jpg'),
    imageAlt: 'Lobster hero dropping an obsolete rusty gear into a recycling chamber',
    scenarioCaption: 'Evening check-in. Dropping one small habit into the sea.',
    options: [
      { id: 'q14-a', label: 'Drop it tonight and try a simpler habit tomorrow.', detail: 'Small nightly sheds keep change light.', score: 100 },
      { id: 'q14-b', label: 'Give it one more week to see if it sticks.', detail: 'Familiar habits usually get another pass.', score: 38 },
    ],
  },
  {
    id: 'q15', dimension: 'depthTolerance', format: 'likert', eyebrow: '15 · FINAL DESCENT',
    prompt: 'The harder a problem gets, the more able I feel to slow down and find quiet focus.',
    helper: 'This measures calm under pressure, not chasing stress.',
    image: getAssetUrl('/images/quiz/q15_final_descent.jpg'),
    imageAlt: 'Lobster hero glowing calmly in the deep ocean abyss surrounded by glowing jellyfish',
    scenarioCaption: 'Quiet at depth. Steady water makes hard problems clearer.',
    options: likert,
  },
]

const DIMENSION_WEIGHTS: Record<QuizDimension, number> = VECTOR_WEIGHTS

const DIMENSIONS: QuizDimension[] = ['shellHardness', 'pincerTorque', 'neuralLatency', 'ecdysisDiscipline', 'depthTolerance']

function getClearance(score: number) {
  const stages = score >= 88
    ? { stage: 'STAGE IV', name: 'FULL CARCINIZATION', code: 'C', min: 88, max: 100 }
    : score >= 72
      ? { stage: 'STAGE III', name: 'EXOSHELL BORN', code: 'E', min: 72, max: 88 }
      : score >= 50
        ? { stage: 'STAGE II', name: 'SOFT-SHED', code: 'S', min: 50, max: 72 }
        : { stage: 'STAGE I', name: 'LARVAL INITIATE', code: 'L', min: 12, max: 50 }
  const progress = (score - stages.min) / (stages.max - stages.min)
  const level = progress < 0.34 ? 1 : progress < 0.67 ? 2 : 3
  return { ...stages, clearance: `${stages.code}-${level}` }
}

/** Stage and clearance labels for a score, so the server never stores client-written labels. */
export function moltmaxLabelsForScore(score: number): { clearance: string; stage: string } {
  const clearance = getClearance(Math.max(12, Math.min(99, Math.round(score))))
  return { clearance: clearance.clearance, stage: `${clearance.stage} · ${clearance.name}` }
}

function hasVariance(answers: QuizAnswers) {
  const boundaryA = answers.q6
  const boundaryB = answers.q11
  const responseA = answers.q2
  const responseB = answers.q8
  const boundaryConflict = boundaryA && boundaryB && (
    (boundaryA === 'strongly-agree' && boundaryB === 'q11-b') ||
    (boundaryA === 'strongly-disagree' && boundaryB === 'q11-a')
  )
  const responseConflict = responseA && responseB && (
    (responseA === 'strongly-agree' && responseB === 'q8-b') ||
    (responseA === 'strongly-disagree' && responseB === 'q8-a')
  )
  return Boolean(boundaryConflict || responseConflict)
}

export function computeMoltmaxResult(answers: QuizAnswers): MoltmaxResult {
  const dimensionScores = {} as Record<QuizDimension, number>

  DIMENSIONS.forEach((dimension) => {
    const questions = MOLTMAX_QUESTIONS.filter((question) => question.dimension === dimension)
    const scores = questions.map((question) => {
      const answer = answers[question.id]
      return question.options.find((option) => option.id === answer)?.score ?? 0
    })
    dimensionScores[dimension] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  })

  const rawScore = DIMENSIONS.reduce((sum, dimension) => sum + dimensionScores[dimension] * DIMENSION_WEIGHTS[dimension], 0)
  const score = Math.max(12, Math.min(99, Math.round(rawScore)))
  const clearance = getClearance(score)
  const isMeltRisk = dimensionScores.shellHardness < 35
  const meltPercentage = isMeltRisk ? Math.max(15, Math.round(100 - (dimensionScores.shellHardness / 35) * 100)) : 0

  const tier = score >= 88
    ? {
        tierName: 'Abyssal Steward', tierLevel: 'STAGE IV · FULL CARCINIZATION', archetype: 'Deep Floor',
        badgeColor: 'text-cyan-glow border-cyan-glow/40 bg-cyan-glow/10',
        prescription: ['Protect one uninterrupted deep-focus block before the day gets noisy.', 'Keep closing tasks cleanly when the stakes rise.', 'Pass one steady habit to someone who is just starting out.'],
      }
    : score >= 72
      ? {
          tierName: 'Armored Vanguard', tierLevel: 'STAGE III · EXOSHELL BORN', archetype: 'Hardened Shell',
          badgeColor: 'text-cyan-glow border-cyan-glow/40 bg-cyan-glow/10',
          prescription: ['Put real weight behind one meaningful project this week.', 'Pick one outgrown habit each week and drop it cleanly.', 'Keep your boundaries firm without closing off the people who matter.'],
        }
      : score >= 50
        ? {
            tierName: 'Soft-Shell Diver', tierLevel: 'STAGE II · SOFT-SHED', archetype: 'Setting Shell',
            badgeColor: 'text-[#ffd700] border-[#ffd700]/40 bg-[#ffd700]/10',
            prescription: ['Turn one lingering task into a two-minute start today.', 'Protect a short quiet window before checking messages.', 'Swap one draining habit for a small routine you can repeat tomorrow.'],
          }
        : {
            tierName: 'Surface Moltlet', tierLevel: 'STAGE I · LARVAL INITIATE', archetype: 'Soft-Shell Starter',
            badgeColor: 'text-crimson-aggro border-crimson-aggro/40 bg-crimson-aggro/10',
            prescription: ['Pick one tiny habit to drop tonight. Just one.', 'Decide what deserves your attention first, and let the rest wait.', 'Treat rest as part of building a shell, not a setback.'],
          }

  return {
    ...tier,
    score,
    carcinizationPercent: Math.min(99, Math.round(score * 1.05)),
    stage: `${clearance.stage} · ${clearance.name}`,
    clearance: clearance.clearance,
    dimensionScores,
    isMeltRisk,
    meltPercentage,
    varianceDetected: hasVariance(answers),
    biometrics: {
      shellHardness: dimensionScores.shellHardness,
      pincerTorque: Math.round(dimensionScores.pincerTorque * 10),
      promptLatency: Math.max(10, Math.round(500 - dimensionScores.neuralLatency * 4.9)),
      ecdysisInterval: Math.max(1, Math.round(30 - dimensionScores.ecdysisDiscipline * 0.29)),
      submergenceDepth: Math.round(1000 + dimensionScores.depthTolerance * 99.28),
    },
  }
}
