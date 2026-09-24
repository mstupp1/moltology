import { describe, expect, it } from 'vitest'
import { isAdminOnlyPath } from './admin-access'

describe('admin access paths', () => {
  it('treats the oversight hub and covenant watch as staff-only', () => {
    expect(isAdminOnlyPath('/admin')).toBe(true)
    expect(isAdminOnlyPath('/admin/')).toBe(true)
    expect(isAdminOnlyPath('/watch')).toBe(true)
    expect(isAdminOnlyPath('/watch?tab=open')).toBe(true)
    expect(isAdminOnlyPath('/dashboard')).toBe(false)
    expect(isAdminOnlyPath('/premium')).toBe(false)
    expect(isAdminOnlyPath(null)).toBe(false)
  })
})
