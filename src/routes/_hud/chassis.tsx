import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BioForgeAvatarStudio } from '@/components/hud/BioForgeAvatarStudio'

function ChassisRoute() {
  return <BioForgeAvatarStudio />
}

export const Route = createFileRoute('/_hud/chassis')({
  component: ChassisRoute,
})

