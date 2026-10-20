import { useEffect, useState } from 'react'
import { getStoreAccessFn } from '@/lib/server/merch-api'
/** Only approved operator-authored policies are shown; commercial promises are never invented. */
export function StorePolicies() {
  const [policy, setPolicy] = useState<Awaited<ReturnType<typeof getStoreAccessFn>> | null>(null)
  useEffect(() => { let active = true; void getStoreAccessFn().then(result => { if (active) setPolicy(result) }).catch(() => undefined); return () => { active = false } }, [])
  return <div className="space-y-2 text-sm text-ink-body">
    <p>Shipping is quoted for your delivery address before payment.{policy && ` Enabled destinations: ${policy.countries.join(', ')}.`}</p>
    {policy?.shippingPolicy && <p>{policy.shippingPolicy}</p>}
    {policy?.returnsPolicy && <p>{policy.returnsPolicy}</p>}
    {policy?.cancellationPolicy && <p>{policy.cancellationPolicy}</p>}
    {policy?.supportEmail && <a className="text-cyan-glow" href={`mailto:${policy.supportEmail}`}>{policy.supportEmail}</a>}
    {policy && !policy.returnsPolicy && <p>Shipping, returns and support details are pending approval.</p>}
  </div>
}
