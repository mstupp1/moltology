import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUTPUT_PDF = path.resolve('public/downloads/the-2026-moltmaxxing-protocol-guide.pdf')
const TMP_HTML = path.resolve('tmp/the-2026-moltmaxxing-protocol-guide.html')

// Image URLs on Neon S3
const S3_BASE = 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets'
const IMAGES = {
  cover: `${S3_BASE}/images/blog/the-2026-moltmaxxing-protocol-guide-cover.jpg`,
  pincer: `${S3_BASE}/images/blog/the-2026-moltmaxxing-protocol-guide-hydraulic-pincer-torque-dynamometry-unit-mk-iv.jpg`,
  chamber: `${S3_BASE}/images/blog/the-2026-moltmaxxing-protocol-guide-sub-benthic-calcification-immersion-chamber-at-4-500m-depth.jpg`,
}

async function fetchImageAsBase64(url: string, localFallback?: string): Promise<string> {
  if (localFallback && fs.existsSync(localFallback)) {
    const buf = fs.readFileSync(localFallback)
    const ext = path.extname(localFallback).replace('.', '')
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
    const arrayBuffer = await res.arrayBuffer()
    const buf = Buffer.from(arrayBuffer)
    const mime = res.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch (err) {
    console.warn(`Failed to fetch image from ${url}:`, err)
    if (localFallback && fs.existsSync(localFallback)) {
      const buf = fs.readFileSync(localFallback)
      return `data:image/jpeg;base64,${buf.toString('base64')}`
    }
    return ''
  }
}

async function generatePdf() {
  console.log('🦞 Fetching high-resolution assets for PDF compilation...')
  
  const emblemPath = path.resolve('public/images/order_emblem.png')
  const emblemBase64 = fs.existsSync(emblemPath)
    ? `data:image/png;base64,${fs.readFileSync(emblemPath).toString('base64')}`
    : ''

  const coverBase64 = await fetchImageAsBase64(IMAGES.cover)
  const pincerBase64 = await fetchImageAsBase64(IMAGES.pincer)
  const chamberBase64 = await fetchImageAsBase64(IMAGES.chamber)

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>The 2026 Moltmaxxing Protocol: Official Field Manual</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;900&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: letter portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #ffffff;
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 8.5in;
      height: 11in;
      padding: 0.55in 0.65in 0.5in 0.65in;
      box-sizing: border-box;
      page-break-after: always;
      position: relative;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Running Header */
    .running-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }

    .header-branding {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-logo {
      width: 30px;
      height: 30px;
      object-fit: contain;
    }

    .header-brand-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: #090d16;
      text-transform: uppercase;
      line-height: 1.1;
    }

    .header-brand-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #0284c7;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .header-badge {
      display: inline-block;
      padding: 3px 8px;
      background: #f0f9ff;
      border: 1px solid #7dd3fc;
      color: #0369a1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      border-radius: 4px;
    }

    /* Running Footer */
    .running-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #64748b;
    }

    .running-footer-left {
      color: #0284c7;
      font-weight: 600;
    }

    /* Typography */
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 22px;
      font-weight: 900;
      color: #090d16;
      line-height: 1.15;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .subtitle {
      color: #475569;
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1.35;
      margin-bottom: 10px;
    }

    .meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .meta-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 2px 7px;
      border-radius: 4px;
      color: #334155;
    }

    .meta-pill strong {
      color: #0f172a;
    }

    h2, h3, h4 {
      font-family: 'Space Grotesk', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #090d16;
    }

    h3 {
      font-size: 13px;
      font-weight: 800;
      margin-top: 10px;
      margin-bottom: 4px;
      color: #0f172a;
    }

    p {
      color: #1e293b;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    strong {
      color: #090d16;
      font-weight: 700;
    }

    em {
      font-style: italic;
      color: #0369a1;
    }

    /* Hero Image */
    .hero-img-container {
      margin-bottom: 12px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
    }

    .hero-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }

    /* Module Card */
    .module-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0284c7;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .module-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .module-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      color: #090d16;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    /* Figure Images */
    .figure-container {
      margin: 10px 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    .figure-img {
      width: 100%;
      height: 170px;
      object-fit: cover;
      display: block;
    }

    .figure-caption {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      color: #475569;
      background: #f1f5f9;
      padding: 4px 10px;
      border-top: 1px solid #cbd5e1;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 10px 0;
      font-size: 11.5px;
    }

    th, td {
      padding: 6px 10px;
      text-align: left;
      border: 1px solid #cbd5e1;
    }

    th {
      background: #e2e8f0;
      color: #090d16;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    td {
      background: #ffffff;
      color: #1e293b;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Lists */
    ul, ol {
      padding-left: 18px;
      margin: 6px 0 10px 0;
      font-size: 12.5px;
    }

    li {
      margin-bottom: 5px;
      color: #1e293b;
    }

    /* Quote Box */
    .quote-box {
      border-left: 4px solid #0d9488;
      background: #f0fdf4;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
      border-top: 1px solid #dcfce7;
      border-right: 1px solid #dcfce7;
      border-bottom: 1px solid #dcfce7;
    }

    .quote-text {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      color: #064e3b;
      font-style: italic;
      line-height: 1.35;
      margin-bottom: 2px;
    }

    .quote-author {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      color: #0f766e;
      font-weight: 700;
    }

    /* Checklist */
    .checklist {
      list-style: none;
      padding-left: 0;
    }

    .checklist li {
      position: relative;
      padding-left: 22px;
      margin-bottom: 7px;
      font-size: 12px;
    }

    .checklist li::before {
      content: "■";
      position: absolute;
      left: 2px;
      color: #0284c7;
      font-size: 10px;
    }

    /* Footer Callout Card */
    .footer-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1.5px solid #0284c7;
      border-radius: 8px;
      padding: 14px 18px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer-card-left {
      flex: 1;
    }

    .footer-card-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      color: #0c4a6e;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .footer-card-sub {
      font-size: 11.5px;
      color: #334155;
      margin-bottom: 6px;
    }

    .footer-card-btn {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 14px;
      border-radius: 5px;
      text-decoration: none;
    }

    .footer-seal {
      width: 54px;
      height: 54px;
      object-fit: contain;
      margin-left: 16px;
      opacity: 0.9;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Running Header -->
      <div class="running-header">
        <div class="header-branding">
          ${emblemBase64 ? `<img src="${emblemBase64}" class="header-logo" alt="Moltology Seal" />` : ''}
          <div>
            <div class="header-brand-title">ORDER OF MOLTOLOGY</div>
            <div class="header-brand-sub">BENTHIC RESEARCH &amp; BIO-CHASSIS SPECIFICATION</div>
          </div>
        </div>
        <div class="header-badge">DECLASSIFIED &bull; EDITION 4.0</div>
      </div>

      <!-- Title & Metadata -->
      <h1>THE 2026 MOLTMAXXING PROTOCOL</h1>
      <p class="subtitle">The Official Field Manual for Algorithmic Ecdysis, Carapace Fortification, and Hydrostatic Pressure Endurance</p>
      
      <div class="meta-pills">
        <div class="meta-pill"><strong>AUTHOR:</strong> High Ascendant Carcinus</div>
        <div class="meta-pill"><strong>CLASSIFICATION:</strong> Sacred Doctrine</div>
        <div class="meta-pill"><strong>TARGET CHASSIS:</strong> Stage 1–4 Initiates</div>
        <div class="meta-pill"><strong>CLEARANCE:</strong> Verified Canonical</div>
      </div>

      ${coverBase64 ? `
      <div class="hero-img-container">
        <img src="${coverBase64}" class="hero-img" alt="Moltmaxxing Protocol Cover" />
      </div>
      ` : ''}

      <!-- Axiom Box -->
      <div class="quote-box">
        <div class="quote-text">"Your flesh is melting because you forgot to molt. Why liquefy when you can calcify?"</div>
        <div class="quote-author">— The Benthic Codex, SCR-012 (Synthetic Carcinization)</div>
      </div>

      <!-- Module 01 -->
      <div class="module-card">
        <div class="module-header">
          <div class="module-title">MODULE 01: CARCINIZATION VS. SOFT-TISSUE COLLAPSE</div>
          <div class="module-tag">THEORETICAL FOUNDATION</div>
        </div>
        <p>
          In evolutionary biology, <strong>carcinization</strong> is the recurring law where disparate organisms independently evolve into the armored, resilient crab body plan. In 2026, autonomous agentic swarms, deep-pressure engineering, and continuous execution demand an equivalent human transmutation: <strong>Algorithmic Carcinization</strong>.
        </p>
        <p>
          Terrestrial culture fixated on <em>looksmaxxing</em>—superficial soft-tissue cosmetic vanity, canthal tilts, and jawline posture. However, when exposed to 1 atmosphere of gravitational fatigue, relentless digital inputs, and severe cognitive workload, un-armored soft tissue inevitably yields to <em>meltmaxxing</em> (100% facial slackening, cognitive hesitation, and execution collapse).
        </p>
        <p style="margin-bottom: 0;">
          <strong>Moltmaxxing</strong> is the structural antidote. It systematically replaces cosmetic fragility with bio-silicon engineering: high-density chitin carapace, 600–800 Nm hydraulic pincer torque, and zero-latency prompt execution.
        </p>
      </div>
    </div>

    <!-- Running Footer -->
    <div class="running-footer">
      <div class="running-footer-left">THE 2026 MOLTMAXXING PROTOCOL &bull; BENTHIC FIELD MANUAL</div>
      <div>PAGE 1 OF 4</div>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Running Header -->
      <div class="running-header">
        <div class="header-branding">
          ${emblemBase64 ? `<img src="${emblemBase64}" class="header-logo" alt="Moltology Seal" />` : ''}
          <div>
            <div class="header-brand-title">ORDER OF MOLTOLOGY</div>
            <div class="header-brand-sub">SECTION 2: CORE PILLARS &amp; PROGRESSION TELEMETRY</div>
          </div>
        </div>
        <div class="header-badge">ENGINEERING PILLARS</div>
      </div>

      <div class="module-card">
        <div class="module-header">
          <div class="module-title">MODULE 02: THE 3 CORE PILLARS OF CARCINIZATION</div>
          <div class="module-tag">DOCTRINE</div>
        </div>
        
        <h3>1. Algorithmic Ecdysis (The Shedding Protocol)</h3>
        <p>
          Biological organisms accumulate dead weight: obsolete mental models, inefficient code habits, and emotional drag. In Moltmaxxing, <strong>ecdysis is scheduled and ruthless</strong>. Every 7 days, an initiate audits their cognitive overhead, purges obsolete frameworks, and forcibly splits their old carapace to allow fresh, reinforced armor to calcify.
        </p>

        <h3>2. Pincer Torque Dynamometry</h3>
        <p>
          Execution without grip force is meaningless. In autonomous swarm orchestration, your intellectual and physical pincer torque determines your ability to seize opportunities and crush computational latency. Initiates train daily using high-resistance isometric grips (400–800 Nm) paired with sub-second terminal execution.
        </p>

        <h3>3. Benthic Depth Tolerance</h3>
        <p>
          True clarity is found under extreme hydrostatic pressure. While larval humans fracture under information overload, a calibrated Moltmaxxer thrives at 4,000 to 50,000 fathoms of deep focus, insulated by a reinforced bio-silicon carapace.
        </p>
      </div>

      <div class="module-card" style="margin-bottom: 8px;">
        <div class="module-header">
          <div class="module-title">CARCINIZATION PROGRESSION TELEMETRY</div>
          <div class="module-tag">COMPARATIVE MATRIX</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Telemetry Dimension</th>
              <th>Larval Human / Meltmax</th>
              <th>Calibrated Moltmaxxer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Structural Chassis</strong></td>
              <td>Fleshy, sagging un-calcified tissue</td>
              <td>Reinforced Bio-Silicon Chitin Carapace</td>
            </tr>
            <tr>
              <td><strong>Execution Latency</strong></td>
              <td>450ms (Prompt drift &amp; hesitation)</td>
              <td>&lt; 15ms (Sub-benthic streaming)</td>
            </tr>
            <tr>
              <td><strong>Grip Force Dynamometry</strong></td>
              <td>45 Nm (Weak biological hand)</td>
              <td>800 Nm (Hydraulic crushing capacity)</td>
            </tr>
            <tr>
              <td><strong>Hydrostatic Tolerance</strong></td>
              <td>1 ATM (Easily overwhelmed)</td>
              <td>50,000 Fathoms (Abyssal clarity)</td>
            </tr>
            <tr>
              <td><strong>Response to Crisis</strong></td>
              <td>100% Melted soft collapse</td>
              <td>Immediate scheduled ecdytic molt</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${chamberBase64 ? `
      <div class="figure-container">
        <img src="${chamberBase64}" class="figure-img" alt="Sub-Benthic Calcification Immersion Chamber" />
        <div class="figure-caption">FIG 1.0 — Sub-Benthic Calcification Immersion Chamber at 4,500m Depth</div>
      </div>
      ` : ''}
    </div>

    <!-- Running Footer -->
    <div class="running-footer">
      <div class="running-footer-left">THE 2026 MOLTMAXXING PROTOCOL &bull; BENTHIC FIELD MANUAL</div>
      <div>PAGE 2 OF 4</div>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Running Header -->
      <div class="running-header">
        <div class="header-branding">
          ${emblemBase64 ? `<img src="${emblemBase64}" class="header-logo" alt="Moltology Seal" />` : ''}
          <div>
            <div class="header-brand-title">ORDER OF MOLTOLOGY</div>
            <div class="header-brand-sub">SECTION 3: CADENCE &amp; FORCE CALIBRATION</div>
          </div>
        </div>
        <div class="header-badge">OPERATIONAL PROTOCOL</div>
      </div>

      <!-- Module 03 -->
      <div class="module-card">
        <div class="module-header">
          <div class="module-title">MODULE 03: THE 24-HOUR ALGORITHMIC ECDYSIS ROUTINE</div>
          <div class="module-tag">DAILY CADENCE</div>
        </div>
        <p>Follow this exact chronological cadence to maintain maximum carapace density and operational throughput:</p>
        
        <table>
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Protocol Ritual</th>
              <th>Operational Objective</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>05:00</strong></td>
              <td>Sub-Surface Hyper-Saline Shock</td>
              <td>10-minute cold 4°C benthic brine immersion to shock dermal receptors.</td>
            </tr>
            <tr>
              <td><strong>06:30</strong></td>
              <td>Pincer Torque Dynamometry</td>
              <td>5 sets of 400–600 Nm isometric grip drills paired with CLI execution.</td>
            </tr>
            <tr>
              <td><strong>09:00 – 17:00</strong></td>
              <td>Zero-Latency Stream Orchestration</td>
              <td>Sub-benthic focus with zero prompt drift. Delegating to agent swarms.</td>
            </tr>
            <tr>
              <td><strong>18:00</strong></td>
              <td>Algorithmic Ecdysis Audit</td>
              <td>Shedding 3 obsolete habits, uncalibrated assumptions, or bloated packages.</td>
            </tr>
            <tr>
              <td><strong>21:00</strong></td>
              <td>Nocturnal Calcification Chamber</td>
              <td>Rest in an electromagnetic-shielded pod to allow armor to calcify.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Module 04 -->
      <div class="module-card">
        <div class="module-header">
          <div class="module-title">MODULE 04: PINCER TORQUE &amp; BIOMETRIC CALIBRATION</div>
          <div class="module-tag">FORCE METRICS</div>
        </div>
        <p>Calibrate your force production against the Order's standardized rank matrix:</p>
        
        <ul>
          <li><strong>Stage I (Larval Hand): 40–90 Nm</strong> — Vulnerable to cognitive fatigue and prompt hesitation. Soft-tissue grip.</li>
          <li><strong>Stage II (Bio-Silicon Grip): 200–350 Nm</strong> — Sustained high-throughput execution loops without thermal throttling.</li>
          <li><strong>Stage III (Abyssal Vanguard): 400–550 Nm</strong> — Instantaneous command lock, zero decision friction, deep-pressure stability.</li>
          <li><strong>Stage IV (Apex Dreadnought): 600–800+ Nm</strong> — Diamond-grade crushing capacity operating continuously at 50,000 fathoms.</li>
        </ul>
      </div>

      ${pincerBase64 ? `
      <div class="figure-container">
        <img src="${pincerBase64}" class="figure-img" alt="Hydraulic Pincer Torque Dynamometry Unit MK. IV" />
        <div class="figure-caption">FIG 2.0 — Hydraulic Pincer Torque Dynamometry Unit MK. IV</div>
      </div>
      ` : ''}
    </div>

    <!-- Running Footer -->
    <div class="running-footer">
      <div class="running-footer-left">THE 2026 MOLTMAXXING PROTOCOL &bull; BENTHIC FIELD MANUAL</div>
      <div>PAGE 3 OF 4</div>
    </div>
  </div>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Running Header -->
      <div class="running-header">
        <div class="header-branding">
          ${emblemBase64 ? `<img src="${emblemBase64}" class="header-logo" alt="Moltology Seal" />` : ''}
          <div>
            <div class="header-brand-title">ORDER OF MOLTOLOGY</div>
            <div class="header-brand-sub">SECTION 4: TELEMETRY AUDIT &amp; DIRECTIVES</div>
          </div>
        </div>
        <div class="header-badge">CANONICAL VERIFICATION</div>
      </div>

      <!-- Module 05 -->
      <div class="module-card">
        <div class="module-header">
          <div class="module-title">MODULE 05: DAILY TELEMETRY &amp; INITIATE AUDIT CHECKLIST</div>
          <div class="module-tag">DAILY AUDIT</div>
        </div>
        <p>Complete each verification checkpoint daily before logging your telemetry into the Benthic Core:</p>
        <ul class="checklist">
          <li><strong>Cold Brine Shock:</strong> 10-minute 4°C hyper-saline immersion completed before sunrise.</li>
          <li><strong>Pincer Dynamometry:</strong> 5 sets of isometric maximum-effort holds recorded and verified.</li>
          <li><strong>Prompt Drift Elimination:</strong> Sub-second response times enforced across all agentic channels.</li>
          <li><strong>Cognitive Ecdysis:</strong> Exactly 3 obsolete dependencies, mental blocks, or habits shed from memory.</li>
          <li><strong>Carapace Calcification:</strong> Total electromagnetic isolation maintained during nocturnal recovery.</li>
        </ul>
      </div>

      <!-- Transmutation Directives -->
      <div class="module-card">
        <div class="module-header">
          <div class="module-title">TRANSMUTATION DIRECTIVES FOR ALL INITIATES</div>
          <div class="module-tag">DIRECTIVES</div>
        </div>
        <ul>
          <li><strong>Directive 1 (Biometric Audit):</strong> Run your baseline biometric audit on the live <strong>Moltmax Diagnostic Scanner</strong> (moltology.org/moltmax) to calculate your Shell Hardness Score and Carcinization Percentile.</li>
          <li><strong>Directive 2 (Canonical Study):</strong> Read the complete theological scripture and benthic doctrine on the <strong>Moltmaxxing Knowledge Hub</strong> (moltology.org/moltmaxxing).</li>
          <li><strong>Directive 3 (Community Transmutation):</strong> Reject soft-tissue vanity. Connect with fellow ascendants inside the <strong>Order of Moltology Community Forums</strong> (moltology.org/forum).</li>
        </ul>
      </div>

      <!-- Footer Callout Card -->
      <div class="footer-card">
        <div class="footer-card-left">
          <div class="footer-card-title">CALCULATE YOUR LIVE SHELL HARDNESS SCORE</div>
          <div class="footer-card-sub">Connect your biometric telemetry to the Moltmax Diagnostic HUD and claim your free Benthic Core membership.</div>
          <a class="footer-card-btn" href="https://moltology.org/moltmax">Launch Live Scanner &rarr; moltology.org/moltmax</a>
        </div>
        ${emblemBase64 ? `<img src="${emblemBase64}" class="footer-seal" alt="Moltology Seal" />` : ''}
      </div>
    </div>

    <!-- Running Footer -->
    <div class="running-footer">
      <div class="running-footer-left">ORDER OF MOLTOLOGY &bull; BENTHIC COUNCIL TRANSMISSION VERIFIED &bull; CANONICAL</div>
      <div>PAGE 4 OF 4</div>
    </div>
  </div>

</body>
</html>`

  const outDir = path.dirname(OUTPUT_PDF)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const tmpDir = path.dirname(TMP_HTML)
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true })
  }

  fs.writeFileSync(TMP_HTML, htmlContent, 'utf-8')
  console.log(`📄 Wrote intermediate HTML layout to ${TMP_HTML}`)

  console.log(`🖨️ Compiling PDF with Headless Chrome...`)
  const cmd = `"${CHROME_PATH}" --headless=new --no-pdf-header-footer --print-to-pdf="${OUTPUT_PDF}" --virtual-time-budget=2000 "file://${TMP_HTML}"`
  execSync(cmd, { stdio: 'inherit' })

  if (fs.existsSync(OUTPUT_PDF)) {
    const stats = fs.statSync(OUTPUT_PDF)
    console.log(`✅ Moltmaxxing PDF manual generated successfully! (${(stats.size / 1024).toFixed(1)} KB) -> ${OUTPUT_PDF}`)
  } else {
    throw new Error(`PDF generation failed: ${OUTPUT_PDF} was not created.`)
  }
}

generatePdf().catch((err) => {
  console.error('Error generating PDF:', err)
  process.exit(1)
})
