import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, Lock } from 'lucide-react'
import { GlowEmblem } from '@/components/ui/GlowEmblem'
import {
  ACADEMY_COPY,
  formatIssuedDate,
  type AcademyCertificateCard,
  type AcademyCredentialView,
  type AcademyHomePayload,
} from '@/lib/academy'
import { cn } from '@/lib/utils'
import {
  ACADEMY_CARD,
  ACADEMY_CARD_LINK,
  ACADEMY_CRUMB_LINK,
  ACADEMY_FOCUS,
  AcademyCrumbs,
  AcademyEmpty,
  AcademySectionHeading,
  useAcademyGuestEnroll,
} from './AcademyChrome'
import { HudButton } from '@/components/ui/HudButton'

export function AcademyCertificateIndex({ data }: { data: AcademyHomePayload }) {
  const earned = data.certificates.filter((certificate) => certificate.earned)
  const available = data.certificates.filter((certificate) => !certificate.earned)
  // The list is public; signed-out visitors get sign-up prompts where earning would start.
  const guest = useAcademyGuestEnroll()
  if (data.certificates.length === 0) {
    return (
      // The Academy band (title, tabs) is drawn by the academy/_sections layout route.
      <AcademyEmpty>{guest.isGuest ? ACADEMY_COPY.emptyCertificatesGuest : ACADEMY_COPY.emptyCertificates}</AcademyEmpty>
    )
  }
  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5">
      {/* The Academy band (title, tabs) is drawn by the academy/_sections layout route. */}
      <section className="space-y-3" aria-labelledby="earned-heading">
        <AcademySectionHeading id="earned-heading" title="Earned" />
        {guest.isGuest ? (
          <div className={cn(ACADEMY_CARD, 'p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3')}>
            <p className="text-sm text-ink-body flex-1">{ACADEMY_COPY.guestEarnedCertificates}</p>
            <HudButton type="button" variant="primary" size="sm" onClick={guest.promptSignUp}>
              {ACADEMY_COPY.guestSignUp}
            </HudButton>
          </div>
        ) : earned.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyEarned}</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 lg:gap-5">
            {earned.map((certificate) => (
              <EarnedCard key={certificate.slug} certificate={certificate} />
            ))}
          </div>
        )}
      </section>
      {available.length > 0 ? (
        <section className="space-y-3" aria-labelledby="available-heading">
          <AcademySectionHeading id="available-heading" title="Available" />
          <ul className={cn(ACADEMY_CARD, 'divide-y divide-line-subtle')}>
            {available.map((certificate) => (
              <AvailableRow
                key={certificate.slug}
                certificate={certificate}
                onSignUp={guest.isGuest ? guest.promptSignUp : undefined}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {guest.modal}
    </div>
  )
}

function scopeLabel(certificate: { scope: AcademyCertificateCard['scope'] }) {
  return certificate.scope === 'track' ? 'Track certificate' : 'Course certificate'
}

function EarnedCard({ certificate }: { certificate: AcademyCertificateCard }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-card bg-cyan-soft text-cyan-glow">
          <Award className="w-5 h-5" aria-hidden="true" />
        </span>
        {certificate.issuedAt ? (
          <span className="text-2xs text-ink-muted">Issued {formatIssuedDate(certificate.issuedAt)}</span>
        ) : null}
      </div>
      <div className="space-y-1">
        <h3 className="font-grotesk font-semibold text-lg text-ink leading-snug">{certificate.title}</h3>
        {certificate.subjectTitle ? <p className="text-xs text-ink-muted">For {certificate.subjectTitle}</p> : null}
      </div>
      {certificate.credentialId ? (
        <p className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-line-subtle">
          <span className="font-mono text-2xs text-ink-muted">{certificate.credentialId}</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-glow">
            View credential
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </p>
      ) : null}
    </>
  )
  if (!certificate.credentialId) {
    return <article className={cn(ACADEMY_CARD, 'p-3 sm:p-4 flex flex-col gap-3')}>{content}</article>
  }
  return (
    <Link
      to="/academy/certificates/$credentialId"
      params={{ credentialId: certificate.credentialId }}
      className={cn(ACADEMY_CARD_LINK, 'group p-3 sm:p-4 flex flex-col gap-3')}
    >
      {content}
    </Link>
  )
}

function AvailableRow({ certificate, onSignUp }: { certificate: AcademyCertificateCard; onSignUp?: () => void }) {
  if (onSignUp) {
    return (
      <li className="flex items-start gap-3 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-ink-muted">
          <Award className="w-4 h-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-grotesk font-semibold text-ink">{certificate.title}</h3>
          <p className="text-xs text-ink-body leading-relaxed">{certificate.description}</p>
        </div>
        <HudButton type="button" variant="secondary" size="sm" className="shrink-0 self-center" onClick={onSignUp}>
          {ACADEMY_COPY.guestEarnCertificate}
        </HudButton>
      </li>
    )
  }
  return (
    <li className="flex items-start gap-3 px-3 py-2 sm:px-4 sm:py-2.5">
      <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-ink-muted">
        <Lock className="w-4 h-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-grotesk font-semibold text-ink">{certificate.title}</h3>
        <p className="text-xs text-ink-body leading-relaxed">{certificate.description}</p>
      </div>
      {certificate.subjectTitle && certificate.subjectSlug ? (
        certificate.scope === 'track' ? (
          <Link
            to="/academy/tracks/$slug"
            params={{ slug: certificate.subjectSlug }}
            className={cn('shrink-0 self-center inline-flex items-center gap-1 min-h-8 px-2 rounded-control text-xs font-semibold text-cyan-glow hover:bg-surface-2', ACADEMY_FOCUS)}
          >
            <span className="hidden sm:inline">Open track</span>
            <ArrowRight className="w-3.5 h-3.5" aria-label="Open track" />
          </Link>
        ) : (
          <Link
            to="/academy/courses/$slug"
            params={{ slug: certificate.subjectSlug }}
            className={cn('shrink-0 self-center inline-flex items-center gap-1 min-h-8 px-2 rounded-control text-xs font-semibold text-cyan-glow hover:bg-surface-2', ACADEMY_FOCUS)}
          >
            <span className="hidden sm:inline">Open course</span>
            <ArrowRight className="w-3.5 h-3.5" aria-label="Open course" />
          </Link>
        )
      ) : null}
    </li>
  )
}

export function AcademyCredential({ credential }: { credential: AcademyCredentialView }) {
  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-5">
      <AcademyCrumbs
        items={[
          {
            label: 'Certificates',
            link: (
              <Link to="/academy/certificates" className={ACADEMY_CRUMB_LINK}>
                Certificates
              </Link>
            ),
          },
          { label: credential.credentialId },
        ]}
      />
      <article className="relative mx-auto max-w-3xl overflow-hidden rounded-panel border border-line-subtle bg-surface-1 hud-sheen">
        <div className="relative m-2 sm:m-3 rounded-card border border-line-subtle px-5 py-8 sm:px-12 sm:py-12 text-center space-y-5">
          <GlowEmblem size={64} className="mt-2" />
          <div className="space-y-1">
            <p className="eyebrow">Molt Academy</p>
            <p className="eyebrow">{scopeLabel(credential)}</p>
          </div>
          <h1 className="font-grotesk font-semibold text-2xl sm:text-4xl text-ink leading-tight">{credential.title}</h1>
          <div className="space-y-1.5">
            <p className="eyebrow">Awarded to</p>
            <p className="font-grotesk font-semibold text-xl sm:text-2xl text-ink">{credential.holderName}</p>
          </div>
          <p className="text-sm text-ink-body leading-relaxed max-w-lg mx-auto">{credential.description}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-line-subtle text-left sm:text-center">
            <div>
              <dt className="eyebrow">For</dt>
              <dd className="text-sm text-ink">
                {credential.scope === 'track' ? (
                  <Link to="/academy/tracks/$slug" params={{ slug: credential.subjectSlug }} className={cn('text-cyan-glow hover:text-cyan-hover rounded-control', ACADEMY_FOCUS)}>
                    {credential.subjectTitle}
                  </Link>
                ) : (
                  <Link to="/academy/courses/$slug" params={{ slug: credential.subjectSlug }} className={cn('text-cyan-glow hover:text-cyan-hover rounded-control', ACADEMY_FOCUS)}>
                    {credential.subjectTitle}
                  </Link>
                )}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Issued</dt>
              <dd className="text-sm text-ink">{formatIssuedDate(credential.issuedAt)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Credential</dt>
              <dd className="font-mono text-sm text-ink">{credential.credentialId}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  )
}
