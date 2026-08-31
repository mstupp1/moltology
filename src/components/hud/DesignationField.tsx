import React, { useMemo } from 'react'
import { Radio } from 'lucide-react'
import { HudInput } from '@/components/ui'
import { parseMemberHandle } from '@/lib/member-handle'

export interface DesignationFieldProps {
  value: string
  onChange: (value: string) => void
  id?: string
  disabled?: boolean
  showLiveHint?: boolean
}

export function DesignationField({
  value,
  onChange,
  id = 'member-designation',
  disabled = false,
  showLiveHint = true,
}: DesignationFieldProps) {
  const parsed = useMemo(() => (value ? parseMemberHandle(value) : null), [value])
  const hint =
    !showLiveHint || !value
      ? 'Letters, numbers, and underscore. 3 to 20 marks. The Benthic Community will know you by this.'
      : parsed?.ok
        ? 'This designation is well-formed. Uniqueness is sealed when you confirm.'
        : parsed?.message

  return (
    <div className="space-y-1.5">
      <HudInput
        id={id}
        label="Designation"
        type="text"
        autoComplete="username"
        required
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="your_designation"
        aria-invalid={Boolean(value && parsed && !parsed.ok)}
        aria-describedby={`${id}-hint`}
        startIcon={<Radio className="w-4 h-4 text-[#00c3ff]" />}
      />
      <p
        id={`${id}-hint`}
        className={`text-[11px] font-sans leading-snug ${
          value && parsed && !parsed.ok ? 'text-[#ff453a]' : 'text-[#839493]'
        }`}
      >
        {hint}
      </p>
    </div>
  )
}
