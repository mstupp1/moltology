import React from 'react'
import { ChromaElement } from '@/components/ui'
import { getAssetUrl } from '@/lib/assets'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'

export interface SidebarLobsterEmblemProps {
  avatarSrc?: string | null
  variant: 'collapsed' | 'expanded' | 'mobile'
  onClick: () => void
}

export const SidebarLobsterEmblem: React.FC<SidebarLobsterEmblemProps> = ({
  avatarSrc,
  variant,
  onClick,
}) => {
  const isCollapsed = variant === 'collapsed'
  const isAvatar = Boolean(avatarSrc)

  const renderEmblem = () => {
    if (isAvatar && avatarSrc) {
      if (isCollapsed) {
        return (
          <LobsterAvatarDisplay
            src={avatarSrc}
            maskRadial={false}
            containerClassName="w-9 h-9 rounded-full overflow-hidden"
            className="w-full h-full object-cover"
          />
        )
      }

      const containerClassName =
        variant === 'mobile'
          ? 'w-20 h-20 aspect-square rounded-full overflow-hidden flex items-center justify-center'
          : 'w-full aspect-square max-h-36 rounded-full overflow-hidden flex items-center justify-center'

      return (
        <LobsterAvatarDisplay
          src={avatarSrc}
          maskRadial
          containerClassName={containerClassName}
          className="w-full h-full object-cover scale-110 transition-transform duration-300 group-hover:scale-115"
        />
      )
    }

    if (isCollapsed) {
      return (
        <ChromaElement
          src={getAssetUrl('/images/benthic_lobster_sidebar.jpg')}
          alt="Benthic Lobster"
          blendMode="screen"
          glowColor="cyan"
          containerClassName="w-9 h-9"
          className="w-full h-full object-contain"
        />
      )
    }

    const containerClassName =
      variant === 'mobile'
        ? 'w-20 h-20 aspect-square rounded-full overflow-hidden flex items-center justify-center'
        : 'w-full aspect-square max-h-36 rounded-full overflow-hidden flex items-center justify-center'

    return (
      <ChromaElement
        src={getAssetUrl('/images/benthic_lobster_sidebar.jpg')}
        alt="Benthic Lobster"
        blendMode="screen"
        glowColor="cyan"
        maskRadial
        containerClassName={containerClassName}
        className="w-full h-full object-contain scale-110 transition-transform duration-300 group-hover:scale-115"
      />
    )
  }

  if (isCollapsed) {
    return (
      <div
        className="relative group/lobster flex justify-center py-1 cursor-pointer active:scale-95 transition-transform"
        onClick={onClick}
      >
        {renderEmblem()}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[200] pointer-events-none opacity-0 group-hover/lobster:opacity-100 transition-all duration-200">
          <div className="bg-[#060a0b] border border-[#00c3ff]/70 text-[#00c3ff] px-2 py-1 text-[10px] font-sans font-bold shadow-[0_0_12px_rgba(0,195,255,0.4)] whitespace-nowrap chamfer-corner flex items-center gap-1.5">
            <span className="text-[#dfe3e3]">REPLAY INITIATION BROADCAST</span>
            <span className="text-[9px] text-[#ff5540]">• CARAPACE v4.2</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full relative group flex flex-col items-center justify-center py-1 cursor-pointer active:scale-95 transition-transform"
      onClick={onClick}
      title="Replay Initiation Broadcast"
    >
      {renderEmblem()}
    </div>
  )
}
