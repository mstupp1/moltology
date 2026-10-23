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

// Math.pow/Math.sin can differ in the last digit between Node and the browser,
// so round to keep the SSR attributes identical to the hydrated ones.
const round = (n: number) => Math.round(n * 100) / 100

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
      </div>
      <div className="home-hero-sea-line" />
    </div>
  )
}
