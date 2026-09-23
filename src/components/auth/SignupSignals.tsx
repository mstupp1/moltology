import { useEffect, useRef, useState } from 'react'
import { SIGNUP_HONEYPOT_FIELD } from '@/lib/signup-telemetry'

export function useSignupSignals(active: boolean) {
  const [honeypot, setHoneypot] = useState('')
  const startedAt = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      startedAt.current = null
      return
    }
    startedAt.current = Date.now()
  }, [active])

  return {
    honeypot,
    setHoneypot,
    fields() {
      const elapsedMs = startedAt.current == null ? null : Date.now() - startedAt.current
      return {
        [SIGNUP_HONEYPOT_FIELD]: honeypot,
        ...(elapsedMs == null ? {} : { signupElapsedMs: elapsedMs }),
      }
    },
  }
}

export function SignupHoneypot({
  active,
  value,
  onChange,
}: {
  active: boolean
  value: string
  onChange: (value: string) => void
}) {
  if (!active) return null
  return (
    <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <label htmlFor="signup-confirm-website">Website</label>
      <input
        id="signup-confirm-website"
        name={SIGNUP_HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
