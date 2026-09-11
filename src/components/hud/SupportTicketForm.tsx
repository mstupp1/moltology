import React, { useState } from 'react'
import { CheckCircle2, Lock, LogIn, Send, UserPlus } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { HudGhostCard } from '@/components/ui/HudGhostLoader'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { createSupportTicketFn } from '@/lib/server/api'
import {
  SUPPORT_TICKET_BODY_MAX,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_CATEGORY_LABELS,
  SUPPORT_TICKET_COPY,
  SUPPORT_TICKET_HONEYPOT_FIELD,
  SUPPORT_TICKET_TURNSTILE_ACTION,
  SUPPORT_TICKET_URGENCIES,
  SUPPORT_TICKET_URGENCY_LABELS,
  formatSupportTicketReference,
  validateSupportTicketFields,
  type SupportTicketCategoryId,
  type SupportTicketUrgencyId,
} from '@/lib/support-tickets'

const fieldClass =
  'w-full bg-[#030606] border border-[#3a4a49] focus:border-[#00ffff] text-xs text-[#dfe3e3] p-2.5 outline-none chamfer-corner'

export default function SupportTicketForm() {
  const session = useAuthSession()
  const toast = useOptionalToast()?.toast
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<SupportTicketCategoryId>('SHELL_INTEGRITY')
  const [urgency, setUrgency] = useState<SupportTicketUrgencyId>('NORMAL')
  const [body, setBody] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [ticketReference, setTicketReference] = useState<string | null>(null)
  const [received, setReceived] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup')

  const openAuth = (mode: 'signup' | 'login') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  if (session.isPending) {
    return <HudGhostCard lines={4} />
  }

  if (session.isGuest || !session.userId) {
    return (
      <div className="space-y-4" data-testid="support-ticket-guest">
        <div className="bg-[#091113]/80 border border-[#3a4a49] p-6 chamfer-corner text-center space-y-3">
          <Lock className="w-8 h-8 text-[#ff5540] mx-auto" />
          <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase tracking-wider">
            {SUPPORT_TICKET_COPY.guestTitle}
          </h3>
          <p className="text-xs text-[#839493] max-w-md mx-auto leading-relaxed">
            {SUPPORT_TICKET_COPY.guestBody}
          </p>
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="px-5 py-2.5 bg-[#ff453a] hover:bg-[#ff5540] text-white font-bold text-xs chamfer-corner inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{SUPPORT_TICKET_COPY.guestSignUp}</span>
            </button>
            <div>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="text-xs text-[#00c3ff] hover:text-white underline underline-offset-4"
              >
                <span className="inline-flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5" />
                  {SUPPORT_TICKET_COPY.guestSignIn}
                </span>
              </button>
            </div>
          </div>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)

    const validated = validateSupportTicketFields({ subject, body })
    if (!validated.ok) {
      setErrorMessage(validated.error)
      return
    }

    if (!turnstileToken) {
      setErrorMessage(SUPPORT_TICKET_COPY.botCheckFailed)
      return
    }

    setIsSubmitting(true)
    try {
      const token = await getAuthJWTToken()
      const result = await createSupportTicketFn({
        data: {
          subject: validated.subject,
          body: validated.body,
          category,
          urgency,
          turnstileToken,
          [SUPPORT_TICKET_HONEYPOT_FIELD]: honeypot,
          userId: session.userId ?? undefined,
          token: token ?? undefined,
        },
      })

      setReceived(true)
      setTicketReference(result?.ticketReference ? formatSupportTicketReference(result.ticketReference) : null)
      setSubject('')
      setBody('')
      setTurnstileToken(null)
      turnstileRef.current?.reset()
      toast?.success(SUPPORT_TICKET_COPY.toastReceived, { id: 'support-ticket-received' })
    } catch (error: unknown) {
      turnstileRef.current?.reset()
      setTurnstileToken(null)
      const message = error instanceof Error ? error.message : SUPPORT_TICKET_COPY.genericError
      setErrorMessage(message)
      toast?.error(message, { id: 'support-ticket-failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (received) {
    return (
      <div
        className="bg-[#00ffff]/10 border border-[#00ffff] p-6 chamfer-corner text-center space-y-2"
        data-testid="support-ticket-success"
      >
        <CheckCircle2 className="w-10 h-10 text-[#00ffff] mx-auto" />
        <h3 className="font-grotesk text-sm font-bold text-[#dfe3e3] uppercase">
          {SUPPORT_TICKET_COPY.successTitle}
        </h3>
        <p className="text-xs text-[#839493] leading-relaxed max-w-md mx-auto">
          {ticketReference
            ? SUPPORT_TICKET_COPY.successBody(ticketReference)
            : SUPPORT_TICKET_COPY.successTitle}
        </p>
        {ticketReference ? (
          <p className="font-grotesk text-xs font-bold text-[#00ffff] tracking-wider" data-testid="support-ticket-reference">
            {ticketReference}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4 max-w-2xl" data-testid="support-ticket-form">
      <p className="text-xs text-[#839493] leading-relaxed">{SUPPORT_TICKET_COPY.formHint}</p>

      <div className="space-y-1">
        <label className="text-xs text-[#839493] font-bold block uppercase" htmlFor="support-ticket-subject">
          {SUPPORT_TICKET_COPY.subjectLabel}
        </label>
        <input
          id="support-ticket-subject"
          type="text"
          required
          maxLength={160}
          placeholder={SUPPORT_TICKET_COPY.subjectPlaceholder}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#839493] font-bold block uppercase" htmlFor="support-ticket-category">
            {SUPPORT_TICKET_COPY.categoryLabel}
          </label>
          <select
            id="support-ticket-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as SupportTicketCategoryId)}
            className={fieldClass}
          >
            {SUPPORT_TICKET_CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {SUPPORT_TICKET_CATEGORY_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#839493] font-bold block uppercase" htmlFor="support-ticket-urgency">
            {SUPPORT_TICKET_COPY.urgencyLabel}
          </label>
          <select
            id="support-ticket-urgency"
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as SupportTicketUrgencyId)}
            className={fieldClass}
          >
            {SUPPORT_TICKET_URGENCIES.map((id) => (
              <option key={id} value={id}>
                {SUPPORT_TICKET_URGENCY_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-[#839493] font-bold block uppercase" htmlFor="support-ticket-body">
          {SUPPORT_TICKET_COPY.bodyLabel}
        </label>
        <textarea
          id="support-ticket-body"
          required
          rows={5}
          maxLength={SUPPORT_TICKET_BODY_MAX}
          placeholder={SUPPORT_TICKET_COPY.bodyPlaceholder}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="support-ticket-bait">{SUPPORT_TICKET_COPY.honeypotLabel}</label>
        <input
          id="support-ticket-bait"
          name={SUPPORT_TICKET_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {errorMessage ? (
        <p className="text-xs text-[#ff5540]" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2.5 bg-[#00ffff]/15 hover:bg-[#00ffff]/25 border border-[#00ffff] text-[#00ffff] font-bold text-xs flex items-center gap-2 chamfer-corner transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)] active:scale-95 disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        <span>{isSubmitting ? SUPPORT_TICKET_COPY.submitting : SUPPORT_TICKET_COPY.submit}</span>
      </button>

      <TurnstileWidget
        ref={turnstileRef}
        action={SUPPORT_TICKET_TURNSTILE_ACTION}
        size="flexible"
        onVerify={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
      />
    </form>
  )
}
