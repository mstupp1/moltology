import { BookOpenText } from 'lucide-react'
import { oracleReadsLabel, oracleReadsLink, type OracleReadItem } from '@/lib/oracle-reads'

const LABEL_CLASS =
  'mb-1 flex w-fit items-center gap-1 rounded-chip text-[11px] font-medium text-ink-muted'

/** Small line above an Oracle reply naming what it read on the site, e.g. "Read 5 forum topics". */
export function OracleReadsLabel({ reads }: { reads: readonly OracleReadItem[] }) {
  const label = oracleReadsLabel(reads)
  if (!label) return null
  const link = oracleReadsLink(reads)
  const icon = <BookOpenText className="w-3 h-3 text-cyan-glow" aria-hidden="true" />
  if (link) {
    // A plain anchor: the target can be any public page, and it opens in place like other reply links.
    return (
      <a
        href={link.href}
        title={link.title}
        className={`${LABEL_CLASS} hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow`}
      >
        {icon}
        {label}
      </a>
    )
  }
  return (
    <p className={LABEL_CLASS}>
      {icon}
      {label}
    </p>
  )
}
