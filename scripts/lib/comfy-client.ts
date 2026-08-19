import fs from 'node:fs'
import path from 'node:path'
import { WebSocket } from 'ws'

export const DEFAULT_COMFY_URL = process.env.COMFY_API_URL || 'http://127.0.0.1:8188'

export interface ComfyGenerateOptions {
  prompt: string
  aspectRatio?: '4:5' | '1:1' | '9:16' | '16:9' | '3:2'
  width?: number
  height?: number
  seed?: number
  workflowType?: 'text2img' | 'composite_harmonize'
  compositeInputPath?: string
  denoise?: number
  outputPath?: string
  baseUrl?: string
  timeoutMs?: number
}

export interface ComfyExecutionResult {
  outputPath: string
  buffer: Buffer
  promptId: string
  durationMs: number
}

/**
 * Aspect ratio to standard pixel resolution mapping
 */
export function resolveDimensions(
  aspectRatio: '4:5' | '1:1' | '9:16' | '16:9' | '3:2' = '4:5',
  customWidth?: number,
  customHeight?: number
): { width: number; height: number } {
  if (customWidth && customHeight) {
    return { width: customWidth, height: customHeight }
  }

  switch (aspectRatio) {
    case '4:5': // Instagram Portrait
      return { width: 1080, height: 1350 }
    case '1:1': // Square
      return { width: 1080, height: 1080 }
    case '9:16': // Reel / Short
      return { width: 1080, height: 1920 }
    case '16:9': // Landscape
      return { width: 1920, height: 1080 }
    case '3:2':
      return { width: 1200, height: 800 }
    default:
      return { width: 1080, height: 1350 }
  }
}

/**
 * Check if the ComfyUI local server is online and reachable
 */
export async function isComfyRunning(baseUrl: string = DEFAULT_COMFY_URL): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${baseUrl}/system_stats`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

/**
 * Upload an image buffer or file to ComfyUI's input directory via /upload/image
 */
export async function uploadImageToComfy(
  imageSource: string | Buffer,
  filename: string,
  baseUrl: string = DEFAULT_COMFY_URL
): Promise<string> {
  const buffer = typeof imageSource === 'string' ? fs.readFileSync(imageSource) : imageSource
  const formData = new FormData()
  const blob = new Blob([buffer], { type: 'image/png' })
  formData.append('image', blob, filename)
  formData.append('overwrite', 'true')

  const res = await fetch(`${baseUrl}/upload/image`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Failed to upload image to ComfyUI: ${res.statusText}`)
  }

  const data = (await res.json()) as { name: string }
  return data.name
}

/**
 * Load and parameterize a ComfyUI workflow JSON
 */
export function buildWorkflowPayload(
  options: ComfyGenerateOptions,
  uploadedImageName?: string
): Record<string, any> {
  const workflowType = options.workflowType || 'text2img'
  const templatePath = path.resolve(
    process.cwd(),
    `workflows/comfy/flux_schnell_${workflowType}.json`
  )

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Workflow template not found: ${templatePath}`)
  }

  const workflow = JSON.parse(fs.readFileSync(templatePath, 'utf8'))
  const { width, height } = resolveDimensions(options.aspectRatio, options.width, options.height)
  const seed = options.seed ?? Math.floor(Math.random() * 1000000000)

  // Parameterize nodes
  for (const nodeId of Object.keys(workflow)) {
    const node = workflow[nodeId]

    // Update text prompt
    if (node.class_type === 'CLIPTextEncode' && node.inputs?.text !== undefined) {
      if (node._meta?.title?.includes('Positive') || node._meta?.title?.includes('Lore')) {
        node.inputs.text = options.prompt
      }
    }

    // Update latent dimensions
    if (node.class_type === 'EmptySD3LatentImage' || node.class_type === 'EmptyLatentImage') {
      node.inputs.width = width
      node.inputs.height = height
    }

    // Update sampler seed & denoise
    if (node.class_type === 'KSampler') {
      node.inputs.seed = seed
      if (options.denoise !== undefined) {
        node.inputs.denoise = options.denoise
      }
    }

    // Update input image if composite/harmonize
    if (node.class_type === 'LoadImage' && uploadedImageName) {
      node.inputs.image = uploadedImageName
    }
  }

  return workflow
}

/**
 * Submit prompt to ComfyUI, wait for completion, and return the generated image
 */
export async function generateWithComfy(
  options: ComfyGenerateOptions
): Promise<ComfyExecutionResult> {
  const baseUrl = options.baseUrl || DEFAULT_COMFY_URL
  const startTime = Date.now()

  // 1. Verify server status
  const running = await isComfyRunning(baseUrl)
  if (!running) {
    throw new Error(
      `ComfyUI is not reachable at ${baseUrl}. Start it with 'npm run comfy:start' or check your setup.`
    )
  }

  // 2. Upload composite input if specified
  let uploadedImageName: string | undefined
  if (options.compositeInputPath) {
    const filename = `input_composite_${Date.now()}.png`
    uploadedImageName = await uploadImageToComfy(options.compositeInputPath, filename, baseUrl)
  }

  // 3. Build parameterized workflow
  const promptPayload = buildWorkflowPayload(options, uploadedImageName)
  const clientId = `moltology_agent_${Date.now()}`

  // 4. Submit prompt to ComfyUI
  const queueRes = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: promptPayload,
      client_id: clientId,
    }),
  })

  if (!queueRes.ok) {
    const errText = await queueRes.text()
    throw new Error(`ComfyUI /prompt rejected with status ${queueRes.status}: ${errText}`)
  }

  const { prompt_id: promptId } = (await queueRes.json()) as { prompt_id: string }

  // 5. Connect WebSocket to track execution
  const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws?clientId=${clientId}`
  const ws = new WebSocket(wsUrl)

  const outputImageInfo = await new Promise<{ filename: string; subfolder: string; type: string }>(
    (resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        ws.close()
        reject(new Error(`ComfyUI generation timed out after ${options.timeoutMs || 120000}ms`))
      }, options.timeoutMs || 120000)

      ws.on('open', () => {
        // Connected
      })

      ws.on('message', (raw: Buffer) => {
        try {
          const message = JSON.parse(raw.toString())
          if (message.type === 'executing' && message.data?.node === null && message.data?.prompt_id === promptId) {
            // Execution completed! Query history to find saved image
            fetch(`${baseUrl}/history/${promptId}`)
              .then((res) => res.json())
              .then((history: any) => {
                clearTimeout(timeoutTimer)
                ws.close()
                const outputs = history[promptId]?.outputs
                if (!outputs) {
                  return reject(new Error(`No output images found for prompt ${promptId}`))
                }

                // Find first output node with images
                for (const nodeId of Object.keys(outputs)) {
                  const nodeOut = outputs[nodeId]
                  if (nodeOut.images && nodeOut.images.length > 0) {
                    return resolve(nodeOut.images[0])
                  }
                }
                reject(new Error(`Outputs found but no image files returned in prompt ${promptId}`))
              })
              .catch(reject)
          } else if (message.type === 'execution_error' && message.data?.prompt_id === promptId) {
            clearTimeout(timeoutTimer)
            ws.close()
            reject(new Error(`ComfyUI Execution Error: ${JSON.stringify(message.data)}`))
          }
        } catch {
          // Binary message or non-JSON telemetry, ignore
        }
      })

      ws.on('error', (err) => {
        clearTimeout(timeoutTimer)
        reject(err)
      })
    }
  )

  // 6. Download rendered image from ComfyUI /view
  const viewUrl = `${baseUrl}/view?filename=${encodeURIComponent(outputImageInfo.filename)}&subfolder=${encodeURIComponent(outputImageInfo.subfolder)}&type=${encodeURIComponent(outputImageInfo.type)}`
  const imgRes = await fetch(viewUrl)
  if (!imgRes.ok) {
    throw new Error(`Failed to retrieve generated image from ComfyUI: ${imgRes.statusText}`)
  }

  const arrayBuffer = await imgRes.arrayBuffer()
  const imageBuffer = Buffer.from(arrayBuffer)

  // 7. Save to destination
  const outputPath =
    options.outputPath ||
    path.resolve(process.cwd(), `tmp/comfy_out_${Date.now()}_${outputImageInfo.filename}`)
  const outDir = path.dirname(outputPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, imageBuffer)

  return {
    outputPath,
    buffer: imageBuffer,
    promptId,
    durationMs: Date.now() - startTime,
  }
}
