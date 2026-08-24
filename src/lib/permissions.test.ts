import { describe, it, expect } from 'vitest'
import {
  SUPER_ADMIN_EMAILS,
  isSuperAdminEmail,
  getEffectiveRole,
  isAdminOrSuperAdmin,
} from './permissions'

describe('Permissions & Role Resolution Helpers', () => {
  it('identifies super admin emails accurately regardless of case or whitespace', () => {
    expect(isSuperAdminEmail('mylesstupp@gmail.com')).toBe(true)
    expect(isSuperAdminEmail('MYLESSTUPP@GMAIL.COM')).toBe(true)
    expect(isSuperAdminEmail(' myles@moltology.org ')).toBe(true)
    expect(isSuperAdminEmail('admin@moltology.org')).toBe(true)
    expect(isSuperAdminEmail('crab@moltology.org')).toBe(false)
    expect(isSuperAdminEmail(null)).toBe(false)
    expect(isSuperAdminEmail(undefined)).toBe(false)
  })

  it('resolves effective role for super admins', () => {
    expect(getEffectiveRole({ email: 'mylesstupp@gmail.com' }, 'user')).toBe('super_admin')
    expect(getEffectiveRole({ email: 'myles@moltology.org' }, null)).toBe('super_admin')
    expect(getEffectiveRole(null, 'super_admin')).toBe('super_admin')
  })

  it('resolves effective role for admins', () => {
    expect(getEffectiveRole({ email: 'other@example.com', role: 'admin' }, 'user')).toBe('admin')
    expect(getEffectiveRole({ email: 'other@example.com' }, 'admin')).toBe('admin')
  })

  it('resolves effective role for standard users', () => {
    expect(getEffectiveRole({ email: 'other@example.com', role: 'user' }, 'user')).toBe('user')
    expect(getEffectiveRole(null, null)).toBeNull()
  })

  it('evaluates isAdminOrSuperAdmin correctly', () => {
    expect(isAdminOrSuperAdmin({ email: 'mylesstupp@gmail.com' })).toBe(true)
    expect(isAdminOrSuperAdmin({ email: 'myles@moltology.org' })).toBe(true)
    expect(isAdminOrSuperAdmin({ role: 'admin' })).toBe(true)
    expect(isAdminOrSuperAdmin(null, 'admin')).toBe(true)
    expect(isAdminOrSuperAdmin({ email: 'user@example.com', role: 'user' })).toBe(false)
  })
})
