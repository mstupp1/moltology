import { getAssetUrl } from '@/lib/assets'

/** Original shell/core marks generated with ImageGen; source prompts live in docs/design/oracle-tier-icons.md. */
export function OracleTierIcon({ tier, className = 'h-4 w-4' }: { tier: 'lite' | 'max'; className?: string }) {
  const asset = tier === 'max' ? 'images/ui/oracle/oracle-max-core-v1.png' : 'images/ui/oracle/oracle-lite-shell-v1.png'
  return <img src={getAssetUrl(asset)} alt="" aria-hidden="true" data-oracle-tier={tier} className={`shrink-0 object-contain ${className}`} />
}
