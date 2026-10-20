import React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, Lock } from 'lucide-react'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import { BrandIcon } from '@/components/ui/BrandMark'
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
  AcademyNav,
  AcademySectionHeading,
} from './AcademyChrome'

export function AcademyCertificateIndex({ data }: { data: AcademyHomePayload }) {
  const earned = data.certificates.filter((certificate) => certificate.earned)
  const available = data.certificates.filter((certificate) => !certificate.earned)
  return (
    <div className="space-y-5 sm:space-y-6">
      <HudTitlePanel
        eyebrow="Molt Academy"
        title="Certifications"
        description="A course certificate is issued when every lesson is complete. A track certificate is issued when every required course on that path is complete."
        actions={<AcademyNav current="certificates" />}
      />
      <section className="space-y-3" aria-labelledby="earned-heading">
        <AcademySectionHeading
          id="earned-heading"
          title="Earned"
          subtitle={earned.length > 0 ? `${earned.length} issued in your name.` : undefined}
        />
        {earned.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyEarned}</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {earned.map((certificate) => (
              <EarnedCard key={certificate.slug} certificate={certificate} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3" aria-labelledby="available-heading">
        <AcademySectionHeading id="available-heading" title="Available" subtitle={available.length > 0 ? 'Finish the work below to earn these.' : undefined} />
        {available.length === 0 ? (
          <AcademyEmpty>{data.certificates.length === 0 ? ACADEMY_COPY.emptyCertificates : 'You have earned every certification on offer.'}</AcademyEmpty>
        ) : (
          <ul className={cn(ACADEMY_CARD, 'divide-y divide-line-subtle')}>
            {available.map((certificate) => (
              <AvailableRow key={certificate.slug} certificate={certificate} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function scopeLabel(certificate: { scope: AcademyCertificateCard['scope'] }) {
  return certificate.scope === 'track' ? 'Track certification' : 'Course certification'
}

function EarnedCard({ certificate }: { certificate: AcademyCertificateCard }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-card bg-cyan-soft text-cyan-glow">
          <Award className="w-5 h-5" aria-hidden="true" />
        </span>
        {certificate.issuedAt ? (
          <span className="text-[11px] text-ink-muted">Issued {formatIssuedDate(certificate.issuedAt)}</span>
        ) : null}
      </div>
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">{scopeLabel(certificate)}</p>
        <h3 className="font-grotesk font-bold text-lg text-ink leading-snug">{certificate.title}</h3>
        {certificate.subjectTitle ? <p className="text-xs text-ink-body">For {certificate.subjectTitle}</p> : null}
      </div>
      {certificate.credentialId ? (
        <p className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-line-subtle">
          <span className="font-mono text-[11px] tracking-[0.08em] text-ink-muted">{certificate.credentialId}</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-glow">
            View credential
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </p>
      ) : null}
    </>
  )
  if (!certificate.credentialId) {
    return <article className={cn(ACADEMY_CARD, 'p-4 flex flex-col gap-3')}>{content}</article>
  }
  return (
    <Link
      to="/lectures/certificates/$credentialId"
      params={{ credentialId: certificate.credentialId }}
      className={cn(ACADEMY_CARD_LINK, 'group p-4 flex flex-col gap-3')}
    >
      {content}
    </Link>
  )
}

function AvailableRow({ certificate }: { certificate: AcademyCertificateCard }) {
  return (
    <li className="flex items-start gap-3 p-4">
      <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-control bg-surface-2 text-ink-muted">
        <Lock className="w-4 h-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted font-bold">{scopeLabel(certificate)}</p>
        <h3 className="font-grotesk font-bold text-ink">{certificate.title}</h3>
        <p className="text-xs text-ink-body leading-relaxed">{certificate.description}</p>
      </div>
      {certificate.subjectTitle && certificate.subjectSlug ? (
        certificate.scope === 'track' ? (
          <Link
            to="/lectures/tracks/$slug"
            params={{ slug: certificate.subjectSlug }}
            className={cn('shrink-0 self-center inline-flex items-center gap-1 min-h-8 px-2 rounded-control text-xs font-bold text-cyan-glow hover:bg-surface-2', ACADEMY_FOCUS)}
          >
            <span className="hidden sm:inline">Open track</span>
            <ArrowRight className="w-3.5 h-3.5" aria-label="Open track" />
          </Link>
        ) : (
          <Link
            to="/lectures/courses/$slug"
            params={{ slug: certificate.subjectSlug }}
            className={cn('shrink-0 self-center inline-flex items-center gap-1 min-h-8 px-2 rounded-control text-xs font-bold text-cyan-glow hover:bg-surface-2', ACADEMY_FOCUS)}
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
    <div className="space-y-4 sm:space-y-5">
      <AcademyCrumbs
        items={[
          {
            label: 'Certifications',
            link: (
              <Link to="/lectures/certificates" className={ACADEMY_CRUMB_LINK}>
                Certifications
              </Link>
            ),
          },
          { label: credential.credentialId },
        ]}
      />
      <article className="relative mx-auto max-w-3xl overflow-hidden rounded-panel border border-line-subtle bg-surface-1 hud-sheen">
        <span
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,195,255,0.10),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative m-2 sm:m-3 rounded-card border border-line-subtle px-5 py-8 sm:px-12 sm:py-12 text-center space-y-5">
          <BrandIcon className="mx-auto w-12 h-12" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-glow">Molt Academy</p>
            <p className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">{scopeLabel(credential)}</p>
          </div>
          <h1 className="font-grotesk font-extrabold text-2xl sm:text-4xl text-ink leading-tight">{credential.title}</h1>
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-[0.08em] text-ink-muted">Awarded to</p>
            <p className="font-grotesk font-bold text-xl sm:text-2xl text-ink">{credential.holderName}</p>
          </div>
          <p className="text-sm text-ink-body leading-relaxed max-w-lg mx-auto">{credential.description}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-line-subtle text-left sm:text-center">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">For</dt>
              <dd className="text-sm text-ink">
                {credential.scope === 'track' ? (
                  <Link to="/lectures/tracks/$slug" params={{ slug: credential.subjectSlug }} className={cn('text-cyan-glow hover:text-cyan-hover rounded-control', ACADEMY_FOCUS)}>
                    {credential.subjectTitle}
                  </Link>
                ) : (
                  <Link to="/lectures/courses/$slug" params={{ slug: credential.subjectSlug }} className={cn('text-cyan-glow hover:text-cyan-hover rounded-control', ACADEMY_FOCUS)}>
                    {credential.subjectTitle}
                  </Link>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">Issued</dt>
              <dd className="text-sm text-ink">{formatIssuedDate(credential.issuedAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-muted">Credential</dt>
              <dd className="font-mono text-sm tracking-[0.08em] text-ink">{credential.credentialId}</dd>
            </div>
          </dl>
        </div>
      </article>
    </div>
  )
}
