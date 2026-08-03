import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MOLTOLOGY_OPENAPI_SPEC } from '@/lib/openapi'
import { getPublicChangelogsRestApiHandler } from '@/lib/server/api'

// Mock TanStack React Router createFileRoute
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => (Component: any) => Component,
}))

describe('Public REST API & Documentation Telemetry', () => {
  it('validates OpenAPI 3.0 specification integrity', () => {
    expect(MOLTOLOGY_OPENAPI_SPEC.openapi).toBe('3.0.3')
    expect(MOLTOLOGY_OPENAPI_SPEC.info.title).toContain('Moltology Public REST API')
    expect(MOLTOLOGY_OPENAPI_SPEC.paths['/changelogs']).toBeDefined()
    expect(MOLTOLOGY_OPENAPI_SPEC.paths['/neondb/rest/v1/changelogs']).toBeDefined()
  })

  it('executes getPublicChangelogsRestApiHandler with security headers & category filtering', async () => {
    const result = await getPublicChangelogsRestApiHandler({
      data: {
        category: 'FEATURE',
        limit: 5,
      },
    })

    expect(result.status).toBe(200)
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*')
    expect(result.headers['Content-Type']).toContain('application/json')
    expect(result.headers['X-Content-Type-Options']).toBe('nosniff')
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      result.data.forEach((entry) => {
        expect(entry.category.toUpperCase()).toBe('FEATURE')
      })
    }
  })

  it('handles limit parameters correctly', async () => {
    const result = await getPublicChangelogsRestApiHandler({
      data: {
        limit: 2,
      },
    })

    expect(result.status).toBe(200)
    expect(result.data.length).toBeLessThanOrEqual(2)
  })
})
