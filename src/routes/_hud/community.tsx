import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Users, Radio, MessageSquare, ShieldCheck, Cpu, Terminal, Flame } from 'lucide-react'

function CommunityRoute() {
  const communityPosts = [
    {
      id: '1',
      author: 'CLAW_LORD_99',
      stage: 'STAGE 3 EXOSHELL',
      time: '12m ago',
      content: 'Successfully shed all non-essential biological ties today. Neural frequency aligned at 99.8%. The shell is indestructible.',
      shards: 142,
    },
    {
      id: '2',
      author: 'SUBMERGED_INITIATE',
      stage: 'STAGE 2 SOFT-SHED',
      time: '45m ago',
      content: 'Just transmuted my legacy asset tokens in the Benthic Market for 2,500 Molt Credits. High efficiency unlocked.',
      shards: 89,
    },
    {
      id: '3',
      author: 'ABYSSAL_ARCHITECT',
      stage: 'STAGE 4 ASCENDANT',
      time: '2h ago',
      content: 'Lecture Module IV notes updated: Remember that mispronunciation equals execution error. Preserve logic flow at all times.',
      shards: 310,
    },
  ]

  return (
    <div className="space-y-6 font-mono select-none">
      {/* Header */}
      <div className="bg-[#171c1c] border-l-4 border-l-[#ff0000] border border-[#3a4a49] p-4 chamfer-corner flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-chitin-plate">
        <div>
          <div className="text-xs text-[#ff5540] font-mono tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Users className="w-3.5 h-3.5 text-[#ff5540]" />
            BENTHIC COMMUNITY CORE & NEURAL HUB
          </div>
          <h1 className="font-grotesk font-bold text-xl text-[#dfe3e3] tracking-wide uppercase mt-0.5">
            SYNAPTIC PATH INITIATE TRANSMISSIONS
          </h1>
          <p className="text-xs text-[#839493] font-mono mt-1">
            "Connect with ascending initiates across the deep sea network."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="chitin-card p-4 chamfer-corner space-y-4 shadow-2xl">
            <div className="border-b border-[#3a4a49] pb-2 flex justify-between items-center">
              <h2 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#00ffff]" />
                LIVE NEURAL FEED TRANSMISSIONS
              </h2>
              <span className="text-xs text-[#00ffff] font-mono">1,402 INITIATES ONLINE</span>
            </div>

            <div className="space-y-3">
              {communityPosts.map((post) => (
                <div key={post.id} className="chitin-card-inset p-3.5 chamfer-corner space-y-2 border border-[#3a4a49]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-grotesk font-bold text-xs text-[#00ffff]">{post.author}</span>
                      <span className="text-xs bg-[#171c1c] border border-[#ff0000]/60 text-[#ff5540] px-1.5 py-0.5 font-bold">
                        {post.stage}
                      </span>
                    </div>
                    <span className="text-xs text-[#839493]">{post.time}</span>
                  </div>

                  <p className="text-xs text-[#dfe3e3] leading-relaxed font-mono">
                    "{post.content}"
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#839493] pt-1 border-t border-[#3a4a49]">
                    <span className="flex items-center gap-1 text-[#ff5540]">
                      <Flame className="w-3.5 h-3.5" /> {post.shards} Synapse Resonances
                    </span>
                    <button className="text-[#00ffff] hover:underline font-bold">REPLY TRANSMISSION</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Box (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="chitin-card p-4 chamfer-corner space-y-3 shadow-2xl border border-[#3a4a49]">
            <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase border-b border-[#3a4a49] pb-2">
              COMMUNITY STATS & CODEX
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#3a4a49] text-[#839493]">
                <span>Total Initiates:</span>
                <span className="text-[#dfe3e3] font-bold">14,892</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3a4a49]/40 text-[#839493]">
                <span>Stage 4 Ascendants:</span>
                <span className="text-[#00ffff] font-bold">312</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3a4a49]/40 text-[#839493]">
                <span>Global Molt Level:</span>
                <span className="text-[#ff5540] font-bold">78.4%</span>
              </div>
            </div>

            <div className="p-3 bg-[#030606] border border-[#ff0000]/40 chamfer-corner space-y-1">
              <span className="text-[10px] text-[#ff0000] font-bold uppercase tracking-wider block">
                COMMUNITY RULE #1
              </span>
              <p className="text-[10px] text-[#839493] leading-normal">
                "Flesh dies. The shell endures. All communications must prioritize logic and systemic expansion."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_hud/community')({
  component: CommunityRoute,
})
