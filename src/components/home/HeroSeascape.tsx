/** Three decorative, server-rendered layers; no downloads or animation loop. */
export function HeroSeascape() {
  return (
    <div className="home-hero-seascape" aria-hidden="true">
      <div className="home-hero-sky" />
      <div className="home-hero-horizon" />
      <div className="home-hero-ocean">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" focusable="false">
          {/* Increasing separation and width suggest ripples approaching from the horizon. */}
          {[0, 5, 13, 25, 43, 68, 101, 145, 201, 271].map((y, i) => (
            <path
              key={y}
              d={`M-100 ${y} Q80 ${y - 7} 260 ${y} T620 ${y} T980 ${y} T1340 ${y} T1700 ${y}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5 + i * 0.12}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
