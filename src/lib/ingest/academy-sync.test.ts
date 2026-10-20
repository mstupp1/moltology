import { describe, expect, it } from 'vitest'
import { loadAcademyContent } from './academy-sync'

describe('loadAcademyContent', () => {
  it('reads the worked example with no errors', () => {
    const tree = loadAcademyContent('content/academy/_examples')
    expect(tree.issues.filter((issue) => issue.severity === 'error')).toEqual([])
    expect(tree.courses.map((course) => course.slug)).toEqual(['example-first-shed'])
    expect(tree.courses[0].modules[0].lessons.map((lesson) => lesson.kind)).toEqual(['video', 'reading', 'quiz'])
    expect(tree.tracks.map((track) => track.slug)).toEqual(['example-first-shell'])
  })

  it('never ingests the examples folder from the main content root', () => {
    const tree = loadAcademyContent('content/academy')
    expect(tree.courses.map((course) => course.slug)).not.toContain('example-first-shed')
  })
})
