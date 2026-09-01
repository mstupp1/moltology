import React, { useState } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
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

export default function IsolationView() {
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
    <>
      <IsolationVideoFeed
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <IsolationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onForcePrivate={handleForcePrivate}
      />
    </>
  )
}
