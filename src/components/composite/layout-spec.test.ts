import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { lintLayoutSpec, parseLayoutSpec, resolveColor, splitHighlights, textFitFloor } from './layout-spec'

const LAYOUT_DIR = path.resolve(__dirname, '../../../content/composite-layouts')

describe('layout specs', () => {
  it('accepts every starter layout in content/composite-layouts', () => {
    const files = fs.readdirSync(LAYOUT_DIR).filter((f) => f.endsWith('.json'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const result = parseLayoutSpec(JSON.parse(fs.readFileSync(path.join(LAYOUT_DIR, file), 'utf8')))
      expect(result.ok ? [] : result.errors, file).toEqual([])
    }
  })

  it('reports the path of an invalid layer', () => {
    const result = parseLayoutSpec({ layers: [{ type: 'text', text: 'Hi', box: { x: 0, y: 0, w: 10 } }] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.join('\n')).toContain('layers.0.size')
  })

  it('rejects unknown layer types and aspects', () => {
    expect(parseLayoutSpec({ layers: [{ type: 'video', box: { x: 0, y: 0, w: 1 } }] }).ok).toBe(false)
    expect(parseLayoutSpec({ aspect: '2:3', layers: [] }).ok).toBe(false)
  })

  it('resolves brand tokens and passes other colors through', () => {
    expect(resolveColor('cyan')).toBe('#00c3ff')
    expect(resolveColor('rgba(1,2,3,0.5)')).toBe('rgba(1,2,3,0.5)')
    expect(resolveColor(undefined, '#123456')).toBe('#123456')
  })

  it('splits highlighted phrases case-insensitively', () => {
    expect(splitHighlights('Close the tab. Close it now.', 'close it')).toEqual([
      { text: 'Close the tab. ', hit: false },
      { text: 'Close it', hit: true },
      { text: ' now.', hit: false },
    ])
    expect(splitHighlights('No terms here')).toEqual([{ text: 'No terms here', hit: false }])
    expect(splitHighlights('a+b equals c', ['a+b'])[0]).toEqual({ text: 'a+b', hit: true })
  })

  it('lints text in the crop margin, missing heights and tiny type', () => {
    const issues = lintLayoutSpec({
      safeArea: 5,
      layers: [
        { type: 'text', text: 'Edge', size: 18, box: { x: 1, y: 10, w: 50 } },
        { type: 'text', text: 'Fine', size: 60, box: { x: 10, y: 10, w: 50, h: 10 } },
      ],
    })
    const messages = issues.map((i) => `${i.layer}: ${i.message}`).join('\n')
    expect(messages).toContain('text#0: sits inside the 5% edge margin')
    expect(messages).toContain('text#0: has no box height')
    expect(messages).toContain('text#0: font size 18px')
    expect(messages).not.toContain('text#1')
  })

  it('warns when auto-fit, labels, lists or word count fall below phone readability', () => {
    const issues = lintLayoutSpec({
      layers: [
        { id: 'shrinks', type: 'text', text: 'Body', size: 44, box: { x: 10, y: 10, w: 50, h: 10 } },
        { id: 'held', type: 'text', text: 'Body', size: 44, minSize: 40, box: { x: 10, y: 30, w: 50, h: 10 } },
        { id: 'pill', type: 'pill', text: 'Tag', size: 24, box: { x: 10, y: 50, w: 20 } },
        { id: 'list', type: 'list', items: ['one', 'two'], size: 30, box: { x: 10, y: 60, w: 50, h: 20 } },
        { id: 'long', type: 'text', text: Array(45).fill('word').join(' '), size: 40, fit: false, box: { x: 10, y: 80, w: 80, h: 10 } },
      ],
    })
    const messages = issues.map((i) => `${i.layer ?? 'frame'}: ${i.message}`).join('\n')
    expect(messages).toContain('shrinks: can auto-fit down to 30px')
    expect(messages).not.toContain('held:')
    expect(messages).toContain('pill: label size 24px')
    expect(messages).toContain('list: list size 30px')
    expect(messages).toContain('frame: 49 words on one frame')
  })

  it('computes the auto-fit floor the renderer uses', () => {
    expect(textFitFloor({ size: 100, box: { h: 10 } })).toBe(60)
    expect(textFitFloor({ size: 100, minSize: 72, box: { h: 10 } })).toBe(72)
    expect(textFitFloor({ size: 100, box: {} })).toBe(100)
    expect(textFitFloor({ size: 40, fit: false, box: { h: 10 } })).toBe(40)
    expect(textFitFloor({ size: 20, box: { h: 10 } })).toBe(20)
  })
})
