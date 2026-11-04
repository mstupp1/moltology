import React from 'react'

/** Still image of the core for no-WebGL devices and while the 3D code loads. */
export function SynapticCoreFallback() {
  return (
    <div
      data-testid="synaptic-entity-fallback"
      aria-hidden="true"
      className="w-full h-full min-h-[140px] flex items-center justify-center relative overflow-hidden select-none"
    >
      <div
        className="w-28 h-28 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 195, 255, 0.22) 0%, rgba(3, 18, 26, 0.95) 58%, rgba(0, 195, 255, 0.55) 100%)',
          boxShadow: '0 0 40px rgba(0, 195, 255, 0.18)',
        }}
      />
    </div>
  )
}
