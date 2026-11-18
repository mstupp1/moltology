import React from 'react'
import { X } from 'lucide-react'

export interface OracleCoreTipProps {
  /** `left`: beside the desktop launcher. `above`: over the phone bottom bar's core. */
  placement: 'left' | 'above'
  onOpen: () => void
  onDismiss: () => void
  className?: string
}

/**
 * The first-visit tip that points at the synaptic core. Pressing the text opens
 * the Oracle; the X just dismisses. Either way it never comes back on this device.
 */
export function OracleCoreTip({ placement, onOpen, onDismiss, className = '' }: OracleCoreTipProps) {
  return (
    <div
      role="status"
      data-testid="oracle-core-tip"
      data-placement={placement}
      className={`oracle-core-tip flex items-center gap-0.5 rounded-full border border-cyan-glow/40 bg-surface-1 shadow-menu pl-4 pr-1 h-10 whitespace-nowrap font-sans ${className}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="text-xs font-medium text-ink cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
      >
        Ask the Oracle anything
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tip"
        data-testid="oracle-core-tip-dismiss"
        className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-muted hover:text-ink hover:bg-surface-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-glow"
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
      {/* Pointer toward the core. */}
      <span
        aria-hidden
        className={`oracle-core-tip__arrow bg-surface-1 border-cyan-glow/40 ${
          placement === 'left' ? 'border-t border-r' : 'border-b border-r'
        }`}
      />
    </div>
  )
}
