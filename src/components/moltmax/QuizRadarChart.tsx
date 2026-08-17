import React from 'react'
import { type QuizDimension } from '@/lib/moltmax-quiz'

interface QuizRadarChartProps {
  scores: Record<QuizDimension, number>
}

const dimensions: Array<{ key: QuizDimension; label: string }> = [
  { key: 'shellHardness', label: 'SHELL' },
  { key: 'pincerTorque', label: 'TORQUE' },
  { key: 'neuralLatency', label: 'SYNAPSE' },
  { key: 'ecdysisDiscipline', label: 'ECDYSIS' },
  { key: 'depthTolerance', label: 'DEPTH' },
]

const pointFor = (index: number, value: number, radius: number, center: number) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5
  const distance = radius * (value / 100)
  return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`
}

export const QuizRadarChart: React.FC<QuizRadarChartProps> = ({ scores }) => {
  const center = 120
  const rings = [25, 50, 75, 100]
  const scorePoints = dimensions.map(({ key }, index) => pointFor(index, scores[key], 88, center)).join(' ')
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox="0 0 240 240" className="h-full w-full overflow-visible" role="img" aria-label="Five-vector biometric radar chart">
        {rings.map((ring) => <polygon key={ring} points={dimensions.map((_, index) => pointFor(index, ring, 88, center)).join(' ')} fill="none" stroke="rgba(0,195,255,0.2)" strokeWidth="1" />)}
        {dimensions.map(({ key }, index) => <line key={key} x1={center} y1={center} x2={pointFor(index, 100, 88, center).split(',')[0]} y2={pointFor(index, 100, 88, center).split(',')[1]} stroke="rgba(0,195,255,0.2)" strokeWidth="1" />)}
        <polygon points={scorePoints} fill="rgba(0,255,204,0.2)" stroke="#00ffcc" strokeWidth="2" className="transition-all duration-700" />
        {dimensions.map(({ key }, index) => {
          const [x, y] = pointFor(index, scores[key], 88, center).split(',')
          return <circle key={key} cx={x} cy={y} r="3.5" fill="#00ffcc" stroke="#020408" strokeWidth="2" />
        })}
        {dimensions.map(({ key, label }, index) => {
          const [x, y] = pointFor(index, 117, 88, center).split(',')
          return <text key={key} x={x} y={y} fill="#839493" fontSize="8" textAnchor="middle" dominantBaseline="middle" className="font-mono tracking-widest">{label}</text>
        })}
      </svg>
    </div>
  )
}
