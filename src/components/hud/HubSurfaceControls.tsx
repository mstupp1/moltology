import React, { useCallback } from 'react'
import { BellRing, Download, MonitorSmartphone } from 'lucide-react'
import { toast } from 'sonner'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { useSystemNotifications } from '@/hooks/useSystemNotifications'

type HubSurfaceControlsProps = {
  /** When true, show denser copy suited to the Settings page. */
  dense?: boolean
}

/**
 * Install + surface-alert controls.
 * Usable for guests (dashboard strip) and signed-in Settings.
 */
export function HubSurfaceControls({ dense = false }: HubSurfaceControlsProps) {
  const { isStandalone, canPromptInstall, install } = usePwaInstall()
  const { supported, enabled, permission, enable, disable } = useSystemNotifications()

  const handleToggleAlerts = useCallback(async () => {
    if (enabled) {
      disable()
      toast.message('Surface alerts quieted.')
      return
    }
    const next = await enable()
    if (next === 'granted') {
      toast.success('Surface alerts armed.')
    } else if (next === 'denied') {
      toast.error('System blocked surface alerts. Check device permission settings.')
    } else if (next === 'unsupported') {
      toast.error('This vessel cannot raise system alerts.')
    } else {
      toast.message('Surface alerts need permission to continue.')
    }
  }, [disable, enable, enabled])

  const handleInstall = useCallback(async () => {
    const outcome = await install()
    if (outcome === 'accepted') {
      toast.success('Command Hub installed.')
    } else if (outcome === 'unavailable') {
      toast.message(
        isStandalone
          ? 'Command Hub is already installed on this vessel.'
          : 'Use your browser install menu if the prompt is hidden.'
      )
    }
  }, [install, isStandalone])

  const alertStatus =
    !supported
      ? 'Unavailable on this vessel'
      : permission === 'denied'
        ? 'Blocked by the system'
        : enabled
          ? 'Armed for Activity Center alerts'
          : 'Off — Activity Center only'

  return (
    <div className={dense ? 'space-y-3' : 'space-y-2.5'}>
      <div className="chitin-card-inset p-3 sm:p-4 flex items-center justify-between gap-3 rounded-sm">
        <div className="flex items-center gap-3 min-w-0">
          <BellRing className="w-5 h-5 shrink-0 text-[#00c3ff]" />
          <div className="min-w-0">
            <span className="text-sm font-grotesk font-bold text-[#dfe3e3] block">
              Surface Alerts
            </span>
            <span className="text-xs text-[#839493] font-sans">{alertStatus}</span>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle surface alerts"
          disabled={!supported || permission === 'denied'}
          onClick={() => {
            void handleToggleAlerts()
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#00c3ff] disabled:opacity-40 disabled:cursor-not-allowed ${
            enabled ? 'bg-[#00c3ff]' : 'bg-cyan-950 border-cyan-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0 bg-slate-300'
            }`}
          />
        </button>
      </div>

      <div className="chitin-card-inset p-3 sm:p-4 flex items-center justify-between gap-3 rounded-sm">
        <div className="flex items-center gap-3 min-w-0">
          {isStandalone ? (
            <MonitorSmartphone className="w-5 h-5 shrink-0 text-[#00c3ff]" />
          ) : (
            <Download className="w-5 h-5 shrink-0 text-[#00c3ff]" />
          )}
          <div className="min-w-0">
            <span className="text-sm font-grotesk font-bold text-[#dfe3e3] block">
              {isStandalone ? 'Command Hub Installed' : 'Install Command Hub'}
            </span>
            <span className="text-xs text-[#839493] font-sans">
              {isStandalone
                ? 'Running as a standalone shell on this vessel'
                : canPromptInstall
                  ? 'Add a home-screen shell for faster return'
                  : 'Available when your browser offers install'}
            </span>
          </div>
        </div>
        {!isStandalone && (
          <button
            type="button"
            onClick={() => {
              void handleInstall()
            }}
            disabled={!canPromptInstall}
            className="shrink-0 px-3 py-1.5 bg-[#00c3ff]/20 hover:bg-[#00c3ff]/30 border border-[#00c3ff]/60 text-[#00c3ff] font-grotesk font-bold text-[10px] uppercase tracking-widest chamfer-corner transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Install
          </button>
        )}
      </div>
    </div>
  )
}
