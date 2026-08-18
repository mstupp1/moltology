import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BioForgeAvatarStudio } from '@/components/hud/BioForgeAvatarStudio'
import { GuestLockGuard } from '@/components/hud/GuestLockGuard'

function ChassisRoute() {
  return (
    <GuestLockGuard
      featureName="Chassis Configurator"
      message="The BioForge avatar customizer and chassis plating generator require an authorized initiate account."
    >
      <BioForgeAvatarStudio />
    </GuestLockGuard>
  )
}

export const Route = createFileRoute('/_hud/chassis')({
  component: ChassisRoute,
})

