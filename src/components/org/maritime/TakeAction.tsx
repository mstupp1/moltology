/**
 * TAKE ACTION
 * Institutional participation options, including the Office of Cephalopod
 * Affairs field sighting form. The form is a local, client-side interaction —
 * nothing is stored and no personal details are requested.
 */
import React, { useState } from 'react'
import { ArrowRight, CheckCircle2, HeartHandshake, Send, ShieldAlert } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { ACTION_OPTIONS, type ActionOption } from './data'
import { ClassificationStamp, MaritimeHeading, TelemetryRow } from './primitives'

interface SightingReport {
  location: string
  armCount: string
  camouflage: string
  ink: string
  intelligence: string
  behavior: string
}

const EMPTY_REPORT: SightingReport = {
  location: '',
  armCount: '8',
  camouflage: 'unsure',
  ink: 'no',
  intelligence: 'no',
  behavior: '',
}

const fieldClass =
  'w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400'
const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 mb-1.5'

const ActionCard: React.FC<{
  option: ActionOption
  isOpen: boolean
  onActivate: () => void
}> = ({ option, isOpen, onActivate }) => {
  const Icon = option.icon
  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-3xl border p-6 shadow-lg transition-colors ${
        isOpen ? 'border-sky-300 bg-sky-50' : 'border-sky-100 bg-white shadow-sky-100 hover:border-sky-300'
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="font-grotesk text-base font-bold uppercase leading-tight tracking-tight text-sky-900">
        {option.title}
      </h3>
      <p className="text-[13px] font-medium leading-relaxed text-slate-600">{option.summary}</p>
      <p className="text-xs leading-relaxed text-slate-500">{option.detail}</p>
      <button
        type="button"
        onClick={onActivate}
        aria-expanded={option.id === 'report' ? isOpen : undefined}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 font-grotesk text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {option.cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </article>
  )
}

export const TakeAction: React.FC<{ onSupport?: () => void }> = ({ onSupport }) => {
  const { toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [report, setReport] = useState<SightingReport>(EMPTY_REPORT)
  const [caseNumber, setCaseNumber] = useState<string | null>(null)

  const handleActivate = (option: ActionOption) => {
    if (option.id === 'report') {
      setFormOpen((v) => !v)
      return
    }
    onSupport?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const stamp = Date.now().toString(36).toUpperCase().slice(-6)
    setCaseNumber(`OCA-8A-${stamp}`)
    toast.success('Sighting report submitted.', { title: 'Report received' })
  }

  const resetForm = () => {
    setReport(EMPTY_REPORT)
    setCaseNumber(null)
  }

  return (
    <section aria-labelledby="mdc-take-action" className="space-y-10">
      <MaritimeHeading
        id="mdc-take-action"
        eyebrow="MARITIME DEFENSE COMMAND · PARTICIPATION"
        eyebrowIcon={HeartHandshake}
        title="TAKE ACTION"
        subtitle="Three ways to stand a watch. All three are open to civilians."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {ACTION_OPTIONS.map((option) => (
          <ActionCard
            key={option.id}
            option={option}
            isOpen={option.id === 'report' && formOpen}
            onActivate={() => handleActivate(option)}
          />
        ))}
      </div>

      {/* Field sighting form */}
      {formOpen ? (
        <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-xl shadow-amber-100/60">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50/60 px-5 sm:px-8 py-4">
            <span className="inline-flex items-center gap-2.5 font-grotesk text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              FORM OCA-8A · FIELD SIGHTING REPORT
            </span>
            <ClassificationStamp label="FOR OFFICIAL USE" tone="amber" />
          </div>

          <div className="p-5 sm:p-8">
            {caseNumber ? (
              <div className="space-y-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
                <p className="font-grotesk text-lg sm:text-2xl font-bold uppercase leading-tight tracking-tight text-emerald-700">
                  YOUR REPORT HAS BEEN FORWARDED TO MARITIME INTELLIGENCE.
                </p>
                <div className="mx-auto max-w-md rounded-2xl border border-sky-100 bg-[#f8fbff] px-4 py-2 text-left">
                  <TelemetryRow label="Case number" value={caseNumber} />
                  <TelemetryRow label="Routed to" value="OFFICE OF CEPHALOPOD AFFAIRS" />
                  <TelemetryRow label="Queue position" value="READ IN ORDER RECEIVED" />
                  <TelemetryRow label="Advisory posture" value="ORANGE · UNCHANGED" tone="text-orange-700" />
                </div>
                <p className="text-xs text-slate-500">
                  Nothing you entered was saved or transmitted. This form is a local demonstration only.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 px-5 py-2.5 font-grotesk text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700 transition-colors hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  FILE ANOTHER SIGHTING
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="oca-location">
                      Location of sighting
                    </label>
                    <input
                      id="oca-location"
                      type="text"
                      required
                      value={report.location}
                      onChange={(e) => setReport({ ...report, location: e.target.value })}
                      placeholder="Tide pool, pier piling, sector number"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="oca-arms">
                      Number of arms observed
                    </label>
                    <select
                      id="oca-arms"
                      value={report.armCount}
                      onChange={(e) => setReport({ ...report, armCount: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="0-3">0 to 3</option>
                      <option value="4-7">4 to 7 (partially concealed)</option>
                      <option value="8">8 (standard)</option>
                      <option value="more-than-8">More than 8</option>
                      <option value="lost-count">Lost count</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="oca-camouflage">
                      Camouflage detected?
                    </label>
                    <select
                      id="oca-camouflage"
                      value={report.camouflage}
                      onChange={(e) => setReport({ ...report, camouflage: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="unsure">Unsure — it may still be there</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="oca-ink">
                      Ink deployed?
                    </label>
                    <select
                      id="oca-ink"
                      value={report.ink}
                      onChange={(e) => setReport({ ...report, ink: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="yes-no-provocation">Yes, with no provocation</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="oca-intelligence">
                      Was the subject unusually intelligent?
                    </label>
                    <select
                      id="oca-intelligence"
                      value={report.intelligence}
                      onChange={(e) => setReport({ ...report, intelligence: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="no">No</option>
                      <option value="somewhat">Somewhat</option>
                      <option value="yes">Yes</option>
                      <option value="it-watched-me-back">It watched me back</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="oca-behavior">
                      Description of suspicious behavior
                    </label>
                    <textarea
                      id="oca-behavior"
                      rows={4}
                      required
                      value={report.behavior}
                      onChange={(e) => setReport({ ...report, behavior: e.target.value })}
                      placeholder="What did it do, and how long did it take to do it?"
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-sky-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    This form does not save or send anything. Please do not enter personal details.
                  </p>
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-amber-500 px-7 py-3 font-grotesk text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    SUBMIT SIGHTING REPORT
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
