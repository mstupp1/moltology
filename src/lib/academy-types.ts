export type AcademyLevel = 'beginner' | 'intermediate' | 'advanced'

/** `soon` lists a course or track as coming soon: shown on the catalog, no lessons, no enrolling. */
export type AcademyPublishStatus = 'draft' | 'soon' | 'published'

export type AcademyLessonKind = 'video' | 'reading' | 'quiz'

export type AcademyVideoProvider = 'file' | 'youtube' | 'vimeo' | 'embed'

export type AcademyEnrollmentStatus = 'active' | 'completed'

export type AcademyProgressStatus = 'not_started' | 'in_progress' | 'completed'

export type AcademyCertificateScope = 'course' | 'track'

export const ACADEMY_LEVELS: AcademyLevel[] = ['beginner', 'intermediate', 'advanced']

export const ACADEMY_QUIZ_PASS_PERCENT = 80
