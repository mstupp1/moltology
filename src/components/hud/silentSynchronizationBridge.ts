import type { EntityBridgeFrameSnapshot, EntityBridgeReader } from '@/components/ai/SynapticEntityCanvas'

const idleSnapshot: EntityBridgeFrameSnapshot = {
  lifecycle: 'idle',
  contentMode: 'prose',
  typingIntensity: 0,
  thinkingTension: 0,
  streamVelocity: 0,
  pulseEnergy: 0.18,
  synapseFlash: 0,
  colorShift: 0,
  totalCharsStreamed: 0,
  lastChunkDelta: '',
}

export function createSilentSynchronizationBridge(): EntityBridgeReader & { setRunning: (running: boolean) => void } {
  const snapshot = { ...idleSnapshot }
  let running = false
  let elapsed = 0
  return {
    setRunning(value) {
      running = value
    },
    getSnapshot: () => snapshot,
    stepFrame(dtSeconds) {
      elapsed += dtSeconds
      snapshot.pulseEnergy = running ? 0.25 + (Math.sin(elapsed * 2) + 1) * 0.15 : 0.08
      snapshot.streamVelocity = running ? 0.3 : 0
      return snapshot
    },
  }
}
