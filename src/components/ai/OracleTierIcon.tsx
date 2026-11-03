/** Matching product marks: one chevron for Lite, a double chevron for MAX. */
export function OracleTierIcon({ tier, className = 'h-4 w-4' }: { tier: 'lite' | 'max'; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-oracle-tier={tier} className={`shrink-0 ${className}`}>
      <path d="M8 3H6L3 6v12l3 3h2M16 3h2l3 3v12l-3 3h-2" />
      {tier === 'max' ? <path d="m8 10 4-4 4 4m-8 7 4-4 4 4" /> : <path d="m8 14 4-4 4 4" />}
    </svg>
  )
}
