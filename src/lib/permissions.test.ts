import { describe, it, expect } from 'vitest'
import { getEffectiveRole, isAdmin } from './permissions'

describe('Permissions & Role Resolution Helpers', () => {
  it('resolves admin from the stored profile role or the session role', () => {
    expect(getEffectiveRole(null, 'admin')).toBe('admin')
    expect(getEffectiveRole({ role: 'admin' }, 'user')).toBe('admin')
  })

  it('treats the retired super_admin value as admin', () => {
    expect(getEffectiveRole(null, 'super_admin')).toBe('admin')
    expect(isAdmin(null, 'super_admin')).toBe(true)
  })

  it('resolves effective role for standard users', () => {
    expect(getEffectiveRole({ role: 'user' }, 'user')).toBe('user')
    expect(getEffectiveRole(null, null)).toBeNull()
  })

  it('does not grant staff from an email address', () => {
    const fromEmail = { email: 'mylesstupp@gmail.com', emailVerified: true } as { role?: string }
    expect(isAdmin(fromEmail, 'user')).toBe(false)
    expect(isAdmin(fromEmail, null)).toBe(false)
  })

  it('evaluates isAdmin correctly', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true)
    expect(isAdmin(null, 'admin')).toBe(true)
    expect(isAdmin({ role: 'user' })).toBe(false)
    expect(isAdmin(null, null)).toBe(false)
  })
})
