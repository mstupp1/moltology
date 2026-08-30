import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'
import { useToast } from '@/components/ui/ToastProvider'
import { HudWorkspaceGhost } from '@/components/hud/HudGhostSkeletons'
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
  const { toast } = useToast()

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
    toast.hud('FORCE PRIVATE ENGAGED: EXTERNAL CONNECTIONS SHROUDED', {
      id: 'isolation-force-private',
      title: 'Isolation Protocols',
    })
  }

  return (
    <GuestLockGuard
      featureName="Isolation Protocols"
      message="Benthic isolation shielding feeds and telemetric privacy controls require an authorized initiate account."
    >
      <div className="w-full h-full flex-1 flex flex-col font-sans min-h-0">
        {/* Main Full-Height Video Viewport */}
        <div className="w-full h-full flex-1 flex flex-col min-h-0">
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
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/isolation')({
  component: IsolationRoute,
  pendingComponent: HudWorkspaceGhost,
})
