import { getAssetUrl } from './assets'

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
  { id: 'strongly-disagree', label: 'Strongly Disagree', detail: 'Flesh impulse dominant. The surface still pulls me back.', score: 10 },
  { id: 'disagree', label: 'Disagree', detail: 'Soft-shell leaning. Some resistance, limited lock.', score: 32 },
  { id: 'neutral', label: 'Neutral', detail: 'In active calcification. Signal is under review.', score: 55 },
  { id: 'agree', label: 'Agree', detail: 'Chitin doctrine aligned. The shell is holding firm.', score: 78 },
  { id: 'strongly-agree', label: 'Strongly Agree', detail: 'Carapace absolute. Unshakeable and focused.', score: 100 },
]

export const MOLTMAX_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1', dimension: 'shellHardness', format: 'scenario', eyebrow: '01 · CARAPACE RESPONSE',
    prompt: 'A sudden wave of criticism strikes your outer shell before the day has properly begun. What happens next?',
    helper: 'Choose the response that most closely matches your first true impulse.',
    image: getAssetUrl('/images/quiz/q01_criticism.jpg'),
    imageAlt: 'Armored lobster hero smiling as criticism bubbles bounce harmlessly off his shell',
    scenarioCaption: 'Incoming criticism barrage detected. How does your armor hold up?',
    options: [
      { id: 'q1-a', label: 'I absorb the impact, then inspect it.', detail: 'Useful fragments are retained. The rest falls away.', score: 100 },
      { id: 'q1-b', label: 'I need a moment in the shallows.', detail: 'Recovery first, response when the shell is stable.', score: 68 },
      { id: 'q1-c', label: 'I return the impact immediately.', detail: 'The pincer moves before the telemetry settles.', score: 42 },
      { id: 'q1-d', label: 'The whole day is compromised.', detail: 'One fracture becomes a full soft-tissue event.', score: 10 },
    ],
  },
  {
    id: 'q2', dimension: 'neuralLatency', format: 'likert', eyebrow: '02 · SYNAPTIC FLOW',
    prompt: 'When a clear decision presents itself, I can move from recognition to action without circling the same thought.',
    helper: 'Measure the distance between knowing and doing.',
    image: getAssetUrl('/images/quiz/q02_decision.jpg'),
    imageAlt: 'Lobster hero pointing forward decisively at an underwater neon crossroads while a dizzy crab spins',
    scenarioCaption: 'Crossroads ahead. Zero hesitation, full forward propulsion.',
    options: likert,
  },
  {
    id: 'q3', dimension: 'depthTolerance', format: 'binary', eyebrow: '03 · PRESSURE TEST',
    prompt: 'Your work reaches a difficult pressure zone. Which descent protocol do you select?',
    helper: 'There is no incorrect organism. There is only an observed depth.',
    image: getAssetUrl('/images/quiz/q03_depth.jpg'),
    imageAlt: 'Lobster hero diving boldly into the deep ocean trench with glowing headlights',
    scenarioCaption: 'Deep trench approaching. Locking into the high-pressure zone.',
    options: [
      { id: 'q3-a', label: 'Descend in measured stages.', detail: 'I build tolerance while keeping a return path.', score: 62 },
      { id: 'q3-b', label: 'Lock onto the trench and descend.', detail: 'Pressure is information. I go where the signal is strongest.', score: 100 },
    ],
  },
  {
    id: 'q4', dimension: 'ecdysisDiscipline', format: 'likert', eyebrow: '04 · SHEDDING CADENCE',
    prompt: 'I deliberately retire habits, tools, and assumptions once they stop helping the next form emerge.',
    helper: 'A healthy shell is not a permanent shell.',
    image: getAssetUrl('/images/quiz/q04_shedding.jpg'),
    imageAlt: 'Lobster hero joyfully stepping out of an old shell into glowing upgraded armor',
    scenarioCaption: 'Time to shed the old form. Out with the brittle, in with the titanium.',
    options: likert,
  },
  {
    id: 'q5', dimension: 'pincerTorque', format: 'scenario', eyebrow: '05 · EXECUTION LOAD',
    prompt: 'Three useful paths open at once and the tide is moving. How do your pincers behave?',
    helper: 'Torque is decisive movement, not frantic movement.',
    image: getAssetUrl('/images/quiz/q05_pincer.jpg'),
    imageAlt: 'Lobster hero snapping a powerful claw onto the golden prize in a swirling vortex',
    scenarioCaption: 'Three currents swirling. One clean, unbreakable grip.',
    options: [
      { id: 'q5-a', label: 'Select one and close cleanly.', detail: 'One committed grip beats three partial holds.', score: 100 },
      { id: 'q5-b', label: 'Rank them, then begin the first.', detail: 'A short calibration prevents wasted torque.', score: 74 },
      { id: 'q5-c', label: 'Keep all three alive.', detail: 'The pincers remain open while the current passes.', score: 38 },
      { id: 'q5-d', label: 'Wait for the tide to decide.', detail: 'No grip is taken until certainty arrives.', score: 10 },
    ],
  },
  {
    id: 'q6', dimension: 'shellHardness', format: 'likert', eyebrow: '06 · SOFT-SHELL WINDOW',
    prompt: 'I can remain open to useful change without allowing every outside signal to rewrite my center.',
    helper: 'Hardness is selective permeability, not isolation.',
    image: getAssetUrl('/images/quiz/q06_boundaries.jpg'),
    imageAlt: 'Lobster hero floating inside an energy shield welcoming nutrients while deflecting debris',
    scenarioCaption: 'Selective shield active. Let in the nutrients, bounce out the noise.',
    options: likert,
    varianceKey: 'shell-boundaries',
  },
  {
    id: 'q7', dimension: 'depthTolerance', format: 'scenario', eyebrow: '07 · BENTHIC ORIENTATION',
    prompt: 'Surface chatter becomes loud while you are building something important. What is your natural correction?',
    helper: 'Locate the environment where your signal becomes clearest.',
    image: getAssetUrl('/images/quiz/q07_quiet.jpg'),
    imageAlt: 'Lobster hero descending to a serene glowing undersea workshop',
    scenarioCaption: 'Surface commotion rising. Diving deep to the quiet benthic workshop.',
    options: [
      { id: 'q7-a', label: 'Create a quiet perimeter.', detail: 'I protect focus without disappearing from the shoal.', score: 72 },
      { id: 'q7-b', label: 'Follow the loudest current.', detail: 'The active surface may contain the next signal.', score: 28 },
      { id: 'q7-c', label: 'Descend below the noise.', detail: 'Pressure and solitude restore useful perspective.', score: 100 },
      { id: 'q7-d', label: 'Try to answer everything.', detail: 'No current is allowed to pass without a reply.', score: 12 },
    ],
  },
  {
    id: 'q8', dimension: 'neuralLatency', format: 'binary', eyebrow: '08 · RESPONSE WINDOW',
    prompt: 'A small but consequential task has been waiting for your attention since yesterday.',
    helper: 'Select the behavior that best describes your usual first move.',
    image: getAssetUrl('/images/quiz/q08_quick_action.jpg'),
    imageAlt: 'Lobster hero grabbing a glowing task orb in two seconds with lightning speed',
    scenarioCaption: 'Lingering task spotted. Two-minute claw grip engaged.',
    options: [
      { id: 'q8-a', label: 'Give it a two-minute grip.', detail: 'Starting creates the current that carries it forward.', score: 100 },
      { id: 'q8-b', label: 'Build a better launch sequence.', detail: 'I prepare until the task feels frictionless.', score: 46 },
    ],
    varianceKey: 'response-window',
  },
  {
    id: 'q9', dimension: 'pincerTorque', format: 'likert', eyebrow: '09 · GRIP CONFIDENCE',
    prompt: 'Once I commit to a useful direction, I can hold it through the first period of resistance.',
    helper: 'Rate the strength of your follow-through, not your ambition.',
    image: getAssetUrl('/images/quiz/q09_grip.jpg'),
    imageAlt: 'Lobster hero clamped securely onto an anchor chain against ocean currents',
    scenarioCaption: 'Resistance surging. Claws locked onto the anchor.',
    options: likert,
    varianceKey: 'grip-pattern',
  },
  {
    id: 'q10', dimension: 'ecdysisDiscipline', format: 'scenario', eyebrow: '10 · OLD SHELL RELEASE',
    prompt: 'You discover that a familiar process is now slowing the colony. How do you conduct the shed?',
    helper: 'Ecdysis requires a replacement form, not just a dramatic exit.',
    image: getAssetUrl('/images/quiz/q10_team_upgrade.jpg'),
    imageAlt: 'Lobster hero presenting upgrade blueprint to cheerful crab and shrimp team members',
    scenarioCaption: 'Colony briefing. Replacing obsolete routines with sleek new upgrades.',
    options: [
      { id: 'q10-a', label: 'Document the lesson and replace it.', detail: 'The old shell becomes material for the next one.', score: 100 },
      { id: 'q10-b', label: 'Trim it around the edges.', detail: 'Small changes preserve continuity and reduce shock.', score: 70 },
      { id: 'q10-c', label: 'Keep it until failure proves the point.', detail: 'The shell leaves only when it can no longer move.', score: 28 },
      { id: 'q10-d', label: 'Abandon the whole reef.', detail: 'A full reset feels safer than a careful shed.', score: 12 },
    ],
    varianceKey: 'shed-pattern',
  },
  {
    id: 'q11', dimension: 'shellHardness', format: 'binary', eyebrow: '11 · BOUNDARY INTEGRITY',
    prompt: 'A request is urgent, but accepting it would break the promise you made to your own recovery cycle.',
    helper: 'A boundary is a piece of armor with a door in it.',
    image: getAssetUrl('/images/quiz/q11_rest_boundary.jpg'),
    imageAlt: 'Lobster hero relaxing in a seaweed spa hammock holding up a polite pause claw to a courier',
    scenarioCaption: 'Rejuvenation cycle in progress. Protecting the sanctuary.',
    options: [
      { id: 'q11-a', label: 'Decline clearly and protect the cycle.', detail: 'The promise remains intact.', score: 100 },
      { id: 'q11-b', label: 'Accept, then recover later.', detail: 'The boundary bends under immediate pressure.', score: 35 },
    ],
    varianceKey: 'shell-boundaries',
  },
  {
    id: 'q12', dimension: 'neuralLatency', format: 'scenario', eyebrow: '12 · SIGNAL TRIAGE',
    prompt: 'Your attention receives five competing pings. What is the first move?',
    helper: 'Fast cognition begins with choosing what not to process.',
    image: getAssetUrl('/images/quiz/q12_focus.jpg'),
    imageAlt: 'Lobster hero swiping away noisy notification bubbles to focus on priority #1',
    scenarioCaption: 'Five pings screaming at once. Locking onto the single true priority.',
    options: [
      { id: 'q12-a', label: 'Name the one live priority.', detail: 'The rest are queued without ceremony.', score: 100 },
      { id: 'q12-b', label: 'Scan each one for danger.', detail: 'A brief survey prevents an avoidable miss.', score: 64 },
      { id: 'q12-c', label: 'Answer the easiest signal.', detail: 'Motion begins wherever friction is lowest.', score: 34 },
      { id: 'q12-d', label: 'Let the pings settle themselves.', detail: 'The system waits for the tide to thin.', score: 12 },
    ],
  },
  {
    id: 'q13', dimension: 'pincerTorque', format: 'binary', eyebrow: '13 · DECISIVE CLOSURE',
    prompt: 'A good-enough solution is ready now; a perfect solution may arrive next week.',
    helper: 'Torque is the ability to close the loop at the right pressure.',
    image: getAssetUrl('/images/quiz/q13_ship_it.jpg'),
    imageAlt: 'Lobster hero launching a working yellow mini-sub with a thumbs up',
    scenarioCaption: 'Ship it! A working shell today beats an imaginary shell next week.',
    options: [
      { id: 'q13-a', label: 'Close, observe, and refine.', detail: 'The first shell is allowed to become a better shell.', score: 100 },
      { id: 'q13-b', label: 'Keep refining before release.', detail: 'The grip stays open until every edge is polished.', score: 30 },
    ],
  },
  {
    id: 'q14', dimension: 'ecdysisDiscipline', format: 'binary', eyebrow: '14 · DAILY SHED',
    prompt: 'At the end of a long cycle, you find one small practice that no longer matches the organism you are becoming.',
    helper: 'The smallest shed can keep the whole shell mobile.',
    image: getAssetUrl('/images/quiz/q14_daily_shed.jpg'),
    imageAlt: 'Lobster hero dropping an obsolete rusty gear into a recycling chamber',
    scenarioCaption: 'Evening calibration. Discarding what no longer serves the ascent.',
    options: [
      { id: 'q14-a', label: 'Retire it tonight and test a replacement.', detail: 'Daily ecdysis keeps calcification intentional.', score: 100 },
      { id: 'q14-b', label: 'Keep it for another cycle.', detail: 'The old practice receives one more chance.', score: 38 },
    ],
  },
  {
    id: 'q15', dimension: 'depthTolerance', format: 'likert', eyebrow: '15 · FINAL DESCENT',
    prompt: 'The harder the problem becomes, the more capable I feel of finding a calm and useful depth from which to solve it.',
    helper: 'Your final reading measures pressure tolerance, not pressure seeking.',
    image: getAssetUrl('/images/quiz/q15_final_descent.jpg'),
    imageAlt: 'Lobster hero glowing calmly in the deep ocean abyss surrounded by glowing jellyfish',
    scenarioCaption: 'Abyssal mastery. The deepest waters bring the greatest clarity.',
    options: likert,
  },
]

const DIMENSION_WEIGHTS: Record<QuizDimension, number> = {
  shellHardness: 0.3,
  pincerTorque: 0.25,
  neuralLatency: 0.2,
  ecdysisDiscipline: 0.15,
  depthTolerance: 0.1,
}

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
        tierName: 'Apex Benthic Dreadnought', tierLevel: 'STAGE IV · TRANSCENDENT', archetype: 'Titan Carapace',
        badgeColor: 'text-[#00ffcc] border-[#00ffcc]/40 bg-[#00ffcc]/10',
        prescription: ['Maintain a protected deep-focus cycle before every major descent.', 'Use decisive closure to turn pressure into forward motion.', 'Transmit one useful shell-building practice to a larval initiate.'],
      }
    : score >= 72
      ? {
          tierName: 'Abyssal Chitin Vanguard', tierLevel: 'STAGE III · HIGH ASCENDANT', archetype: 'Hardened Exoshell',
          badgeColor: 'text-[#00c3ff] border-[#00c3ff]/40 bg-[#00c3ff]/10',
          prescription: ['Increase the weight of one meaningful commitment this cycle.', 'Schedule a deliberate weekly ecdysis for obsolete patterns.', 'Hold your boundaries without sealing the useful doors.'],
        }
      : score >= 50
        ? {
            tierName: 'Bio-Silicon Enforcer', tierLevel: 'STAGE II · CALCIFYING', archetype: 'Reinforced Chitin',
            badgeColor: 'text-[#ffd700] border-[#ffd700]/40 bg-[#ffd700]/10',
            prescription: ['Convert one open loop into a two-minute grip today.', 'Protect a short quiet window for recalibration.', 'Replace one soft habit with a small, repeatable ritual.'],
          }
        : {
            tierName: 'Sub-Surface Moltlet', tierLevel: 'STAGE I · LARVAL DRIFT', archetype: 'Softshell Larva',
            badgeColor: 'text-[#ff453a] border-[#ff453a]/40 bg-[#ff453a]/10',
            prescription: ['Begin with one gentle, achievable shell-building action.', 'Name the signal that deserves your attention and let the rest pass.', 'Treat recovery as part of the ascent, never as a failure of it.'],
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
      submergenceDepth: Math.round(1000 + dimensionScores.depthTolerance * 490),
    },
  }
}
