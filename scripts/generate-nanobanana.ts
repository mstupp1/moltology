import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'

async function generateWithNanoBanana() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('No API key')

  const candidateModels = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-lite-image',
    'gemini-3-pro-image-preview',
    'gemini-3-pro-image',
  ]

  for (const model of candidateModels) {
    try {
      console.log(`\nGenerating with ${model} (Nano Banana)...`)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'A photorealistic, cinematic dark abyssal ocean depth with soft, natural deep-sea lighting. Deepest oceanic trench with ultra-dark obsidian blue water, natural moody atmosphere, gentle deep-sea caustics on the ocean floor in the far distance, pure dark background on the left fading into atmospheric deep-sea horizon on the right. No glowing artificial neon tubes or bright ribbons. Clean, moody, peaceful, minimalist dark widescreen 16:9 wallpaper.'
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          }
        })
      })

      console.log(`Status: ${res.status}`)
      if (!res.ok) {
        const err = await res.text()
        console.log(`Error: ${err.slice(0, 300)}`)
        continue
      }

      const data = await res.json() as any
      const parts = data.candidates?.[0]?.content?.parts || []
      console.log(`Parts count: ${parts.length}`)

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png'
          const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png'
          const buffer = Buffer.from(part.inlineData.data, 'base64')
          const outPath = path.resolve(process.cwd(), 'public', 'images', `welcome_sanctuary_nanobanana.${ext}`)
          fs.writeFileSync(outPath, buffer)
          console.log(`🎉 SUCCESS! Saved to ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`)
          return outPath
        }
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`)
    }
  }
}

generateWithNanoBanana()
