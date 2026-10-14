/**
 * The hero's night scene, all server-rendered CSS/SVG: no downloads and no animation loop.
 * `HeroSky` fills the hero stage behind the particles. `HeroSea` is anchored to the shell's box,
 * so on every layout the horizon sits just under the shell and its light falls on the water
 * straight below it, however the copy above or beside it wraps.
 */
export function HeroSky() {
  return (
    <div className="home-hero-sky" aria-hidden="true">
      <div className="home-hero-stars" />
      <div className="home-hero-stars home-hero-stars--far" />
      <div className="home-hero-moon" />
    </div>
  )
}

// Ripple lines from the horizon toward the viewer: spacing and weight grow with nearness.
const RIPPLES = [0, 4, 10, 19, 32, 50, 74, 105, 145, 196, 260]

// A column of glints under the shell, narrow at the horizon and spreading toward the viewer.
const GLINTS = Array.from({ length: 34 }, (_, i) => {
  const t = i / 33
  const y = 2 + Math.pow(t, 1.7) * 300
  const spread = 14 + t * 150
  // Deterministic scatter so server and client render the same markup.
  const jitter = Math.sin(i * 12.9898) * 0.5 + Math.sin(i * 4.1) * 0.5
  const x = 720 + jitter * spread
  const w = 6 + t * 34 + Math.abs(Math.sin(i * 7.3)) * 14
  return { x, y, w, h: 0.8 + t * 1.6, group: i % 2 }
})

export function HeroSea() {
  return (
    <div className="home-hero-sea" aria-hidden="true">
      <div className="home-hero-sea-haze" />
      <div className="home-hero-sea-water">
        <svg className="home-hero-sea-ripples" viewBox="0 0 1440 320" preserveAspectRatio="none" focusable="false">
          {RIPPLES.map((y, i) => (
            <path
              key={y}
              d={`M-100 ${y} Q80 ${y - 3 - i * 0.6} 260 ${y} T620 ${y} T980 ${y} T1340 ${y} T1700 ${y}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.6 + i * 0.14}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <svg className="home-hero-sea-glints" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMin slice" focusable="false">
          {[0, 1].map((group) => (
            <g key={group} className={`home-hero-glint-set home-hero-glint-set--${group}`}>
              {GLINTS.filter((g) => g.group === group).map((g) => (
                <rect key={g.y} x={g.x - g.w / 2} y={g.y} width={g.w} height={g.h} rx={g.h / 2} />
              ))}
            </g>
          ))}
        </svg>
      </div>
      <div className="home-hero-sea-line" />
    </div>
  )
}
