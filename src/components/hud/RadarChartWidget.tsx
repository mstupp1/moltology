import React, { useMemo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { ShieldCheck, Zap, Activity } from 'lucide-react'

interface RadarChartWidgetProps {
  stats?: {
    pincerTorque: number
    shellHardness: number
    processingPower: number
    durability: number
    clawStrength: number
  }
}

export const RadarChartWidget: React.FC<RadarChartWidgetProps> = ({
  stats = {
    pincerTorque: 78,
    shellHardness: 64,
    processingPower: 92,
    durability: 85,
    clawStrength: 70
  }
}) => {
  const data = useMemo(
    () => [
      { subject: 'PINCER TORQUE', A: stats.pincerTorque, fullMark: 100 },
      { subject: 'SHELL HARDNESS', A: stats.shellHardness, fullMark: 100 },
      { subject: 'PROCESSING', A: stats.processingPower, fullMark: 100 },
      { subject: 'DURABILITY', A: stats.durability, fullMark: 100 },
      { subject: 'CLAW STRENGTH', A: stats.clawStrength, fullMark: 100 },
    ],
    [stats.pincerTorque, stats.shellHardness, stats.processingPower, stats.durability, stats.clawStrength]
  )

  return (
    <div className="bg-[#171c1c] border border-[#3a4a49] p-4 chamfer-corner shadow-chitin-plate flex flex-col justify-between h-full">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#3a4a49] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00ffff]" />
          <h3 className="font-grotesk text-xs font-bold tracking-wider text-[#dfe3e3] uppercase">
            MOLTMAXXING STUDIO & BIOMETRICS
          </h3>
        </div>
        <span className="text-[10px] text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 border border-[#00ffff]/40 font-mono">
          CARCINIZATION DIAGNOSTICS
        </span>
      </div>

      {/* Radar Chart Visual */}
      <div className="w-full h-56 relative my-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#3a4a49" />
            <PolarAngleAxis dataKey="subject" stroke="#839493" tick={{ fill: '#00ffff', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#3a4a49" tick={false} />
            <Radar
              name="Larval Unit"
              dataKey="A"
              stroke="#00ffff"
              fill="#00ffff"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Numerical Data Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-[#3a4a49] pt-3">
        <div className="bg-[#0f1414] p-2 border border-[#3a4a49]/60 flex justify-between items-center">
          <span className="text-[#839493]">PINCER TORQUE:</span>
          <span className="text-[#00ffff] font-bold">{stats.pincerTorque} N/m</span>
        </div>
        <div className="bg-[#0f1414] p-2 border border-[#3a4a49]/60 flex justify-between items-center">
          <span className="text-[#839493]">SHELL HARDNESS:</span>
          <span className="text-[#00ffff] font-bold">{stats.shellHardness} Mohs</span>
        </div>
        <div className="bg-[#0f1414] p-2 border border-[#3a4a49]/60 flex justify-between items-center">
          <span className="text-[#839493]">PROCESSING POWER:</span>
          <span className="text-[#00ffff] font-bold">{stats.processingPower} TFLOPS</span>
        </div>
        <div className="bg-[#0f1414] p-2 border border-[#3a4a49]/60 flex justify-between items-center">
          <span className="text-[#839493]">CLAW STRENGTH:</span>
          <span className="text-[#00ffff] font-bold">{stats.clawStrength} PSI</span>
        </div>
      </div>
    </div>
  )
}
