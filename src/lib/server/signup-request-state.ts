import { AsyncLocalStorage } from 'node:async_hooks'
import type { SignupDecision } from '../quality/signup-screen'
import type { SignupTelemetry } from '../signup-telemetry'

export interface SignupRequestState {
  telemetry: SignupTelemetry
}

const telemetryStore = new AsyncLocalStorage<SignupRequestState>()

const pendingDecisions = new Map<string, SignupDecision>()
const PENDING_DECISION_CAP = 200

export function runWithSignupTelemetry<T>(telemetry: SignupTelemetry, fn: () => Promise<T>): Promise<T> {
  return telemetryStore.run({ telemetry }, fn)
}

export function readSignupTelemetry(): SignupTelemetry | null {
  return telemetryStore.getStore()?.telemetry ?? null
}

export function rememberSignupDecision(email: string, decision: SignupDecision): void {
  const key = email.trim().toLowerCase()
  if (!key) return
  pendingDecisions.set(key, decision)
  if (pendingDecisions.size <= PENDING_DECISION_CAP) return
  const oldest = pendingDecisions.keys().next().value
  if (oldest) pendingDecisions.delete(oldest)
}

export function peekSignupDecision(email: string): SignupDecision | null {
  return pendingDecisions.get(email.trim().toLowerCase()) ?? null
}

export function clearSignupDecision(email: string): void {
  pendingDecisions.delete(email.trim().toLowerCase())
}
