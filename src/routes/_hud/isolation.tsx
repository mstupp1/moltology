import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { IsolationVideoFeed } from '@/components/hud/IsolationVideoFeed'
import {
  IsolationSettingsModal,
  type IsolationSettings,
} from '@/components/hud/IsolationSettingsModal'

const DEFAULT_SETTINGS: IsolationSettings = {
  isForceFieldEngaged: true,
  isPrivacyShellEngaged: true,
  socialNoiseSuppression: 99.4,
  anonymityStage: 2,
  submergenceFreq: 8.4,
  empathyDampening: 10,
  showScanlines: false,
  showTelemetryOSD: false,
  visionFilter: 'standard',
  autoCycleFeeds: true,
}

function IsolationRoute() {
  const [settings, setSettings] = useState<IsolationSettings>(DEFAULT_SETTINGS)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleUpdateSettings = (updater: Partial<IsolationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...updater,
    }))
  }

  const handleForcePrivate = () => {
    setSettings((prev) => ({
      ...prev,
      isForceFieldEngaged: true,
      isPrivacyShellEngaged: true,
      socialNoiseSuppression: 100,
      empathyDampening: 10,
    }))
    showToast('FORCE PRIVATE ENGAGED: EXTERNAL CONNECTIONS SHROUDED')
  }

  return (
    <div className="w-full h-full flex flex-col font-mono -mt-2 sm:-mt-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0e1315] border-2 border-[#ff453a] text-[#ff5540] p-3 shadow-[0_0_25px_rgba(255,69,58,0.5)] chamfer-corner flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-[#ff5540]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Full-Height Video Viewport */}
      <div className="w-full flex-1">
        <IsolationVideoFeed
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Protocol Settings Modal */}
      <IsolationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onForcePrivate={handleForcePrivate}
      />
    </div>
  )
}

export const Route = createFileRoute('/_hud/isolation')({
  component: IsolationRoute,
})
