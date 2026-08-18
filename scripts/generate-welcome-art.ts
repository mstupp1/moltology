import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage } from '@napi-rs/canvas'

async function generateSereneSanctuary() {
  const width = 1600
  const height = 600
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 1. Deep Benthic Abyss Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#020b0e')
  bgGrad.addColorStop(0.3, '#04181c')
  bgGrad.addColorStop(0.6, '#031417')
  bgGrad.addColorStop(1, '#010608')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Serene Ethereal Caustic Light Rays from top-right
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  
  for (let i = 0; i < 12; i++) {
    const rayGrad = ctx.createLinearGradient(width * 0.5 + i * 80, 0, width * 0.2 + i * 70, height)
    const alpha = 0.04 + Math.sin(i * 0.8) * 0.03
    rayGrad.addColorStop(0, `rgba(0, 255, 230, ${alpha * 1.5})`)
    rayGrad.addColorStop(0.4, `rgba(0, 180, 216, ${alpha})`)
    rayGrad.addColorStop(1, 'rgba(0, 50, 80, 0)')

    ctx.fillStyle = rayGrad
    ctx.beginPath()
    ctx.moveTo(width * 0.5 + i * 80 - 40, 0)
    ctx.lineTo(width * 0.5 + i * 80 + 70, 0)
    ctx.lineTo(width * 0.2 + i * 70 + 180, height)
    ctx.lineTo(width * 0.2 + i * 70 - 90, height)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // 3. Bioluminescent Sanctuary Flora & Crystalline Poly Structures on right side
  ctx.save()
  const floraCenter = { x: width * 0.82, y: height * 0.65 }
  
  // Radial sanctuary glow
  const sanctGlow = ctx.createRadialGradient(
    floraCenter.x,
    floraCenter.y,
    20,
    floraCenter.x,
    floraCenter.y,
    380
  )
  sanctGlow.addColorStop(0, 'rgba(0, 255, 200, 0.25)')
  sanctGlow.addColorStop(0.4, 'rgba(0, 180, 220, 0.12)')
  sanctGlow.addColorStop(0.8, 'rgba(0, 80, 120, 0.04)')
  sanctGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = sanctGlow
  ctx.fillRect(0, 0, width, height)

  // Floating bioluminescent orbs and spores
  for (let i = 0; i < 75; i++) {
    const px = width * 0.4 + Math.random() * (width * 0.58)
    const py = 50 + Math.random() * (height - 100)
    const radius = 1 + Math.random() * 4.5
    const pAlpha = 0.2 + Math.random() * 0.6
    const isCyan = Math.random() > 0.3

    const pGrad = ctx.createRadialGradient(px, py, 0, px, py, radius * 3)
    pGrad.addColorStop(0, isCyan ? `rgba(0, 255, 220, ${pAlpha})` : `rgba(120, 255, 240, ${pAlpha})`)
    pGrad.addColorStop(0.5, isCyan ? `rgba(0, 190, 210, ${pAlpha * 0.4})` : `rgba(60, 200, 220, ${pAlpha * 0.3})`)
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = pGrad
    ctx.beginPath()
    ctx.arc(px, py, radius * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Crystalline geometric lattice / sanctuary nodes
  ctx.strokeStyle = 'rgba(0, 255, 220, 0.15)'
  ctx.lineWidth = 1.5
  const nodes = [
    { x: width * 0.78, y: height * 0.45 },
    { x: width * 0.85, y: height * 0.32 },
    { x: width * 0.92, y: height * 0.5 },
    { x: width * 0.88, y: height * 0.72 },
    { x: width * 0.75, y: height * 0.68 },
    { x: width * 0.82, y: height * 0.52 },
  ]
  ctx.beginPath()
  nodes.forEach((n, idx) => {
    if (idx === 0) ctx.moveTo(n.x, n.y)
    else ctx.lineTo(n.x, n.y)
  })
  ctx.closePath()
  ctx.stroke()

  nodes.forEach((n) => {
    ctx.fillStyle = 'rgba(0, 255, 230, 0.8)'
    ctx.beginPath()
    ctx.arc(n.x, n.y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
    ctx.beginPath()
    ctx.arc(n.x, n.y, 10, 0, Math.PI * 2)
    ctx.stroke()
  })
  ctx.restore()

  // 4. Load Peaceful Floating Lobster if available and composite
  const charPath = path.resolve(process.cwd(), 'public', 'images', 'characters', 'char_lobster_floating_peaceful.png')
  if (fs.existsSync(charPath)) {
    try {
      const charImg = await loadImage(charPath)
      const aspect = charImg.width / charImg.height
      const charHeight = 340
      const charWidth = charHeight * aspect
      const charX = width * 0.80 - charWidth / 2
      const charY = height * 0.5 - charHeight / 2

      // Soft serene backglow for the character
      const charGlow = ctx.createRadialGradient(charX + charWidth * 0.5, charY + charHeight * 0.5, 40, charX + charWidth * 0.5, charY + charHeight * 0.5, 260)
      charGlow.addColorStop(0, 'rgba(0, 255, 230, 0.3)')
      charGlow.addColorStop(0.6, 'rgba(0, 160, 200, 0.1)')
      charGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = charGlow
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.globalAlpha = 0.92
      ctx.drawImage(charImg, charX, charY, charWidth, charHeight)
      ctx.restore()
    } catch (err) {
      console.warn('Could not load peaceful lobster image:', err)
    }
  }

  // 5. Left Vignette Feathering (ensures text area on left is dark, serene, ultra-clean)
  ctx.save()
  const leftFade = ctx.createLinearGradient(0, 0, width * 0.55, 0)
  leftFade.addColorStop(0, 'rgba(7, 11, 11, 0.95)')
  leftFade.addColorStop(0.5, 'rgba(7, 11, 11, 0.75)')
  leftFade.addColorStop(0.85, 'rgba(7, 11, 11, 0.2)')
  leftFade.addColorStop(1, 'rgba(7, 11, 11, 0)')
  ctx.fillStyle = leftFade
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  // Save to public/images/welcome_sanctuary_bg.png
  const outPath = path.resolve(process.cwd(), 'public', 'images', 'welcome_sanctuary_bg.png')
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(outPath, buffer)
  console.log(`✓ Generated Serene Sanctuary image at: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

generateSereneSanctuary().catch(console.error)
