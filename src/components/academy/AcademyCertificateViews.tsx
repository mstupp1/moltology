import React from 'react'
import { Link } from '@tanstack/react-router'
import { HudTitlePanel } from '@/components/hud/HudTitlePanel'
import {
  ACADEMY_COPY,
  formatIssuedDate,
  type AcademyCertificateCard,
  type AcademyCredentialView,
  type AcademyHomePayload,
} from '@/lib/academy'
import { AcademyEmpty, AcademyNav } from './AcademyChrome'

export function AcademyCertificateIndex({ data }: { data: AcademyHomePayload }) {
  const earned = data.certificates.filter((certificate) => certificate.earned)
  const available = data.certificates.filter((certificate) => !certificate.earned)
  return (
    <div className="space-y-3.5 sm:space-y-5">
      <HudTitlePanel
        eyebrow="Molt Academy"
        title="Certifications"
        description="A course certificate is issued when every lesson is complete. A track certificate is issued when every required course on that path is complete."
        actions={<AcademyNav current="certificates" />}
      />
      <section className="space-y-3" aria-labelledby="earned-heading">
        <h2 id="earned-heading" className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">
          Earned
        </h2>
        {earned.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyEarned}</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {earned.map((certificate) => (
              <CertificateCard key={certificate.slug} certificate={certificate} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3" aria-labelledby="available-heading">
        <h2 id="available-heading" className="font-grotesk text-sm font-bold tracking-wider uppercase text-[#dfe3e3]">
          Available
        </h2>
        {available.length === 0 ? (
          <AcademyEmpty>{ACADEMY_COPY.emptyCertificates}</AcademyEmpty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {available.map((certificate) => (
              <CertificateCard key={certificate.slug} certificate={certificate} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CertificateCard({ certificate }: { certificate: AcademyCertificateCard }) {
  return (
    <article className="chitin-card p-4 chamfer-corner space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-[#00ffff] font-bold">
        {certificate.scope === 'track' ? 'Track certification' : 'Course certification'}
      </p>
      <h3 className="font-grotesk font-bold text-lg text-[#dfe3e3]">{certificate.title}</h3>
      <p className="text-xs text-[#b7c4c3] leading-relaxed">{certificate.description}</p>
      {certificate.subjectTitle && certificate.subjectSlug ? (
        <p className="text-xs text-[#839493]">
          For{' '}
          {certificate.scope === 'track' ? (
            <Link to="/lectures/tracks/$slug" params={{ slug: certificate.subjectSlug }} className="text-[#00ffff] hover:text-white">
              {certificate.subjectTitle}
            </Link>
          ) : (
            <Link to="/lectures/courses/$slug" params={{ slug: certificate.subjectSlug }} className="text-[#00ffff] hover:text-white">
              {certificate.subjectTitle}
            </Link>
          )}
        </p>
      ) : null}
      {certificate.earned && certificate.credentialId ? (
        <Link
          to="/lectures/certificates/$credentialId"
          params={{ credentialId: certificate.credentialId }}
          className="inline-flex text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white"
        >
          Credential {certificate.credentialId}
        </Link>
      ) : (
        <p className="text-xs text-[#839493]">Not earned yet.</p>
      )}
    </article>
  )
}

export function AcademyCredential({ credential }: { credential: AcademyCredentialView }) {
  return (
    <div className="space-y-3.5 sm:space-y-5">
      <HudTitlePanel
        eyebrow="Molt Academy credential"
        title={credential.title}
        description={credential.description}
        actions={<AcademyNav current="certificates" />}
      />
      <article className="chitin-card p-6 sm:p-8 chamfer-corner space-y-4 max-w-3xl">
        <p className="text-[10px] uppercase tracking-widest text-[#00ffff] font-bold">
          {credential.scope === 'track' ? 'Track certification' : 'Course certification'}
        </p>
        <p className="text-sm text-[#dfe3e3]">
          Awarded to <span className="font-bold">{credential.holderName}</span>
        </p>
        <p className="text-sm text-[#b7c4c3]">
          For {credential.subjectTitle}, on {formatIssuedDate(credential.issuedAt)}.
        </p>
        <p className="text-xs text-[#839493]">
          Credential <span className="text-[#dfe3e3] font-bold tracking-widest">{credential.credentialId}</span>
        </p>
        <Link to="/lectures/certificates" className="inline-flex text-[11px] font-bold uppercase tracking-widest text-[#00ffff] hover:text-white">
          Back to certifications
        </Link>
      </article>
    </div>
  )
}
