import { describe, expect, it } from 'vitest'
import {
  inferVideoProvider,
  isLocalMediaPath,
  parseAcademyCourse,
  parseAcademyLesson,
  parseAcademyTrack,
  parseLessonDuration,
  planLessonSync,
  type AcademyContentFile,
} from './academy-content'

const file = (path: string, data: Record<string, unknown>, body = ''): AcademyContentFile => ({ path, data, body })

const courseData = {
  code: 'MOLT-101',
  title: 'Introduction to Ecdysis',
  subtitle: 'Shed one thing.',
  category: 'Foundations',
  level: 'beginner',
  instructor: { name: 'Archivist Vess', title: 'Keeper of First Shells' },
  outcomes: ['Name one habit'],
  certificate: { title: 'Shell Initiate', description: 'Awarded for finishing.' },
  modules: [{ title: 'The first shed', lessons: ['read-me', 'check'] }],
}

const lessons = () =>
  new Map([
    ['read-me', file('lessons/read-me.md', { title: 'Read me', duration: 8 }, 'Some text.')],
    [
      'check',
      file('lessons/check.md', {
        title: 'Check',
        duration: '6:00',
        questions: [{ prompt: 'Which?', choices: ['A', 'B'], answer: 'B' }],
      }),
    ],
  ])

describe('parseLessonDuration', () => {
  it('reads minutes, clock times, and seconds', () => {
    expect(parseLessonDuration(8)).toBe(480)
    expect(parseLessonDuration('12:30')).toBe(750)
    expect(parseLessonDuration('1:02:00')).toBe(3720)
    expect(parseLessonDuration('90s')).toBe(90)
    expect(parseLessonDuration('15 min')).toBe(900)
    expect(parseLessonDuration('soon')).toBeNull()
  })
})

describe('inferVideoProvider', () => {
  it('names the host from the address', () => {
    expect(inferVideoProvider('https://www.youtube.com/watch?v=abc')).toBe('youtube')
    expect(inferVideoProvider('https://youtu.be/abc')).toBe('youtube')
    expect(inferVideoProvider('https://vimeo.com/123')).toBe('vimeo')
    expect(inferVideoProvider('https://cdn.example.com/a.mp4')).toBe('file')
    expect(inferVideoProvider('https://player.example.com/embed/1')).toBe('embed')
    expect(inferVideoProvider('./media/lecture.mp4')).toBe('file')
  })
})

describe('parseAcademyLesson', () => {
  it('infers a quiz from its questions and resolves the answer text', () => {
    const result = parseAcademyLesson(lessons().get('check')!, 'check')
    expect(result.value?.kind).toBe('quiz')
    expect(result.value?.questions[0].correctIndex).toBe(1)
    expect(result.value?.passingScore).toBe(80)
  })

  it('rejects an answer that is not one of the choices', () => {
    const result = parseAcademyLesson(
      file('q.md', { title: 'Q', duration: 2, questions: [{ prompt: 'Which?', choices: ['A', 'B'], answer: 'C' }] }),
      'q',
    )
    expect(result.value).toBeNull()
    expect(result.issues.map((issue) => issue.message).join(' ')).toMatch(/answer/)
  })

  it('accepts a video lesson without a video yet, with a warning', () => {
    const result = parseAcademyLesson(file('v.md', { title: 'V', kind: 'video', duration: 10 }), 'v')
    expect(result.value?.kind).toBe('video')
    expect(result.issues).toEqual([expect.objectContaining({ severity: 'warning' })])
  })

  it('requires text on a reading and a readable duration', () => {
    const result = parseAcademyLesson(file('r.md', { title: 'R', duration: 'soon' }), 'r')
    expect(result.value).toBeNull()
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(3)
  })
})

describe('parseAcademyCourse', () => {
  it('orders lessons by module and sums the course length', () => {
    const result = parseAcademyCourse(file('course.md', courseData, 'A short first course.'), 'introduction-to-ecdysis', lessons())
    expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([])
    expect(result.value?.slug).toBe('introduction-to-ecdysis')
    expect(result.value?.status).toBe('draft')
    expect(result.value?.estimatedMinutes).toBe(14)
    expect(result.value?.modules[0].lessons.map((lesson) => lesson.slug)).toEqual(['read-me', 'check'])
    expect(result.value?.certificate?.slug).toBe('introduction-to-ecdysis')
  })

  it('reports a listed lesson with no file and warns about an unlisted one', () => {
    const files = lessons()
    files.set('extra', file('lessons/extra.md', { title: 'Extra', duration: 3 }, 'Text.'))
    const result = parseAcademyCourse(
      file('course.md', { ...courseData, modules: [{ title: 'M', lessons: ['read-me', 'check', 'missing'] }] }, 'Desc.'),
      'c',
      files,
    )
    expect(result.value).toBeNull()
    const messages = result.issues.map((issue) => `${issue.severity}: ${issue.message}`)
    expect(messages).toContain('error: Lesson "missing" has no file at lessons/missing.md.')
    expect(messages).toContain('warning: lessons/extra.md is not listed in any module, so it is skipped.')
  })

  it('rejects an unknown level and status', () => {
    const result = parseAcademyCourse(file('course.md', { ...courseData, level: 'expert', status: 'live' }, 'Desc.'), 'c', lessons())
    expect(result.value).toBeNull()
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(2)
  })
})

describe('parseAcademyTrack', () => {
  it('reads course order and optional courses', () => {
    const result = parseAcademyTrack(
      file('t.md', {
        title: 'First Shell',
        subtitle: 'A short path.',
        level: 'beginner',
        hours: 3,
        courses: ['a', { slug: 'b', required: false }],
        certificate: { title: 'Path', description: 'Awarded.' },
      }, 'Two courses.'),
      'first-shell',
    )
    expect(result.value?.courses).toEqual([
      { slug: 'a', required: true },
      { slug: 'b', required: false },
    ])
    expect(result.value?.certificate?.slug).toBe('first-shell-path')
  })
})

describe('planLessonSync', () => {
  it('keeps ids for slugs that stay, inserts new ones, and lists removals', () => {
    const plan = planLessonSync(
      [
        { id: '1', slug: 'a' },
        { id: '2', slug: 'b' },
      ],
      ['b', 'c'],
    )
    expect([...plan.keep]).toEqual([['b', '2']])
    expect(plan.insert).toEqual(['c'])
    expect(plan.removed).toEqual([{ id: '1', slug: 'a' }])
  })
})

describe('isLocalMediaPath', () => {
  it('uploads local files only', () => {
    expect(isLocalMediaPath('./media/cover.jpg')).toBe(true)
    expect(isLocalMediaPath('images/academy/x.jpg')).toBe(false)
    expect(isLocalMediaPath('https://example.com/x.jpg')).toBe(false)
  })
})
