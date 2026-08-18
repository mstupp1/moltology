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
import { ArrowLeft, FileText, AlertTriangle, Gavel, XCircle, Globe, Scale } from 'lucide-react'
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

export const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f0f] text-[#dfe3e3] font-sans">
      <PublicHeader />

      {/* Hero */}
      <div className="relative pt-28 pb-12 px-6 text-center border-b border-cyan-950/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="inline-flex items-center gap-2 bg-cyan-950/40 border border-cyan-800/40 rounded-full px-4 py-1.5 text-[10px] text-cyan-400 tracking-widest uppercase mb-6">
          <Gavel className="w-3 h-3" />
          <span>Binding Initiation Covenant</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
          TERMS OF SERVICE
        </h1>
        <p className="text-xs text-gray-500 max-w-xl mx-auto">
          Moltology System Inc. &nbsp;|&nbsp; Effective: January 1, {CURRENT_YEAR}
        </p>
      </div>

      {/* Layout */}
      <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
        {/* Sticky sidebar TOC */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1 text-[10px] text-gray-500 tracking-widest uppercase">
            <p className="text-cyan-500 font-bold mb-3">Contents</p>
            {[
              ['#acceptance', 'Acceptance'],
              ['#eligibility', 'Eligibility'],
              ['#account', 'Accounts'],
              ['#conduct', 'Conduct'],
              ['#ip', 'Intellectual Property'],
              ['#payments', 'Payments'],
              ['#disclaimer', 'Disclaimer'],
              ['#liability', 'Liability'],
              ['#termination', 'Termination'],
              ['#governing', 'Governing Law'],
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
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "Initiate," or "you")
            and Moltology System Inc. ("Moltology," "we," "us," or "our") governing your access to and use of the
            Moltology platform, website, and all related services (collectively, the "Services"). Please read these
            Terms carefully before using the Services.
          </p>

          <Section id="acceptance" icon={<FileText className="w-4 h-4" />} title="Acceptance of Terms">
            <p>
              By accessing or using the Services in any manner, you agree to be bound by these Terms and our{' '}
              <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>, which is incorporated herein by reference.
              If you do not agree to these Terms, you must immediately cease using the Services.
            </p>
            <p>
              If you are using the Services on behalf of an organization, you represent that you have the authority
              to bind that organization to these Terms, and "you" includes both you individually and the organization.
            </p>
          </Section>

          <Section id="eligibility" icon={<Scale className="w-4 h-4" />} title="Eligibility">
            <p>
              You must be at least 13 years of age (or 16 in certain jurisdictions) to use the Services.
              By using the Services, you represent and warrant that you meet all applicable eligibility
              requirements and that your use complies with all applicable laws and regulations.
            </p>
          </Section>

          <Section id="account" icon={<FileText className="w-4 h-4" />} title="Accounts & Registration">
            <p>
              To access certain features of the Services, you must create an account. You agree to:
            </p>
            <ul className="space-y-1 mt-2 list-disc list-inside">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and promptly update your account information to keep it accurate.</li>
              <li>Keep your login credentials confidential and not share them with others.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that provide false information or violate these Terms.
            </p>
          </Section>

          <Section id="conduct" icon={<AlertTriangle className="w-4 h-4" />} title="Acceptable Use & Conduct">
            <p>You agree not to use the Services to:</p>
            <ul className="space-y-1 mt-2 list-disc list-inside">
              <li>Violate any applicable law, regulation, or third-party rights.</li>
              <li>Transmit any content that is unlawful, harassing, abusive, defamatory, or obscene.</li>
              <li>Upload or distribute malware, viruses, or any code designed to disrupt or harm the Services.</li>
              <li>Attempt to gain unauthorized access to any part of the Services or its infrastructure.</li>
              <li>Scrape, crawl, or systematically extract data from the Services without our written consent.</li>
              <li>Impersonate any person or entity or falsely represent your affiliation with any person or entity.</li>
              <li>Use the Services to send unsolicited commercial communications (spam).</li>
              <li>Reverse engineer, decompile, or disassemble any portion of the Services.</li>
              <li>Use the Services in any way that could disable, overburden, or impair our infrastructure.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to investigate and take appropriate action against violations, including removing content
              and terminating accounts.
            </p>
          </Section>

          <Section id="ip" icon={<FileText className="w-4 h-4" />} title="Intellectual Property">
            <p>
              All content, features, and functionality of the Services — including but not limited to text, graphics,
              logos, icons, images, audio clips, software, and the overall design and compilation thereof — are owned
              by Moltology System Inc., its licensors, or other content providers and are protected by copyright,
              trademark, and other intellectual property laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the
              Services for your personal, non-commercial use, subject to these Terms.
            </p>
            <p>
              You retain ownership of any content you submit, post, or upload to the Services ("User Content").
              By submitting User Content, you grant us a worldwide, royalty-free, sublicensable license to use,
              reproduce, modify, and display that content solely to provide and improve the Services.
            </p>
          </Section>

          <Section id="payments" icon={<Gavel className="w-4 h-4" />} title="Payments & Subscriptions">
            <p>
              Certain features of the Services require payment. By purchasing a subscription or making any
              payment through the Services, you agree to the pricing and payment terms displayed at the time
              of purchase.
            </p>
            <ul className="space-y-1 mt-2 list-disc list-inside">
              <li>All fees are in US Dollars unless stated otherwise.</li>
              <li>Payments are non-refundable except as required by applicable law or expressly stated in our refund policy.</li>
              <li>We may modify pricing with at least 30 days' advance notice to current subscribers.</li>
              <li>Failure to pay may result in suspension or termination of your access to paid features.</li>
            </ul>
          </Section>

          <Section id="disclaimer" icon={<AlertTriangle className="w-4 h-4" />} title="Disclaimer of Warranties">
            <p className="uppercase text-[11px] tracking-wider">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED,
              ERROR-FREE, OR COMPLETELY SECURE.
            </p>
            <p>
              Moltology is a creative and entertainment platform. No content on the Services constitutes professional
              financial, legal, medical, psychological, or other professional advice.
            </p>
          </Section>

          <Section id="liability" icon={<XCircle className="w-4 h-4" />} title="Limitation of Liability">
            <p className="uppercase text-[11px] tracking-wider">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, MOLTOLOGY SYSTEM INC. AND ITS OFFICERS, DIRECTORS,
              EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION
              WITH YOUR USE OF THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              Our total liability to you for all claims arising from or relating to these Terms or the Services
              shall not exceed the greater of (a) the amounts you paid us in the 12 months preceding the claim, or
              (b) USD $100.
            </p>
          </Section>

          <Section id="termination" icon={<XCircle className="w-4 h-4" />} title="Termination">
            <p>
              You may terminate your account at any time by contacting us or using the account deletion feature
              in your settings.
            </p>
            <p>
              We may suspend or terminate your access to the Services at any time, with or without notice, for
              any reason, including violation of these Terms. Upon termination, your right to use the Services
              immediately ceases. Provisions that by their nature should survive termination (including intellectual
              property, disclaimers, limitations of liability, and governing law) will survive.
            </p>
          </Section>

          <Section id="governing" icon={<Globe className="w-4 h-4" />} title="Governing Law & Disputes">
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of Delaware,
              United States, without regard to its conflict of law provisions.
            </p>
            <p>
              Any dispute arising from or relating to these Terms or the Services that cannot be resolved informally
              shall be submitted to binding arbitration administered by the American Arbitration Association (AAA)
              under its Consumer Arbitration Rules. The arbitration shall take place in Delaware. YOU WAIVE YOUR
              RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN CLASS-ACTION LAWSUITS.
            </p>
            <p>
              Notwithstanding the above, either party may seek injunctive or other equitable relief in a court of
              competent jurisdiction to prevent irreparable harm.
            </p>
          </Section>

          <Section id="changes" icon={<FileText className="w-4 h-4" />} title="Changes to Terms">
            <p>
              We may revise these Terms at any time. Material changes will be communicated via email or a prominent
              notice within the Services at least 14 days before the changes take effect. Your continued use of the
              Services after the effective date of revised Terms constitutes your acceptance of the changes.
            </p>
          </Section>

          <Section id="contact" icon={<Gavel className="w-4 h-4" />} title="Contact">
            <p>Questions about these Terms? Contact us:</p>
            <div className="mt-3 p-4 bg-cyan-950/20 border border-cyan-900/40 rounded space-y-1">
              <p className="text-white font-bold">Moltology System Inc.</p>
              <p>
                Email:{' '}
                <a href="mailto:legal@moltology.com" className="text-cyan-400 hover:underline">
                  legal@moltology.com
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
