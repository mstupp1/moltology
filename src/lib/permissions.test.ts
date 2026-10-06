import { describe, it, expect } from 'vitest'
import {
  SUPER_ADMIN_EMAILS,
  isSuperAdminEmail,
  getEffectiveRole,
  isAdminOrSuperAdmin,
  isVerifiedSuperAdminEmail,
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

  it('resolves effective role for super admins with a confirmed email', () => {
    expect(getEffectiveRole({ email: 'mylesstupp@gmail.com', emailVerified: true }, 'user')).toBe('super_admin')
    expect(getEffectiveRole({ email: 'myles@moltology.org', emailVerified: true }, null)).toBe('super_admin')
    expect(getEffectiveRole(null, 'super_admin')).toBe('super_admin')
  })

  it('ignores an allowlisted email that has not been confirmed', () => {
    expect(isVerifiedSuperAdminEmail({ email: 'admin@moltology.org' })).toBe(false)
    expect(isVerifiedSuperAdminEmail({ email: 'admin@moltology.org', emailVerified: false })).toBe(false)
    expect(isVerifiedSuperAdminEmail({ email: 'admin@moltology.org', emailVerified: true })).toBe(true)
    expect(getEffectiveRole({ email: 'admin@moltology.org' }, 'user')).toBe('user')
    expect(isAdminOrSuperAdmin({ email: 'admin@moltology.org', emailVerified: false }, null)).toBe(false)
    // A stored role still counts, whatever the email state.
    expect(isAdminOrSuperAdmin({ email: 'admin@moltology.org' }, 'super_admin')).toBe(true)
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
    expect(isAdminOrSuperAdmin({ email: 'mylesstupp@gmail.com', emailVerified: true })).toBe(true)
    expect(isAdminOrSuperAdmin({ email: 'myles@moltology.org', emailVerified: true })).toBe(true)
    expect(isAdminOrSuperAdmin({ role: 'admin' })).toBe(true)
    expect(isAdminOrSuperAdmin(null, 'admin')).toBe(true)
    expect(isAdminOrSuperAdmin({ email: 'user@example.com', role: 'user' })).toBe(false)
  })
})
