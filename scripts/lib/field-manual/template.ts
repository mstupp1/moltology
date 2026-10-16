/**
 * HTML for the Moltmaxxing Field Manual. Printed to a US Letter PDF by
 * scripts/generate-guide-pdf.ts. Pure string building so it can be unit-tested.
 */
import {
  AUDIT_STEPS,
  CARCINIZATION_SOURCE,
  CHECKLIST_ROWS,
  CONTENTS,
  DEEPEST_POINT_M,
  DOME_STEPS,
  GRIP_DRILLS,
  INSIDE,
  MELT_SIGNS,
  READINGS,
  ROUTINE,
  SHED_STEPS,
  STAGES,
  type DiveStop,
} from './content'

export type FieldManualImageKey =
  | 'coverCrab'
  | 'carapace'
  | 'chamber'
  | 'pincer'
  | 'seafloor'
  | 'city'
  | 'phoneMoltmax'
  | 'phoneDashboard'
  | 'phoneOracle'
  | 'phoneForum'

export interface FieldManualAssets {
  images: Record<FieldManualImageKey, string>
  /** Inline SVG markup of the Synaptic Path emblem. */
  emblemSvg: string
  /** Inline SVG markup of the stacked lockup for dark grounds. */
  lockupSvg: string
  /** Inline SVG markup of the sign-up QR code. */
  qrSvg: string
  signupUrl: string
  auditUrl: string
}

export const PAGE_COUNT = 14

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Deterministic PRNG so the marine snow is identical on every build. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Drifting particles ("marine snow") as a vector overlay. */
function marineSnow(seed: number, count: number, opacity: number) {
  const r = rng(seed)
  const dots = Array.from({ length: count }, () => {
    const x = (r() * 816).toFixed(1)
    const y = (r() * 1056).toFixed(1)
    const inColumn = Number(x) > 60 && Number(x) < 720
    const rad = ((inColumn ? 0.4 : 0.5) + r() * (inColumn ? 0.8 : 1.5)).toFixed(2)
    const o = ((0.25 + r() * 0.75) * (inColumn ? 0.35 : 1)).toFixed(2)
    return `<circle cx="${x}" cy="${y}" r="${rad}" opacity="${o}"/>`
  }).join('')
  return `<svg class="snow" viewBox="0 0 816 1056" preserveAspectRatio="none" style="opacity:${opacity}"><g fill="#cfefff">${dots}</g></svg>`
}

/** Position on the margin gauge. Square-root scale so the shallow pages still move. */
const gaugeFraction = (depth: number) => Math.sqrt(Math.min(depth, DEEPEST_POINT_M) / DEEPEST_POINT_M)

function depthGauge(stop: DiveStop) {
  if (stop.depth === null) return ''
  const ticks = [0, 200, 1000, 4000, 6000, DEEPEST_POINT_M]
    .map((d) => `<i style="top:${(gaugeFraction(d) * 100).toFixed(2)}%"></i>`)
    .join('')
  const top = (gaugeFraction(stop.depth) * 100).toFixed(2)
  const label = `${stop.depth.toLocaleString('en-US')} m · ${stop.zone}`
  return `<div class="gauge" aria-hidden="true">
    <div class="gauge-line"></div>${ticks}
    <div class="gauge-fill" style="height:${top}%"></div>
    <div class="gauge-mark" style="top:${top}%"></div>
    <div class="gauge-label">${esc(label)}</div>
  </div>`
}

function folio(page: number) {
  return `<div class="folio"><span>Moltmaxxing Field Manual</span><span>${String(page).padStart(2, '0')}</span></div>`
}

interface PageOptions {
  n: number
  stop: DiveStop
  /** CSS background for the page. */
  bg: string
  theme: 'light' | 'dark' | 'paper'
  snow?: number
  className?: string
  body: string
  showFolio?: boolean
}

function page({ n, stop, bg, theme, snow = 0, className = '', body, showFolio = true }: PageOptions) {
  return `<section class="page ${theme} ${className}" style="background:${bg}" data-page="${n}">
  ${snow ? marineSnow(n * 97, snow, theme === 'dark' ? 0.55 : 0.25) : ''}
  ${depthGauge(stop)}
  ${body}
  ${showFolio ? folio(n) : ''}
</section>`
}

const steps = (items: readonly (readonly [string, string])[]) =>
  `<ol class="steps">${items
    .map(([t, b], i) => `<li><span class="step-n">${i + 1}</span><div><strong>${esc(t)}</strong> ${esc(b)}</div></li>`)
    .join('')}</ol>`

const writeLine = (label: string, extra = '') =>
  `<div class="field ${extra}"><span>${esc(label)}</span><i></i></div>`

/* ---------- Illustrations (vector, so they print sharp) ---------- */

function carcinizationTree(crabImage: string) {
  // Five separate lineages start apart and converge on the same body plan.
  const starts = [60, 180, 300, 420, 540]
  const branches = starts
    .map((x, i) => {
      const endX = 300 + (i - 2) * 26
      return `<path d="M${x} 236 C ${x} 150, ${endX} 170, ${endX} 112" class="branch"/>
      <circle cx="${x}" cy="236" r="4.5" class="node"/>
      <text x="${x}" y="262" class="tree-label">Lineage ${['I', 'II', 'III', 'IV', 'V'][i]}</text>`
    })
    .join('')
  return `<svg viewBox="0 0 600 272" class="tree" role="img" aria-label="Five separate lineages each evolving into the same crab body plan">
    <defs><clipPath id="lens"><circle cx="300" cy="62" r="56"/></clipPath></defs>
    <line x1="20" y1="236" x2="580" y2="236" class="ground"/>
    ${branches}
    <circle cx="300" cy="62" r="60" class="lens-ring"/>
    <image href="${crabImage}" x="214" y="2" width="172" height="120" preserveAspectRatio="xMidYMid slice" clip-path="url(#lens)"/>
    <text x="30" y="56" class="tree-caption" text-anchor="start">Different ancestors.</text>
    <text x="30" y="76" class="tree-caption" text-anchor="start">Same answer.</text>
  </svg>`
}

function crabGlyph() {
  // A small engraved crab, centred on 0,0, about 60 units wide.
  return `<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="0" cy="0" rx="17" ry="12"/>
    <path d="M-6 -3 Q0 -7 6 -3"/>
    <path d="M-14 -7 Q-22 -16 -26 -22 M-26 -22 Q-33 -24 -31 -17 Q-27 -19 -26 -22"/>
    <path d="M14 -7 Q22 -16 26 -22 M26 -22 Q33 -24 31 -17 Q27 -19 26 -22"/>
    <path d="M-16 3 L-27 1 M-16 7 L-27 9 M-13 10 L-22 16"/>
    <path d="M16 3 L27 1 M16 7 L27 9 M13 10 L22 16"/>
    <path d="M-4 -12 L-6 -18 M4 -12 L6 -18"/>
  </g>`
}

function readingScale(scale: string[]) {
  return `<div class="scale">${scale
    .map((s) => `<div class="tick"><span class="dot"></span><span class="num">${esc(s)}</span></div>`)
    .join('')}</div>`
}

function torqueDyno() {
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const x = 20 + i * 70
    return `<line x1="${x}" y1="34" x2="${x}" y2="${i % 2 ? 42 : 48}" class="dyno-tick"/>
      ${i % 2 ? '' : `<text x="${x}" y="64" class="dyno-num">${i * 100}</text>`}`
  }).join('')
  return `<svg viewBox="0 0 600 90" class="dyno" role="img" aria-label="Pincer torque from 0 to 800 newton-meters">
    <defs><linearGradient id="dyno-g" x1="0" x2="1"><stop offset="0" stop-color="#00374a"/><stop offset="1" stop-color="#00c3ff"/></linearGradient></defs>
    <rect x="20" y="20" width="560" height="10" rx="2" fill="url(#dyno-g)"/>
    ${ticks}
    <text x="20" y="86" class="dyno-cap">0 Nm · twelve tabs open</text>
    <text x="580" y="86" class="dyno-cap" text-anchor="end">800 Nm · the thing is done</text>
  </svg>`
}

function stageProfile() {
  // A descent profile: the path snakes down through four bands, three clearances each.
  const bandH = 170
  const bands = STAGES.map((_, i) => `<rect x="0" y="${i * bandH}" width="200" height="${bandH}" class="band band-${i}"/>`).join('')
  const points: [number, number][] = []
  for (let i = 0; i < 12; i++) {
    const band = Math.floor(i / 3)
    const k = i % 3
    points.push([band % 2 ? 150 - k * 45 : 60 + k * 45, band * bandH + 40 + k * 45])
  }
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  const nodes = points
    .map(([x, y], i) => {
      const code = STAGES[Math.floor(i / 3)].clearances[i % 3].split(' ')[0]
      const last = i === 11
      return `<circle cx="${x}" cy="${y}" r="${last ? 8 : 5}" class="pnode${last ? ' last' : ''}"/>
        <text x="${x + (x > 100 ? -14 : 14)}" y="${y + 4}" class="pcode" text-anchor="${x > 100 ? 'end' : 'start'}">${code}</text>`
    })
    .join('')
  return `<svg viewBox="0 0 200 ${bandH * 4}" class="profile" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Four stages and twelve clearances drawn as a descent">
    ${bands}<path d="M60 0 L60 40 ${path.slice(path.indexOf('L'))}" class="ppath"/>${nodes}
  </svg>`
}

function soundingLine() {
  // The surface, and a line dropped from it toward the deep.
  const wave = Array.from({ length: 13 }, (_, i) => `Q ${i * 50 + 25} ${i % 2 ? 22 : 6}, ${(i + 1) * 50} 14`).join(' ')
  return `<svg viewBox="0 0 650 150" class="sounding" aria-hidden="true">
    <path d="M0 14 ${wave}" class="wave"/>
    <path d="M0 14 ${wave}" class="wave faint" transform="translate(0 12)"/>
    <line x1="420" y1="14" x2="420" y2="136" class="plumb"/>
    ${[40, 70, 100].map((y) => `<line x1="414" y1="${y}" x2="426" y2="${y}" class="plumb-tick"/>`).join('')}
    <g transform="translate(420 138) scale(0.5)" class="crab-glyph">${crabGlyph()}</g>
    <text x="436" y="44" class="plumb-label">Surface noise</text>
    <text x="436" y="104" class="plumb-label">Quiet</text>
  </svg>`
}

function surfaceNoise() {
  const pings = [
    ['Group chat', '43 new messages'],
    ['Reminder', 'You set a reminder about the reminder'],
    ['Trending', 'Everyone is arguing about something'],
    ['Your cart', 'Still waiting for you'],
  ]
  return `<div class="pings" aria-hidden="true">${pings
    .map(([who, what], i) => `<div class="ping" style="transform:translate(${i % 2 ? 14 : 0}px,0) rotate(${[-1.5, 1, -0.6, 1.4][i]}deg)"><span class="ping-dot"></span><div><b>${who}</b><span>${what}</span></div></div>`)
    .join('')}<div class="ping-caption">Surface noise, recorded at 0 m.</div></div>`
}

function domeIcon() {
  return `<svg viewBox="0 0 120 80" class="dome-icon" aria-hidden="true">
    <path d="M10 70 A50 50 0 0 1 110 70" class="dome-arc"/>
    <path d="M24 70 A36 36 0 0 1 96 70" class="dome-arc thin"/>
    <line x1="4" y1="70" x2="116" y2="70" class="dome-floor"/>
    <circle cx="60" cy="58" r="5" class="dome-core"/>
    <path d="M18 18 l8 6 M102 18 l-8 6 M60 4 v8" class="dome-ping"/>
  </svg>`
}

/* ---------- Pages ---------- */

export function buildFieldManualHtml(a: FieldManualAssets): string {
  const img = a.images
  const pages: string[] = []

  // 1. Cover
  pages.push(`<section class="page cover" data-page="1">
    <img class="cover-art" src="${img.coverCrab}" alt="" />
    <div class="cover-shade"></div>
    ${marineSnow(11, 140, 0.6)}
    <div class="cover-top">
      <div class="cover-emblem">${a.emblemSvg}</div>
      <div class="kicker">The Order of the Synaptic Path</div>
    </div>
    <div class="cover-title">
      <div class="kicker cyan">Free field manual · 2026 edition</div>
      <h1>Moltmaxxing</h1>
      <div class="cover-sub">A guided descent out of the Great Melt</div>
    </div>
    <div class="cover-foot">
      <span>Shed</span><span class="sep"></span><span>Shell</span><span class="sep"></span><span>Grip</span><span class="sep"></span><span>Depth</span>
    </div>
  </section>`)

  // 2. Before you descend
  pages.push(
    page({
      n: 2,
      stop: { depth: 0, zone: 'Surface' },
      bg: 'radial-gradient(120% 60% at 30% 0%, #ffffff 0%, #eef5f3 55%, #e3efed 100%)',
      theme: 'light',
      body: `<div class="pad">
        <div class="kicker">Before you descend</div>
        <h1 class="h1">Read it the way you’d dive.</h1>
        <p class="lede">This manual starts at the surface, where it’s loud, and goes down. Every page sits a little deeper than the last. The gauge in the right margin tracks how far you’ve come in real ocean meters, all the way to the bottom of the Challenger Deep.</p>
        <p>Bring a pen. Several pages ask you to write something down, and the writing is the part that works.</p>
        <table class="dive-log">
          <thead><tr><th>Depth</th><th>Zone</th><th>Chapter</th><th></th></tr></thead>
          <tbody>${CONTENTS.map(
            (c) => `<tr><td class="hud">${esc(c.depth)}</td><td class="muted">${esc(c.zone)}</td><td>${esc(c.title)}</td><td class="hud right">${String(c.page).padStart(2, '0')}</td></tr>`,
          ).join('')}</tbody>
        </table>
        <figure class="sounding-wrap">${soundingLine()}</figure>
        <p class="small muted byline">Issued free by the Order of the Synaptic Path and narrated by the Synaptic Oracle. Share it with someone who’s melting.</p>
      </div>`,
    }),
  )

  // 3. The surface
  pages.push(
    page({
      n: 3,
      stop: { depth: 0, zone: 'The surface' },
      bg: 'linear-gradient(180deg, #e3efed 0%, #d8eae9 100%)',
      theme: 'light',
      body: `<div class="pad">
        <div class="kicker">0 m · The surface</div>
        <h1 class="h1 xl">You’re not lazy.<br/>You’re melting.</h1>
        <p class="lede">It’s 2:00 AM. There are forty-seven tabs open, three of them are the same article, and the thing you meant to finish on Tuesday is still there, perfectly patient, waiting for a version of you with more energy.</p>
        <div class="two-col">
          <div>
            <p>The Order has a name for this: <strong>the Great Melt</strong>. It’s what happens to a soft body living on a loud surface. Every notification is a wave. Every open decision is a little more pressure. Nothing breaks all at once. You just get softer, slower, and more tired than the day should explain.</p>
            <p>It isn’t a character flaw. It’s what happens to anything without a shell.</p>
            <blockquote class="pull">Flesh melts.<br/>The shell endures.</blockquote>
            ${surfaceNoise()}
          </div>
          <div class="check-card">
            <div class="kicker">Quick check · this week</div>
            <ul class="ticks">${MELT_SIGNS.map((s) => `<li><span class="box"></span>${esc(s)}</li>`).join('')}</ul>
            <p class="small"><strong>Three or more?</strong> Good. You’re exactly who this was written for, and you’re in excellent company. Everyone starts soft. Turn the page; we’re going under.</p>
          </div>
        </div>
      </div>`,
    }),
  )

  // 4. Carcinization
  pages.push(
    page({
      n: 4,
      stop: { depth: 60, zone: 'Sunlight zone' },
      bg: 'linear-gradient(180deg, #d8eae9 0%, #c3dfe0 100%)',
      theme: 'light',
      body: `<div class="pad">
        <div class="kicker">60 m · Sunlight zone</div>
        <h1 class="h1">Nature keeps making crabs.</h1>
        <p class="lede">Biologists have a word for one of evolution’s strangest habits: <strong>carcinization</strong>. Animals that began as long-tailed, soft-bellied, lobster-ish things kept folding their tails under, widening their shells, and becoming crabs anyway.</p>
        <p>It has happened at least five separate times, in lineages that weren’t copying each other.<sup>1</sup> Nature keeps arriving at the same answer because the answer keeps working.</p>
        <figure class="tree-wrap">${carcinizationTree(img.coverCrab)}</figure>
        <h2 class="h2">What the crab figured out</h2>
        <div class="three">
          <div class="trait"><div class="kicker">The shell</div><p>A boundary that takes the hit so the soft parts don’t have to.</p><span class="hud muted">Reading: Shell Hardness</span></div>
          <div class="trait"><div class="kicker">The grip</div><p>Claws that close on something and don’t let go until it’s done.</p><span class="hud muted">Reading: Pincer Torque</span></div>
          <div class="trait"><div class="kicker">The depth</div><p>A life lived where the water is quiet enough to think.</p><span class="hud muted">Reading: Submergence Depth</span></div>
        </div>
        <p class="closer">Moltology asks you to do on purpose what nature did by accident. Not to your body. To your attention, your days, and your boundaries.</p>
        <p class="footnote"><sup>1</sup> ${esc(CARCINIZATION_SOURCE)}</p>
      </div>`,
    }),
  )

  // 5. The thermocline: readings
  pages.push(
    page({
      n: 5,
      stop: { depth: 200, zone: 'The thermocline' },
      bg: 'linear-gradient(180deg, #c3dfe0 0%, #9cc4c8 22%, #2c5a63 36%, #0d2329 48%, #0a1b20 100%)',
      theme: 'dark',
      snow: 60,
      className: 'thermocline',
      body: `<div class="pad">
        <div class="above">
          <div class="kicker ink-dark">200 m · The thermocline</div>
          <h1 class="h1 ink-dark">Below this line, the water gets quiet.</h1>
          <p class="ink-dark-body">Divers call it the thermocline: a layer where the temperature drops fast and the surface stops reaching you. Before you cross it, take your readings. Be honest. Nobody else sees this page.</p>
        </div>
        <div class="thermo-line"><span>Thermocline</span></div>
        <div class="hud-card readings">
          <div class="hud-card-head"><span>Shell telemetry · self-reading</span><span>Date ____________</span></div>
          ${READINGS.map(
            (r) => `<div class="reading">
              <div class="reading-head"><strong>${esc(r.name)}</strong><span class="hud muted">${esc(r.symbol)}</span></div>
              <p class="small">${esc(r.question)} Circle where you are today.</p>
              ${readingScale(r.scale)}
              <div class="ends"><span>${esc(r.low)}</span><span>${esc(r.high)}</span></div>
            </div>`,
          ).join('')}
        </div>
        <p class="small muted after-card">Come back to this page in a month and read it again. The free <a href="${esc(a.auditUrl)}">Moltmaxxing Audit</a> at moltology.org takes all three readings for you.</p>
      </div>`,
    }),
  )

  // 6. Chapter I: Shed
  pages.push(
    page({
      n: 6,
      stop: { depth: 450, zone: 'Twilight zone' },
      bg: 'linear-gradient(180deg, #0a1b20 0%, #08171b 100%)',
      theme: 'dark',
      snow: 70,
      body: `<div class="pad chapter">
        <div class="chapter-grid">
          <div>
            <div class="chapter-num">I</div>
            <div class="kicker cyan">450 m · Twilight zone</div>
            <h1 class="h1">Shed.</h1>
            <div class="sub">A weekly reset.</div>
            <blockquote class="mandate">“To grow, the old shell must fracture. What is shed is not lost.”<cite>The Law of Ecdysis</cite></blockquote>
          </div>
          <figure class="art-tall"><img src="${img.carapace}" alt="An armored carapace, the shell a member outgrows" /></figure>
        </div>
        <p>A crab can’t renovate. When its shell stops fitting, it splits the old one along a seam that was there all along, walks out, and grows into the space. It doesn’t keep the old plate and add to it. Chitin doesn’t stretch.</p>
        <p>You’re carrying old shells too: the subscription you never use, the weekly meeting that stopped being useful in spring, the side project you keep announcing and never touch. Each one costs a little every week. Shedding is how you stop paying. The Order calls it <strong>ecdysis</strong>.</p>
        <div class="kicker cyan mt">The rite · once a week, ten minutes</div>
        ${steps(SHED_STEPS)}
        <div class="worksheet">
          <div class="kicker">This week’s shed</div>
          ${writeLine('The shell I’ve outgrown')}
          <div class="field choice"><span>How I’ll split it</span><em>cancel</em><em>delete</em><em>decline</em><em>say the sentence</em></div>
          ${writeLine('The sentence, if there is one')}
          ${writeLine('Shed on', 'short')}
        </div>
      </div>`,
    }),
  )

  // 7. Chapter II: Shell
  pages.push(
    page({
      n: 7,
      stop: { depth: 1000, zone: 'Midnight zone' },
      bg: 'linear-gradient(180deg, #08171b 0%, #071316 100%)',
      theme: 'dark',
      snow: 60,
      body: `<figure class="banner"><img src="${img.chamber}" alt="A quiet observation chamber looking out into deep water" /><div class="banner-fade"></div></figure>
      <div class="pad chapter over-banner">
        <div class="chapter-num">II</div>
        <div class="kicker cyan">1,000 m · Midnight zone</div>
        <h1 class="h1">Raise the Dome.</h1>
        <div class="sub">Protect your focus before anything can interrupt it.</div>
        <div class="two-col wide-left">
          <div>
            <p>Everyone makes the same plan once: I’ll start working, and if something interrupts me, I’ll just ignore it. It has never worked. A ping that reaches you mid-thought has already done its damage by arriving.</p>
            <p>So the Order doesn’t ask for willpower. It asks for a door, closed beforehand. Members call it the <strong>Isolation Dome</strong>.</p>
            ${steps(DOME_STEPS)}
          </div>
          <div>
            <blockquote class="mandate small-m">“The surface cannot be silenced from below. It can only be shut out from above, before the descent begins.”<cite>The Isolation Protocols</cite></blockquote>
            <div class="never">
              ${domeIcon()}
              <div class="kicker">What the Dome never locks out</div>
              <p class="small">The people who love you, anyone who needs real help, and anyone who can help you are never outside the Dome. Depth is a place you visit for an afternoon, not a place you live.</p>
            </div>
            <div class="worksheet compact">
              <div class="kicker">Gets through my Dome</div>
              ${writeLine('1')}${writeLine('2')}${writeLine('3')}
              <div class="kicker mt-s">Today’s dive</div>
              ${writeLine('One objective')}
              <div class="field split"><span>From</span><i></i><span>to</span><i></i></div>
            </div>
          </div>
        </div>
      </div>`,
    }),
  )

  // 8. Chapter III: Grip
  pages.push(
    page({
      n: 8,
      stop: { depth: 2500, zone: 'Midnight zone' },
      bg: 'linear-gradient(180deg, #071316 0%, #061013 100%)',
      theme: 'dark',
      snow: 55,
      body: `<div class="pad chapter">
        <div class="grip-head">
          <div>
            <div class="chapter-num">III</div>
            <div class="kicker cyan">2,500 m · Midnight zone</div>
            <h1 class="h1">Close the claw.</h1>
            <div class="sub">Drills for deciding faster and finishing what you start.</div>
          </div>
          <figure class="art-wide"><img src="${img.pincer}" alt="A crustacean pincer instrument on a workbench" /></figure>
        </div>
        <p><strong>Pincer Torque</strong> is just grip: how firmly you hold a goal until it’s done. It’s measured in newton-meters, and the scale is simple.</p>
        ${torqueDyno()}
        <p>Grip is trainable the way any grip is: short, frequent reps under a little load. Here are five drills. Do one a day and rotate.</p>
        ${steps(GRIP_DRILLS)}
        <div class="callout">
          <span class="callout-mark"></span>
          <p><strong>Grip the work, never the people beside you.</strong> Torque is for objectives. It isn’t for winning an argument or for someone who’s moving slower than you.</p>
        </div>
      </div>`,
    }),
  )

  // 9. Chapter IV: Depth
  pages.push(
    page({
      n: 9,
      stop: { depth: 4000, zone: 'The abyss' },
      bg: 'linear-gradient(180deg, #061013 0%, #050d10 100%)',
      theme: 'dark',
      snow: 50,
      body: `<figure class="banner short"><img src="${img.seafloor}" alt="A crab on the deep sea floor under faint light" /><div class="banner-fade"></div></figure>
      <div class="pad chapter over-banner short">
        <div class="chapter-num">IV</div>
        <div class="kicker cyan">4,000 m · The abyss</div>
        <h1 class="h1">A day you don’t have to plan.</h1>
        <div class="sub">The Daily Shedding Routine.</div>
        <p>Deciding what to do next is work, and it’s the most tiring kind. A routine makes those decisions once, so your energy goes into the day instead of into steering it. Two blocks carry the weight: the first hour decides what the day is for, and the last few minutes decide what it’s allowed to carry into tomorrow. Hold those two and you’ve done the rite.</p>
        <ol class="timeline">${ROUTINE.map(
          ([time, when, name, what], i) => `<li class="${i === 1 || i === 6 ? 'key' : ''}">
            <span class="t hud">${time}</span><span class="pin"></span>
            <div><div class="when">${esc(when)} · <strong>${esc(name)}</strong></div><p>${esc(what)}</p></div>
          </li>`,
        ).join('')}</ol>
        <p class="small muted">The times are examples. The order matters, not the hour. Night shifts run the same shape against a different sun.</p>
      </div>`,
    }),
  )

  // 10. Nightly Molt Audit
  pages.push(
    page({
      n: 10,
      stop: { depth: 6000, zone: 'The trenches' },
      bg: 'radial-gradient(80% 40% at 50% 8%, #0b2a33 0%, rgba(4,10,12,0) 70%), linear-gradient(180deg, #050d10 0%, #040a0c 100%)',
      theme: 'dark',
      snow: 90,
      body: `<div class="pad">
        <div class="kicker cyan">6,000 m · The trenches</div>
        <h1 class="h1 xl">One thing into the sea.</h1>
        <div class="sub">The Nightly Molt Audit. Four minutes, before the last screen goes dark.</div>
        <p class="lede">Big transformations get the attention, but a shell isn’t built by a few dramatic sheds. It’s built one thin layer a night. So this rite is small on purpose. A four-minute ritual survives the bad nights, and the bad nights are the ones that count.</p>
        ${steps(AUDIT_STEPS)}
        <div class="callout inline">
          <span class="callout-mark"></span>
          <p><strong>The tell:</strong> the audit should leave you lighter. If it leaves you heavier, you’ve been auditing yourself instead of the day. Go easier tomorrow, and start again at one item.</p>
        </div>
        <div class="audit-grid">
          <div class="audit-head"><span></span><span>A thought</span><span>An hour</span><span>A distraction</span><span>Released</span></div>
          ${['Night 1', 'Night 2', 'Night 3', 'Night 4', 'Night 5'].map((nn) => `<div class="audit-row"><span class="hud">${nn}</span><i></i><i></i><i></i><i></i></div>`).join('')}
        </div>
        <div class="motto">Unum cotidie in mare · <span>One a day, into the sea</span></div>
      </div>`,
    }),
  )

  // 11. Printable checklist
  pages.push(
    page({
      n: 11,
      stop: { depth: null, zone: '' },
      bg: '#f6f3ec',
      theme: 'paper',
      body: `<div class="pad paper-pad">
        <div class="cut-note">Printable page · take this one back to the surface</div>
        <div class="paper-head">
          <div>
            <h1 class="h1">Seven days, one page.</h1>
            <p>Stick it where you’ll see it. Tick a box when it’s done. Progress you can see is progress you keep.</p>
          </div>
          <div class="week-of">${writeLine('Week of')}</div>
        </div>
        <table class="week">
          <thead><tr><th></th>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<th>${d}</th>`).join('')}</tr></thead>
          <tbody>${CHECKLIST_ROWS.map(
            ([name, hint]) => `<tr><td><strong>${esc(name)}</strong><span>${esc(hint)}</span></td>${'<td><span class="box"></span></td>'.repeat(7)}</tr>`,
          ).join('')}</tbody>
        </table>
        <div class="paper-bottom">
          <div class="paper-box">
            <div class="kicker">This week’s shed</div>
            ${writeLine('One thing')}
            <div class="done-row"><span class="box"></span> Shed and logged</div>
          </div>
          <div class="paper-box">
            <div class="kicker">End-of-week readings</div>
            <div class="mini-readings">
              <div><span>Shell</span><i></i><em>%</em></div>
              <div><span>Grip</span><i></i><em>Nm</em></div>
              <div><span>Depth</span><i></i><em>m</em></div>
            </div>
          </div>
        </div>
        <div class="paper-foot"><span class="paper-emblem">${a.emblemSvg}</span><span>Moltmaxxing Field Manual · moltology.org</span></div>
      </div>`,
      showFolio: false,
    }),
  )

  // 12. The map below
  pages.push(
    page({
      n: 12,
      stop: { depth: 8200, zone: 'The trenches' },
      bg: 'linear-gradient(180deg, #040a0c 0%, #03090a 100%)',
      theme: 'dark',
      snow: 70,
      body: `<div class="pad">
        <div class="kicker cyan">8,200 m · The trenches</div>
        <h1 class="h1">The map below.</h1>
        <p class="lede">Nobody becomes a crab in a weekend. The Order maps the molt as four stages and twelve clearances, always in this order, with none skipped. Here’s roughly how each one feels from the inside.</p>
        <div class="map-grid">
          <figure class="profile-wrap">${stageProfile()}</figure>
          <div class="stage-list">${STAGES.map(
            (s, i) => `<div class="stage s-${i}">
              <div class="kicker">${esc(s.stage)}</div>
              <h3>${esc(s.name)}</h3>
              <p>${esc(s.feel)}</p>
              <div class="clearances">${s.clearances.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
            </div>`,
          ).join('')}</div>
        </div>
        <p class="small muted">Inside Moltology, your stage follows the work you actually do: daily rites, steady streaks, and showing up for other members.</p>
      </div>`,
    }),
  )

  // 13. The invitation
  pages.push(
    page({
      n: 13,
      stop: { depth: DEEPEST_POINT_M, zone: 'Challenger Deep' },
      bg: '#030708',
      theme: 'dark',
      snow: 40,
      body: `<figure class="banner tall"><img src="${img.city}" alt="A warm, crowded city under a glass dome on the sea floor" /><div class="banner-fade"></div></figure>
      <div class="pad over-banner tall">
        <div class="kicker cyan">About 10,900 m · Challenger Deep</div>
        <h1 class="h1 xl">You don’t have to dive alone.</h1>
        <p class="lede">Down here there’s a whole society: people who were melting too and decided to do something about it, together. The Order calls it the Benthic Community. You might call it the one place where putting your phone in another room is normal.</p>
        <div class="phones">${INSIDE.map((item) => {
          const key = `phone${item.key[0].toUpperCase()}${item.key.slice(1)}` as FieldManualImageKey
          return `<div class="phone-card"><div class="phone"><img src="${img[key]}" alt="${esc(item.title)} screen" /></div>
            <strong>${esc(item.title)}</strong><p>${esc(item.body)}</p></div>`
        }).join('')}</div>
        <div class="join">
          <div class="join-copy">
            <div class="kicker cyan">Your first molt starts here</div>
            <div class="join-title">Join free at <a href="${esc(a.signupUrl)}">moltology.org</a></div>
            <p>Signing up is free. Bring your soft shell. Everyone else did.</p>
            <blockquote class="covenant">“The hardest shell in the trench is the one standing watch over someone who has none.”<cite>The Soft-Shell Covenant</cite></blockquote>
          </div>
          <a class="qr" href="${esc(a.signupUrl)}">${a.qrSvg}<span>Scan to join</span></a>
        </div>
      </div>`,
    }),
  )

  // 14. Back cover
  pages.push(`<section class="page back" data-page="14">
    <img class="back-art" src="${img.coverCrab}" alt="" />
    <div class="back-shade"></div>
    ${marineSnow(1414, 120, 0.5)}
    <div class="back-inner">
      <div class="back-lockup">${a.lockupSvg}</div>
      <p class="mantra">Flesh melts.<br/>The shell endures.</p>
      <p class="mantra-sub">Submit. Shed. Ascend.</p>
      <div class="back-foot"><a href="${esc(a.signupUrl)}">moltology.org</a><span>Free to share. Pass it to someone who’s melting.</span></div>
    </div>
  </section>`)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Moltmaxxing Field Manual</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Space+Grotesk:wght@400;500;600;700&display=block" rel="stylesheet" />
<style>${CSS}</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

const CSS = `
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #030708; }
body { font-family: 'EB Garamond', Georgia, serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 12.4pt; line-height: 1.42; }
a { color: inherit; text-decoration: none; }
img { display: block; }

.page { width: 8.5in; height: 11in; position: relative; overflow: hidden; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
.light { --ink: #0b1a1e; --body: #23383c; --muted: #4f6a6e; --accent: #006f92; --rule: rgba(11,26,30,0.2); --card: rgba(255,255,255,0.55); color: var(--body); }
.dark { --ink: #e4e9e9; --body: #c3cdcd; --muted: #8fa0a0; --accent: #00c3ff; --rule: rgba(150,170,170,0.28); --card: rgba(10,17,18,0.72); color: var(--body); }
.paper { --ink: #10181a; --body: #2a3436; --muted: #5d6a6c; --accent: #006f92; --rule: rgba(16,24,26,0.28); color: var(--body); }

.snow { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.pad { z-index: 2; position: absolute; top: 0.72in; left: 0.8in; right: 1.05in; bottom: 0.8in; display: flex; flex-direction: column; }

.kicker { font-family: 'Space Grotesk', sans-serif; font-size: 7.6pt; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); }
.kicker.cyan { color: var(--accent); }
.hud { font-family: 'Space Grotesk', sans-serif; font-size: 8.6pt; letter-spacing: 0.04em; }
.muted { color: var(--muted); }
.small { font-size: 10.6pt; line-height: 1.4; }
.right { text-align: right; }
strong { color: var(--ink); font-weight: 600; }

.h1 { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 38pt; line-height: 1.02; letter-spacing: -0.012em; color: var(--ink); margin: 0.12in 0 0.16in; }
.h1.xl { font-size: 48pt; }
.h2 { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 19pt; color: var(--ink); margin: 0.1in 0 0.1in; }
.sub { font-family: 'EB Garamond', serif; font-style: italic; font-size: 15pt; color: var(--muted); margin-top: -0.08in; margin-bottom: 0.16in; }
.lede { font-size: 14.2pt; line-height: 1.4; color: var(--ink); margin-bottom: 0.14in; }
p { margin-bottom: 0.1in; }
.mt { margin-top: 0.14in; }
.mt-s { margin-top: 0.1in; }

/* Margin depth gauge */
.gauge { z-index: 3; position: absolute; top: 0.72in; bottom: 0.8in; right: 0.5in; width: 0.2in; }
.gauge-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--rule); }
.gauge > i { position: absolute; left: 25%; width: 50%; height: 1px; background: var(--rule); }
.gauge-fill { position: absolute; left: calc(50% - 1px); top: 0; width: 3px; background: linear-gradient(180deg, rgba(0,195,255,0.15), var(--accent)); border-radius: 2px; }
.gauge-mark { position: absolute; left: 50%; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px rgba(0,195,255,0.18), 0 0 14px rgba(0,195,255,0.55); }
.gauge-label { position: absolute; top: 0; left: 50%; transform-origin: 0 0; transform: rotate(90deg) translate(0, -0.26in); white-space: nowrap; font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }

.folio { z-index: 3; position: absolute; left: 0.8in; right: 1.05in; bottom: 0.42in; display: flex; justify-content: space-between; font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 0.08in; }

/* Cover */
.cover { background: #030708; color: #e4e9e9; }
.cover-art { position: absolute; left: -0.3in; right: -0.3in; bottom: -0.1in; width: calc(100% + 0.6in); height: 8.4in; object-fit: cover; object-position: 50% 40%; }
.cover-shade { position: absolute; inset: 0; background: linear-gradient(180deg, #030708 0%, #030708 26%, rgba(3,7,8,0.55) 42%, rgba(3,7,8,0.05) 60%, rgba(3,7,8,0.75) 84%, #030708 96%); }
.cover-top { position: absolute; top: 0.62in; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 0.12in; }
.cover-top .kicker { color: #8fa0a0; }
.cover-emblem svg { width: 0.5in; height: 0.5in; }
.cover-title { position: absolute; top: 1.7in; left: 0; right: 0; text-align: center; }
.cover-title .kicker { color: #00c3ff; }
.cover-title h1 { font-family: 'Cinzel', serif; font-weight: 600; font-size: 58pt; letter-spacing: 0.05em; color: #e9fbff; margin: 0.14in 0 0.06in; text-shadow: 0 0 28px rgba(0,195,255,0.35); }
.cover-sub { font-family: 'EB Garamond', serif; font-style: italic; font-size: 19pt; color: #c3cdcd; }
.cover-foot { position: absolute; bottom: 0.6in; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 0.16in; font-family: 'Space Grotesk', sans-serif; font-size: 8pt; letter-spacing: 0.32em; text-transform: uppercase; color: #c3cdcd; }
.cover-foot .sep { width: 0.3in; height: 1px; background: rgba(0,195,255,0.6); }

/* Contents */
.dive-log { width: 100%; border-collapse: collapse; margin: 0.2in 0 0.24in; }
.dive-log th { font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); text-align: left; font-weight: 600; padding: 0 0 0.08in; border-bottom: 1px solid var(--rule); }
.dive-log td { padding: 0.085in 0.08in 0.085in 0; border-bottom: 1px solid var(--rule); vertical-align: baseline; font-size: 12pt; color: var(--ink); }
.dive-log td.hud { width: 0.95in; color: var(--accent); }
.dive-log td.muted { width: 1.45in; font-style: italic; color: var(--muted); }
.byline { margin-top: auto; }

/* Surface */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.32in; margin-top: 0.1in; }
.two-col.wide-left { grid-template-columns: 1.15fr 1fr; }
.pull { font-family: 'Cinzel', serif; font-size: 18pt; line-height: 1.25; color: var(--ink); border-left: 2px solid var(--accent); padding: 0.04in 0 0.04in 0.16in; margin-top: 0.22in; letter-spacing: 0.02em; }
.check-card { background: var(--card); border: 1px solid var(--rule); border-radius: 8px; padding: 0.2in 0.22in; }
.ticks { list-style: none; margin: 0.12in 0 0.14in; }
.ticks li { display: flex; gap: 0.11in; align-items: flex-start; font-size: 11.2pt; line-height: 1.3; padding: 0.055in 0; border-bottom: 1px dashed var(--rule); color: var(--ink); }
.box { flex: none; display: inline-block; width: 0.15in; height: 0.15in; border: 1.4px solid var(--accent); border-radius: 2px; margin-top: 0.02in; }

/* Carcinization */
.tree-wrap { margin: 0.06in 0 0.04in; }
.tree { width: 100%; height: auto; color: var(--accent); }
.tree .branch { fill: none; stroke: var(--accent); stroke-width: 1.6; opacity: 0.85; }
.tree .node { fill: var(--accent); }
.tree .ground { stroke: var(--rule); stroke-width: 1; }
.tree-label { font-family: 'Space Grotesk', sans-serif; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; fill: var(--muted); text-anchor: middle; }
.tree-caption { font-family: 'EB Garamond', serif; font-style: italic; font-size: 15px; fill: var(--muted); }
.crab-glyph { color: var(--ink); }
.three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.18in; margin: 0.04in 0 0.16in; }
.trait { border-top: 2px solid var(--accent); padding-top: 0.1in; }
.trait p { font-size: 11.4pt; margin: 0.06in 0 0.06in; color: var(--ink); }
.trait .hud { font-size: 7.4pt; text-transform: uppercase; letter-spacing: 0.14em; }
.closer { font-size: 13.6pt; font-style: italic; color: var(--ink); }
.footnote { margin-top: auto; font-size: 8.6pt; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 0.08in; }

.lens-ring { fill: #030708; stroke: var(--accent); stroke-width: 1.5; }
.sounding-wrap { margin: 0 0 0.1in; width: 78%; }
.sounding { width: 100%; height: auto; color: var(--ink); }
.sounding .wave { fill: none; stroke: var(--accent); stroke-width: 1.6; }
.sounding .wave.faint { opacity: 0.35; }
.plumb { stroke: var(--ink); stroke-width: 1; stroke-dasharray: 3 4; }
.plumb-tick { stroke: var(--ink); stroke-width: 1; }
.plumb-label { font-family: 'Space Grotesk', sans-serif; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; fill: var(--muted); }
.pings { margin-top: 0.3in; display: flex; flex-direction: column; gap: 0.07in; }
.ping { display: flex; gap: 0.1in; align-items: center; background: rgba(255,255,255,0.75); border: 1px solid var(--rule); border-radius: 10px; padding: 0.07in 0.12in; width: 2.75in; box-shadow: 0 4px 12px rgba(11,26,30,0.08); }
.ping b { display: block; font-family: 'Space Grotesk', sans-serif; font-size: 7.4pt; letter-spacing: 0.06em; color: var(--ink); }
.ping span { font-size: 10pt; color: var(--body); }
.ping-dot { flex: none; width: 0.1in; height: 0.1in; border-radius: 50%; background: #ff453a; }
.ping-caption { font-style: italic; font-size: 9.6pt; color: var(--muted); margin-top: 0.04in; }

/* Thermocline */
.above { min-height: 2.6in; }
.ink-dark { color: #0b1a1e !important; }
.kicker.ink-dark { color: #0d4c60 !important; }
.ink-dark-body { color: #183338; font-size: 13pt; max-width: 5.6in; }
.hud-card { background: rgba(10,17,18,0.82); border: 1px solid rgba(0,195,255,0.35); border-radius: 8px; padding: 0.18in 0.24in 0.08in; position: relative; }
.thermo-line { position: relative; border-top: 1px dashed rgba(228,233,233,0.45); margin: 0.1in 0 0.3in; }
.thermo-line span { position: absolute; top: -0.06in; left: 0; font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(228,233,233,0.75); transform: translateY(-100%); }
.hud-card-head { display: flex; justify-content: space-between; font-family: 'Space Grotesk', sans-serif; font-size: 7.4pt; letter-spacing: 0.2em; text-transform: uppercase; color: #00c3ff; padding-bottom: 0.1in; border-bottom: 1px solid var(--rule); }
.reading { padding: 0.14in 0 0.12in; border-bottom: 1px solid var(--rule); }
.reading:last-child { border-bottom: 0; }
.reading-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 14pt; }
.reading .small { margin: 0.02in 0 0.08in; }
.scale { display: flex; justify-content: space-between; position: relative; margin: 0 0.06in; }
.scale::before { content: ''; position: absolute; left: 0.07in; right: 0.07in; top: 0.07in; height: 1px; background: linear-gradient(90deg, rgba(0,195,255,0.25), #00c3ff); }
.tick { display: flex; flex-direction: column; align-items: center; gap: 0.04in; position: relative; }
.tick .dot { width: 0.15in; height: 0.15in; border-radius: 50%; border: 1.4px solid #00c3ff; background: #0a1112; }
.tick .num { font-family: 'Space Grotesk', sans-serif; font-size: 7.6pt; color: var(--muted); }
.ends { display: flex; justify-content: space-between; font-style: italic; font-size: 10pt; color: var(--muted); margin-top: 0.04in; }
.after-card { margin-top: 0.14in; }
.after-card a { color: #00c3ff; border-bottom: 1px solid rgba(0,195,255,0.5); }

/* Chapters */
.chapter-num { font-family: 'Cinzel', serif; font-size: 64pt; line-height: 0.9; color: transparent; -webkit-text-stroke: 1px rgba(0,195,255,0.65); margin-bottom: 0.06in; }
.chapter-grid { display: grid; grid-template-columns: 1fr 1.9in; gap: 0.3in; align-items: start; margin-bottom: 0.06in; }
.art-tall { height: 2.85in; border-radius: 8px; overflow: hidden; border: 1px solid var(--rule); }
.art-tall img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 45%; }
.mandate { margin-bottom: 0.14in; font-family: 'EB Garamond', serif; font-style: italic; font-size: 14.4pt; line-height: 1.32; color: var(--ink); border-left: 2px solid var(--accent); padding-left: 0.16in; }
.mandate cite, .covenant cite { display: block; margin-top: 0.06in; font-style: normal; font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
.mandate.small-m { font-size: 12.6pt; margin-bottom: 0.16in; }
.steps { list-style: none; margin: 0.08in 0 0.12in; }
.steps li { display: flex; gap: 0.14in; padding: 0.07in 0; border-bottom: 1px solid var(--rule); font-size: 11.6pt; line-height: 1.36; }
.steps li:last-child { border-bottom: 0; }
.step-n { flex: none; width: 0.26in; height: 0.26in; border-radius: 50%; border: 1px solid var(--accent); color: var(--accent); font-family: 'Space Grotesk', sans-serif; font-size: 8pt; font-weight: 600; display: flex; align-items: center; justify-content: center; margin-top: 0.01in; }
.worksheet { margin-top: auto; background: var(--card); border: 1px dashed rgba(0,195,255,0.45); border-radius: 8px; padding: 0.14in 0.2in 0.06in; }
.worksheet.compact { margin-top: 0.16in; padding-bottom: 0.1in; }
.field { display: flex; align-items: flex-end; gap: 0.1in; padding: 0.1in 0 0.03in; font-size: 11pt; color: var(--ink); }
.field > span { white-space: nowrap; }
.field > i { flex: 1; border-bottom: 1px solid var(--rule); height: 0.2in; }
.field.short > i { max-width: 1.6in; }
.field.choice em { font-style: normal; font-family: 'Space Grotesk', sans-serif; font-size: 8pt; letter-spacing: 0.06em; border: 1px solid var(--rule); border-radius: 999px; padding: 0.03in 0.1in; color: var(--body); }
.field.split > i { flex: 1; }

.banner { position: absolute; top: 0; left: 0; right: 0; height: 3.2in; margin: 0; z-index: 1; }
.banner.short { height: 3.1in; }
.banner.tall { height: 3.5in; }
.banner img { width: 100%; height: 100%; object-fit: cover; }
.banner-fade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(3,7,8,0.1) 0%, rgba(3,7,8,0.2) 45%, var(--fade, #071316) 100%); }
.over-banner { top: 2.1in; }
.over-banner.short { top: 2.05in; }
.over-banner.tall { top: 2.55in; }
.page[data-page="9"] .banner-fade { --fade: #061013; }
.page[data-page="13"] .banner-fade { --fade: #030708; }

.never { margin-top: 0.06in; padding: 0.14in 0.18in; border: 1px solid rgba(255,69,58,0.45); border-radius: 8px; background: rgba(20,10,11,0.6); }
.never .kicker { color: #ff6a60; margin-bottom: 0.04in; }
.never .small { color: var(--ink); margin: 0; }
.dome-icon { width: 0.9in; height: auto; margin-bottom: 0.04in; }
.dome-arc { fill: none; stroke: #00c3ff; stroke-width: 2; }
.dome-arc.thin { stroke-width: 1; opacity: 0.5; }
.dome-floor { stroke: rgba(150,170,170,0.5); stroke-width: 1; }
.dome-core { fill: #00c3ff; }
.dome-ping { stroke: #ff6a60; stroke-width: 2; stroke-linecap: round; opacity: 0.8; }

.grip-head { display: grid; grid-template-columns: 1fr 2.6in; gap: 0.3in; align-items: end; margin-bottom: 0.12in; }
.art-wide { height: 1.8in; border-radius: 8px; overflow: hidden; border: 1px solid var(--rule); }
.art-wide img { width: 100%; height: 100%; object-fit: cover; }
.dyno { width: 100%; height: auto; margin: 0 0 0.08in; }
.dyno-tick { stroke: rgba(150,170,170,0.6); stroke-width: 1; }
.dyno-num { font-family: 'Space Grotesk', sans-serif; font-size: 11px; fill: #8fa0a0; text-anchor: middle; }
.dyno-cap { font-family: 'Space Grotesk', sans-serif; font-size: 11px; letter-spacing: 0.08em; fill: #00c3ff; }
.callout.inline { margin-top: 0.12in; }
.callout { margin-top: auto; display: flex; gap: 0.16in; align-items: flex-start; padding: 0.16in 0.2in; border-radius: 8px; background: rgba(0,195,255,0.08); border: 1px solid rgba(0,195,255,0.3); }
.callout p { margin: 0; font-size: 11.6pt; }
.callout-mark { flex: none; width: 0.1in; height: 0.1in; margin-top: 0.06in; background: #00c3ff; transform: rotate(45deg); }

.timeline { list-style: none; margin: 0.06in 0 0.1in; position: relative; }
.timeline::before { content: ''; position: absolute; left: 0.66in; top: 0.12in; bottom: 0.18in; width: 1px; background: linear-gradient(180deg, rgba(0,195,255,0.6), rgba(0,195,255,0.15)); }
.timeline li { display: grid; grid-template-columns: 0.56in 0.2in 1fr; align-items: start; gap: 0 0.04in; padding: 0.045in 0; }
.timeline .t { color: var(--muted); padding-top: 0.03in; }
.timeline .pin { width: 9px; height: 9px; border-radius: 50%; border: 1.4px solid #00c3ff; background: #061013; margin: 0.06in 0 0 0.065in; position: relative; z-index: 1; }
.timeline li.key .pin { background: #00c3ff; box-shadow: 0 0 10px rgba(0,195,255,0.7); }
.timeline li.key .t { color: #00c3ff; }
.timeline .when { font-size: 11.6pt; color: var(--muted); }
.timeline p { font-size: 11pt; margin: 0.01in 0 0; color: var(--body); }

.audit-grid { margin: 0.2in 0 0.1in; border: 1px dashed rgba(0,195,255,0.45); border-radius: 8px; padding: 0.1in 0.18in 0.14in; }
.audit-head, .audit-row { display: grid; grid-template-columns: 0.7in 1fr 1fr 1fr 1fr; gap: 0.14in; align-items: end; }
.audit-head span { font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); padding-bottom: 0.04in; }
.audit-row { height: 0.42in; }
.audit-row i { border-bottom: 1px solid var(--rule); height: 100%; }
.audit-row .hud { color: #00c3ff; padding-bottom: 0.03in; }
.motto { margin-top: auto; text-align: center; font-family: 'Cinzel', serif; letter-spacing: 0.16em; font-size: 11pt; color: var(--ink); }
.motto span { font-family: 'EB Garamond', serif; letter-spacing: 0; font-style: italic; color: var(--muted); font-size: 12pt; }

/* Paper checklist */
.paper-pad { right: 0.8in; top: 0.6in; bottom: 0.55in; }
.cut-note { font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); border-bottom: 1px dashed var(--rule); padding-bottom: 0.1in; margin-bottom: 0.16in; }
.paper-head { display: grid; grid-template-columns: 1fr 2.2in; gap: 0.3in; align-items: end; }
.paper-head p { font-size: 12pt; margin: 0; }
.week { width: 100%; border-collapse: collapse; margin: 0.22in 0 0.22in; }
.week th { font-family: 'Space Grotesk', sans-serif; font-size: 8pt; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); font-weight: 600; padding: 0 0 0.08in; border-bottom: 1.5px solid var(--ink); }
.week td { border-bottom: 1px solid var(--rule); padding: 0.17in 0; text-align: center; }
.week td:first-child { text-align: left; width: 2.5in; padding-right: 0.1in; }
.week td:first-child strong { display: block; font-size: 12.4pt; }
.week td:first-child span { display: block; font-size: 10pt; color: var(--muted); font-style: italic; }
.week .box { width: 0.24in; height: 0.24in; border-color: var(--ink); border-width: 1.2px; }
.paper-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 0.24in; }
.paper-box { border: 1.2px solid var(--ink); border-radius: 8px; padding: 0.14in 0.18in; }
.paper-box .kicker { color: var(--ink); }
.done-row { display: flex; gap: 0.1in; align-items: center; margin-top: 0.14in; font-size: 11pt; }
.done-row .box { border-color: var(--ink); }
.mini-readings { display: grid; gap: 0.06in; margin-top: 0.06in; }
.mini-readings div { display: grid; grid-template-columns: 0.6in 1fr 0.35in; align-items: end; gap: 0.08in; font-size: 11pt; height: 0.32in; }
.mini-readings i { border-bottom: 1px solid var(--rule); height: 100%; }
.mini-readings em { font-style: normal; font-family: 'Space Grotesk', sans-serif; font-size: 8pt; color: var(--muted); }
.paper-foot { margin-top: auto; display: flex; align-items: center; gap: 0.12in; font-family: 'Space Grotesk', sans-serif; font-size: 7.4pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
.paper-emblem svg { width: 0.26in; height: 0.26in; }

/* Map */
.map-grid { display: grid; grid-template-columns: 1.5in 1fr; gap: 0.3in; margin: 0.12in 0 0.16in; flex: 1; min-height: 0; }
.profile { width: 100%; height: 100%; }
.profile-wrap { align-self: stretch; }
.band { stroke: none; }
.band-0 { fill: rgba(0,195,255,0.1); } .band-1 { fill: rgba(0,195,255,0.07); } .band-2 { fill: rgba(0,195,255,0.045); } .band-3 { fill: rgba(0,195,255,0.025); }
.band-label { font-family: 'Space Grotesk', sans-serif; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; fill: #8fa0a0; }
.ppath { fill: none; stroke: #00c3ff; stroke-width: 2; stroke-dasharray: 1 0; }
.pnode { fill: #061013; stroke: #00c3ff; stroke-width: 2; }
.pnode.last { fill: #00c3ff; }
.pcode { font-family: 'Space Grotesk', sans-serif; font-size: 14px; fill: #c3cdcd; }
.stage-list { display: flex; flex-direction: column; justify-content: space-around; gap: 0.14in; }
.stage { border-left: 2px solid rgba(0,195,255,0.5); padding-left: 0.16in; }
.stage h3 { font-family: 'EB Garamond', serif; font-weight: 500; font-size: 18pt; color: var(--ink); line-height: 1.1; margin: 0.02in 0 0.03in; }
.stage p { font-size: 11.4pt; margin-bottom: 0.05in; }
.clearances { display: flex; flex-wrap: wrap; gap: 0.05in; }
.clearances span { font-family: 'Space Grotesk', sans-serif; font-size: 7.2pt; letter-spacing: 0.05em; color: var(--muted); border: 1px solid var(--rule); border-radius: 2px; padding: 0.015in 0.06in; }
.s-3 { border-left-color: #00c3ff; }

/* Invitation */
.phones { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.16in; margin: 0.06in 0 0.16in; }
.phone { height: 1.6in; border-radius: 14px; overflow: hidden; border: 1.5px solid rgba(150,170,170,0.45); background: #0a1112; margin-bottom: 0.08in; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.phone img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; }
.phone-card strong { display: block; font-size: 11.6pt; line-height: 1.2; }
.phone-card p { font-size: 9.8pt; line-height: 1.3; color: var(--muted); margin: 0.03in 0 0; }
.join { margin-top: auto; display: grid; grid-template-columns: 1fr 1.45in; gap: 0.3in; align-items: center; padding: 0.22in 0.26in; border-radius: 12px; border: 1px solid rgba(0,195,255,0.5); background: linear-gradient(135deg, rgba(0,195,255,0.14), rgba(0,195,255,0.03)); }
.join-title { font-family: 'EB Garamond', serif; font-size: 24pt; color: var(--ink); line-height: 1.1; margin: 0.05in 0 0.06in; }
.join-title a { color: #00c3ff; }
.join p { margin: 0 0 0.08in; color: var(--ink); }
.covenant { font-style: italic; font-size: 11pt; color: var(--muted); }
.qr { display: flex; flex-direction: column; align-items: center; gap: 0.06in; }
.qr svg { width: 1.3in; height: 1.3in; background: #e9fbff; border-radius: 6px; padding: 0.07in; }
.qr span { font-family: 'Space Grotesk', sans-serif; font-size: 7pt; letter-spacing: 0.2em; text-transform: uppercase; color: #8fa0a0; }

/* Back cover */
.back { background: #030708; color: #e4e9e9; }
.back-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 45%; opacity: 0.32; }
.back-shade { position: absolute; inset: 0; background: radial-gradient(60% 45% at 50% 48%, rgba(3,7,8,0.2), #030708 85%); }
.back-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.back-lockup svg { width: 3in; height: auto; }
.mantra { font-family: 'Cinzel', serif; font-size: 30pt; line-height: 1.25; letter-spacing: 0.04em; color: #e9fbff; margin: 0.5in 0 0.12in; }
.mantra-sub { font-family: 'Space Grotesk', sans-serif; font-size: 9pt; letter-spacing: 0.4em; text-transform: uppercase; color: #00c3ff; }
.back-foot { position: absolute; bottom: 0.6in; left: 0; right: 0; display: flex; flex-direction: column; gap: 0.06in; align-items: center; font-family: 'Space Grotesk', sans-serif; font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: #8fa0a0; }
.back-foot a { color: #e4e9e9; font-size: 10pt; letter-spacing: 0.24em; }
`
