import React from 'react'
import { HudDropdownMenu, HudDropdownMenuTrigger, HudDropdownMenuContent, HudDropdownMenuItem, HudDropdownMenuSeparator, HudButton } from '@moltology/hud'
import { MoreHorizontal, Pencil, Link2, Pin, Trash2 } from 'lucide-react'

const Menu = () => (
  <HudDropdownMenu defaultOpen modal={false}>
    <HudDropdownMenuTrigger asChild>
      <HudButton variant="dark" size="sm" icon={<MoreHorizontal size={14} />} iconPosition="right">Thread actions</HudButton>
    </HudDropdownMenuTrigger>
    <HudDropdownMenuContent align="start">
      <HudDropdownMenuItem><Pencil size={12} /> Edit post</HudDropdownMenuItem>
      <HudDropdownMenuItem><Link2 size={12} /> Copy link</HudDropdownMenuItem>
      <HudDropdownMenuItem disabled><Pin size={12} /> Pin thread</HudDropdownMenuItem>
      <HudDropdownMenuSeparator />
      <HudDropdownMenuItem destructive><Trash2 size={12} /> Delete post</HudDropdownMenuItem>
    </HudDropdownMenuContent>
  </HudDropdownMenu>
)

export const Open = () => (
  <div className="bg-[#030708] p-6" style={{ height: 260 }}><Menu /></div>
)
