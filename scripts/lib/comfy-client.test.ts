import { describe, it, expect } from 'vitest'
import { resolveDimensions, buildWorkflowPayload } from './comfy-client'

describe('comfy-client', () => {
  it('correctly maps aspect ratios to pixel dimensions', () => {
    expect(resolveDimensions('4:5')).toEqual({ width: 1080, height: 1350 })
    expect(resolveDimensions('1:1')).toEqual({ width: 1080, height: 1080 })
    expect(resolveDimensions('9:16')).toEqual({ width: 1080, height: 1920 })
    expect(resolveDimensions('16:9')).toEqual({ width: 1920, height: 1080 })
  })

  it('correctly parameterizes a text2img workflow template', () => {
    const workflow = buildWorkflowPayload({
      prompt: 'Benthic Cybernetic Titan glowing in deep trench',
      aspectRatio: '4:5',
      seed: 12345,
      workflowType: 'text2img',
    })

    expect(workflow['4'].inputs.text).toBe('Benthic Cybernetic Titan glowing in deep trench')
    expect(workflow['6'].inputs.width).toBe(1080)
    expect(workflow['6'].inputs.height).toBe(1350)
    expect(workflow['7'].inputs.seed).toBe(12345)
  })
})
