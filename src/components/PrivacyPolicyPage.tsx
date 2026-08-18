/**
 * ============================================================================
 * CRITICAL DEVELOPMENT RULES & COPY GUIDELINES:
 * 1. NEVER reference our underlying tech stack (e.g., Neon, Postgres, JWT, RLS, BetterAuth, etc.) in user-facing UI or copy.
 * 2. NEVER reference "satire", "parody", or meta-humor in user-facing UI or copy.
 * 3. ALL copy and messaging must strictly embody the in-universe lore of Moltology, the Benthic Core, and the Synaptic Path.
 * ============================================================================
 */
import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Shield, Eye, Lock, Database, Trash2, Mail } from 'lucide-react'
import { PublicHeader } from '@/components/PublicHeader'
import { MainFooter } from '@/components/MainFooter'

const CURRENT_YEAR = 2025

const Section: React.FC<{ id: string; icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  id,
  icon,
  title,
  children,
}) => (
  <section id={id} className="mb-12 scroll-mt-24">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-cyan-900/40">
      <div className="text-cyan-400">{icon}</div>
      <h2 className="text-sm font-bold text-cyan-300 tracking-widest uppercase">{title}</h2>
    </div>
    <div className="text-sm text-gray-400 leading-relaxed space-y-3">{children}</div>
  </section>
)

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f0f] text-[#dfe3e3] font-mono">
      <PublicHeader />

      {/* Hero */}
      <div className="relative pt-28 pb-12 px-6 text-center border-b border-cyan-950/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="inline-flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/40 rounded-full px-4 py-1.5 text-[10px] text-cyan-400 tracking-widest uppercase mb-6">
          <Shield className="w-3 h-3" />
          <span>Data Sovereignty Protocol</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
          BENTHIC DATA COVENANT
        </h1>
        <p className="text-xs text-gray-500 max-w-xl mx-auto">
          Privacy Policy — Moltology System Inc. &nbsp;|&nbsp; Effective: January 1, {CURRENT_YEAR}
        </p>
      </div>

      {/* Layout */}
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
        {/* Sticky sidebar TOC */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1 text-[10px] text-gray-500 tracking-widest uppercase">
            <p className="text-cyan-500 font-bold mb-3">Contents</p>
            {[
              ['#collection', 'Data Harvested'],
              ['#use', 'Utilization'],
              ['#sharing', 'Disclosure'],
              ['#retention', 'Retention'],
              ['#rights', 'Your Rights'],
              ['#security', 'Security'],
              ['#cookies', 'Cookies'],
              ['#children', 'Children'],
              ['#changes', 'Changes'],
              ['#contact', 'Contact'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block py-1 hover:text-cyan-400 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* Body */}
        <article className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-10 leading-relaxed">
            This Privacy Policy describes how Moltology System Inc. ("Moltology," "we," "us," or "our") collects,
            uses, and shares information when you access our platform, services, or digital experiences (collectively,
            the "Services"). By using the Services you agree to this Policy.
          </p>

          <Section id="collection" icon={<Database className="w-4 h-4" />} title="Data Harvested from Initiates">
            <p>We collect the following categories of information:</p>
            <ul className="list-none space-y-2 mt-2">
              {[
                ['Account Data', 'Email address, username, and password hash provided at registration.'],
                ['Profile Data', 'Display name, avatar, ascension tier, and any optional bio you provide.'],
                ['Usage Data', 'Pages visited, features used, session duration, click patterns, and interaction logs.'],
                ['Device & Technical Data', 'IP address, browser type, operating system, and device identifiers.'],
                ['Communications', 'Messages you send through support channels or community features.'],
                ['Payment Data', 'For paid features, payment is processed by third-party providers (e.g., Stripe). We do not store full card numbers.'],
              ].map(([label, desc]) => (
                <li key={label as string} className="pl-4 border-l border-cyan-900/50">
                  <span className="text-cyan-400 font-bold">{label}: </span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="use" icon={<Eye className="w-4 h-4" />} title="Utilization of Collected Data">
            <p>We use collected information to:</p>
            <ul className="space-y-1 mt-2 list-disc list-inside">
              <li>Provide, maintain, and improve the Services.</li>
              <li>Authenticate users and enforce account security.</li>
              <li>Personalize your experience and track ascension progress.</li>
              <li>Send transactional emails (account verification, password reset).</li>
              <li>Send optional marketing communications where you have consented.</li>
              <li>Detect, investigate, and prevent fraud or abuse.</li>
              <li>Comply with applicable laws and legal obligations.</li>
              <li>Conduct analytics to understand aggregate usage patterns.</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information to third parties.
            </p>
          </Section>

          <Section id="sharing" icon={<Shield className="w-4 h-4" />} title="Disclosure to External Entities">
            <p>We may share your information with:</p>
            <ul className="space-y-2 mt-2 list-disc list-inside">
              <li><span className="text-cyan-400 font-bold">Service Providers:</span> Trusted vendors (hosting, payments, email delivery, analytics) under contractual data-protection obligations.</li>
              <li><span className="text-cyan-400 font-bold">Legal Authorities:</span> When required by law, court order, or to protect the rights and safety of users or the public.</li>
              <li><span className="text-cyan-400 font-bold">Business Transfers:</span> In the event of a merger, acquisition, or sale of assets, your data may be transferred subject to equivalent privacy protections.</li>
            </ul>
            <p className="mt-3">We do not share personal data for third-party advertising purposes.</p>
          </Section>

          <Section id="retention" icon={<Trash2 className="w-4 h-4" />} title="Data Retention Protocols">
            <p>
              We retain personal data only for as long as necessary to fulfill the purposes described in this Policy,
              or as required by law. Account data is retained for the life of your account. Upon account deletion,
              personal identifiers are purged within 90 days, except where retention is required for legal compliance,
              fraud prevention, or dispute resolution.
            </p>
          </Section>

          <Section id="rights" icon={<Lock className="w-4 h-4" />} title="Your Rights & Controls">
            <p>Depending on your jurisdiction, you may have rights including:</p>
            <ul className="space-y-1 mt-2 list-disc list-inside">
              <li><span className="text-cyan-400 font-bold">Access:</span> Request a copy of the personal data we hold about you.</li>
              <li><span className="text-cyan-400 font-bold">Correction:</span> Request correction of inaccurate or incomplete data.</li>
              <li><span className="text-cyan-400 font-bold">Deletion:</span> Request deletion of your personal data (subject to legal exceptions).</li>
              <li><span className="text-cyan-400 font-bold">Portability:</span> Receive your data in a structured, machine-readable format.</li>
              <li><span className="text-cyan-400 font-bold">Objection / Restriction:</span> Object to or request restriction of certain processing.</li>
              <li><span className="text-cyan-400 font-bold">Withdraw Consent:</span> Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@moltology.com" className="text-cyan-400 hover:underline">
                privacy@moltology.com
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section id="security" icon={<Lock className="w-4 h-4" />} title="Security Measures">
            <p>
              We implement industry-standard technical and organizational measures to protect your data, including
              encryption in transit (TLS), encryption at rest, access controls, and regular security reviews.
              No system is 100% secure; we encourage you to use a strong, unique password and enable any available
              two-factor authentication.
            </p>
          </Section>

          <Section id="cookies" icon={<Database className="w-4 h-4" />} title="Cookies & Tracking Technologies">
            <p>
              We use cookies and similar technologies to operate the Services, remember your preferences, and
              analyze usage. Essential cookies are required for the Services to function. Analytics cookies are
              used in aggregate and anonymized form. You may control non-essential cookies through your browser
              settings; however, disabling cookies may affect Service functionality.
            </p>
          </Section>

          <Section id="children" icon={<Shield className="w-4 h-4" />} title="Children's Data">
            <p>
              The Services are not directed to individuals under the age of 13 (or 16 in certain jurisdictions).
              We do not knowingly collect personal information from children. If you believe a child has provided
              us personal data, please contact us immediately and we will delete it.
            </p>
          </Section>

          <Section id="changes" icon={<Eye className="w-4 h-4" />} title="Policy Updates">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via
              email or a prominent notice on the Services at least 14 days before taking effect. Continued use
              of the Services after the effective date constitutes acceptance of the updated Policy.
            </p>
          </Section>

          <Section id="contact" icon={<Mail className="w-4 h-4" />} title="Contact the Data Authority">
            <p>For privacy inquiries, data requests, or to report a concern:</p>
            <div className="mt-3 p-4 bg-cyan-950/20 border border-cyan-900/40 rounded space-y-1">
              <p className="text-white font-bold">Moltology System Inc.</p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@moltology.com" className="text-cyan-400 hover:underline">
                  privacy@moltology.com
                </a>
              </p>
            </div>
          </Section>

          <div className="mt-4 pt-6 border-t border-cyan-950/60 text-[10px] text-gray-600">
            © {CURRENT_YEAR} Moltology System Inc. All rights reserved. — Effective January 1, {CURRENT_YEAR}
          </div>
        </article>
      </div>

      {/* Back button */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 text-xs text-cyan-500 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to the Portal
        </button>
      </div>

      <MainFooter />
    </div>
  )
}
