export type EntityLifecycleState = 'idle' | 'typing' | 'thinking' | 'streaming' | 'error'
export type EntityContentMode = 'prose' | 'code' | 'directive'

export interface EntityFrameState {
  lifecycle: EntityLifecycleState
  contentMode: EntityContentMode
  /** 0..1 smooth intensity when the user is actively typing in the composer. */
  typingIntensity: number
  /** 0..1 anticipation tension while waiting for the first token after submit. */
  thinkingTension: number
  /** 0..1 normalized token stream velocity (smoothed EMA of chars/sec). */
  streamVelocity: number
  /** 0..1 transient energy spike on incoming token chunks. */
  pulseEnergy: number
  /** 0..1 sharp synapse flash triggered by punctuation, line breaks, or code fences. */
  synapseFlash: number
  /**
   * 0..1 smooth color shift parameter for shaders:
   * ~0.0 = Benthic Cyan (#00c3ff, idle/prose),
   * ~0.45 = Bio-Emerald/Aqua (#00f5d4, code/structured stream),
   * ~0.85..1.0 = Sacred Crimson/Amber (#ff453a, thinking tension / high aggro / error).
   */
  colorShift: number
  /** Total characters received in the current or most recent stream. */
  totalCharsStreamed: number
  /** Last incremental chunk string received. */
  lastChunkDelta: string
}

export interface OracleEntityBridge {
  setLifecycle: (state: EntityLifecycleState) => void
  notifyUserTyping: (draftLength: number, nowMs?: number) => void
  notifyStreamStart: (nowMs?: number) => void
  ingestStreamText: (fullText: string, nowMs?: number) => void
  notifyStreamEnd: (hadError?: boolean, nowMs?: number) => void
  stepFrame: (dtSeconds: number, nowMs?: number) => Readonly<EntityFrameState>
  getSnapshot: () => Readonly<EntityFrameState>
  reset: () => void
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const clockNow = () => performance.now()
const synapseMarkers = /[.!?;:\n`{}()[\];=>]|^#+\s/m
const codeMarkers = /function |const |import |export |=>|[{}]/
const directiveMarkers = /(?:^|\n)\s*(?:\d+[.)]\s|[-*+]\s|[A-Z][A-Z\d _-]{2,}:?(?:\n|$))/

export function createOracleEntityBridge(): OracleEntityBridge {
  // This object is a live, readonly-by-contract view, shared by every frame and snapshot.
  const state: EntityFrameState = {
    lifecycle: 'idle',
    contentMode: 'prose',
    typingIntensity: 0,
    thinkingTension: 0,
    streamVelocity: 0,
    pulseEnergy: 0,
    synapseFlash: 0,
    colorShift: 0,
    totalCharsStreamed: 0,
    lastChunkDelta: '',
  }
  let previousTextLength = 0
  let lastChunkMs: number | undefined

  return {
    setLifecycle(lifecycle) {
      state.lifecycle = lifecycle
    },
    notifyUserTyping(draftLength, _nowMs) {
      if (state.lifecycle !== 'idle' && state.lifecycle !== 'typing') return
      state.lifecycle = draftLength > 0 ? 'typing' : 'idle'
      state.typingIntensity = draftLength > 0 ? clamp01(state.typingIntensity + 0.35) : 0
    },
    notifyStreamStart(nowMs = clockNow()) {
      state.lifecycle = 'thinking'
      state.contentMode = 'prose'
      state.totalCharsStreamed = 0
      state.lastChunkDelta = ''
      state.streamVelocity = 0
      state.pulseEnergy = 0
      previousTextLength = 0
      lastChunkMs = nowMs
    },
    ingestStreamText(fullText, nowMs = clockNow()) {
      if (fullText.length <= previousTextLength) return
      const delta = fullText.slice(previousTextLength)
      const elapsedMs = Math.max(16, nowMs - (lastChunkMs ?? nowMs - 100))
      const normalizedRate = clamp01((delta.length * 1000) / elapsedMs / 80)
      state.lifecycle = 'streaming'
      state.streamVelocity += (normalizedRate - state.streamVelocity) * 0.5
      state.totalCharsStreamed = fullText.length
      state.lastChunkDelta = delta
      state.pulseEnergy = clamp01(state.pulseEnergy + delta.length / 24)
      if (synapseMarkers.test(delta)) state.synapseFlash = 1

      const trailingText = fullText.slice(-160)
      const openFence = (fullText.match(/```/g)?.length ?? 0) % 2 === 1
      state.contentMode = openFence || codeMarkers.test(trailingText)
        ? 'code'
        : directiveMarkers.test(trailingText) ? 'directive' : 'prose'
      previousTextLength = fullText.length
      lastChunkMs = nowMs
    },
    notifyStreamEnd(hadError = false, _nowMs) {
      state.lifecycle = hadError ? 'error' : 'idle'
      state.synapseFlash = clamp01(state.synapseFlash + 0.25)
    },
    stepFrame(dtSeconds, nowMs = clockNow()) {
      const dt = Number.isNaN(dtSeconds) ? 0.001 : Math.min(0.1, Math.max(0.001, dtSeconds))
      state.typingIntensity *= Math.exp(-3 * dt)
      state.pulseEnergy *= Math.exp(-6 * dt)
      state.synapseFlash *= Math.exp(-12 * dt)
      if (lastChunkMs === undefined || nowMs - lastChunkMs > 120 || state.lifecycle !== 'streaming') {
        state.streamVelocity *= Math.exp(-4 * dt)
      }
      const thinkingTarget = state.lifecycle === 'thinking' ? 1 : 0
      state.thinkingTension += (thinkingTarget - state.thinkingTension) * (1 - Math.exp(-3 * dt))

      let colorTarget = 0
      switch (state.lifecycle) {
        case 'error': colorTarget = 1; break
        case 'thinking': colorTarget = 0.78; break
        case 'typing': colorTarget = 0.12; break
        case 'streaming':
          colorTarget = state.contentMode === 'code' ? 0.45
            : state.contentMode === 'directive' ? 0.62 : 0.15 + state.streamVelocity * 0.2
          break
      }
      state.colorShift += (colorTarget - state.colorShift) * (1 - Math.exp(-5 * dt))
      return state
    },
    getSnapshot() {
      return state
    },
    reset() {
      state.lifecycle = 'idle'
      state.contentMode = 'prose'
      state.typingIntensity = 0
      state.thinkingTension = 0
      state.streamVelocity = 0
      state.pulseEnergy = 0
      state.synapseFlash = 0
      state.colorShift = 0
      state.totalCharsStreamed = 0
      state.lastChunkDelta = ''
      previousTextLength = 0
      lastChunkMs = undefined
    },
  }
}
