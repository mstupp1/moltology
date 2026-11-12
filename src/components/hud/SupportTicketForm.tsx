import React, { useState } from 'react'
import { CheckCircle2, LogIn, Mail, Send } from 'lucide-react'
import { AuthModal } from '@/components/AuthModal'
import { TurnstileWidget, type TurnstileWidgetRef } from '@/components/TurnstileWidget'
import { useOptionalToast } from '@/components/ui/ToastProvider'
import { HudButton } from '@/components/ui/HudButton'
import { HudGhostCard } from '@/components/ui/HudGhostLoader'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getAuthJWTToken } from '@/lib/jwt'
import { createSupportTicketFn } from '@/lib/server/api'
import {
  SUPPORT_TICKET_BODY_MAX,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_CATEGORY_LABELS,
  SUPPORT_TICKET_COPY,
  SUPPORT_INBOX,
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
  'w-full min-h-10 rounded-control bg-surface-2 border border-line hover:border-line-hover focus:border-cyan-glow focus:shadow-field-focus text-sm text-ink placeholder:text-ink-muted p-2.5 outline-hidden transition-colors'

export default function SupportTicketForm() {
  const session = useAuthSession()
  const toast = useOptionalToast()?.toast
  const turnstileRef = React.useRef<TurnstileWidgetRef>(null)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<SupportTicketCategoryId>('ACCOUNT')
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
        <div className="bg-surface-2 border border-line-subtle p-6 rounded-card text-center space-y-3">
          <Mail className="w-8 h-8 text-cyan-glow mx-auto" aria-hidden="true" />
          <h3 className="font-grotesk text-sm font-bold text-ink uppercase tracking-wider">
            {SUPPORT_TICKET_COPY.guestTitle}
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
            {SUPPORT_TICKET_COPY.guestBody}
          </p>
          <p>
            <a
              href={`mailto:${SUPPORT_INBOX}`}
              className="text-sm font-semibold text-cyan-glow hover:text-ink underline underline-offset-4 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
            >
              {SUPPORT_INBOX}
            </a>
          </p>
          <div className="pt-2 space-y-2">
            <HudButton
              type="button"
              onClick={() => window.location.assign(`mailto:${SUPPORT_INBOX}`)}
              icon={<Mail className="w-4 h-4" />}
            >
              {SUPPORT_TICKET_COPY.guestEmail}
            </HudButton>
            <div>
              <HudButton type="button" variant="ghost" onClick={() => openAuth('login')} icon={<LogIn className="w-3.5 h-3.5" />}>
                {SUPPORT_TICKET_COPY.guestSignIn}
              </HudButton>
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
        className="bg-cyan-soft border border-cyan-glow/40 p-6 rounded-card text-center space-y-2"
        data-testid="support-ticket-success"
      >
        <CheckCircle2 className="w-10 h-10 text-cyan-glow mx-auto" />
        <h3 className="font-grotesk text-sm font-bold text-ink uppercase">
          {SUPPORT_TICKET_COPY.successTitle}
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed max-w-md mx-auto">
          {ticketReference
            ? SUPPORT_TICKET_COPY.successBody(ticketReference)
            : SUPPORT_TICKET_COPY.successTitle}
        </p>
        {ticketReference ? (
          <p className="font-grotesk text-xs font-bold text-cyan-glow tracking-wider" data-testid="support-ticket-reference">
            {ticketReference}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-4 max-w-2xl" data-testid="support-ticket-form">
      <p className="text-xs text-ink-muted leading-relaxed">{SUPPORT_TICKET_COPY.formHint}</p>

      <div className="space-y-2">
        <label className="text-xs text-ink-muted font-bold block" htmlFor="support-ticket-subject">
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
        <div className="space-y-2">
          <label className="text-xs text-ink-muted font-bold block" htmlFor="support-ticket-category">
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
        <div className="space-y-2">
          <label className="text-xs text-ink-muted font-bold block" htmlFor="support-ticket-urgency">
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

      <div className="space-y-2">
        <label className="text-xs text-ink-muted font-bold block" htmlFor="support-ticket-body">
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
          className={`${fieldClass} resize-y`}
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
        <p className="text-xs text-crimson-text" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <HudButton type="submit" disabled={isSubmitting} icon={<Send className="w-4 h-4" />}>
        {isSubmitting ? SUPPORT_TICKET_COPY.submitting : SUPPORT_TICKET_COPY.submit}
      </HudButton>

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
