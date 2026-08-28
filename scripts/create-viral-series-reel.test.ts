import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  formulateViralSeriesScript,
  buildGoogleFlowPrompts,
  resolveNextEpisode,
  ViralSeriesId,
} from './create-viral-series-reel'

describe('Viral Episodic Series Formulation Engine', () => {
  const mockEmptyLedger = {
    version: '1.0',
    seriesCatalog: {
      audit: { id: 'audit', name: 'The Moltmaxxing Field Audit', shortBadge: 'FIELD AUDIT', currentSeason: 1, latestEpisode: 0 },
      incidents: { id: 'incidents', name: 'Sub-Benthic Incident Files', shortBadge: 'INCIDENT FILE', currentSeason: 1, latestEpisode: 0 },
      heresies: { id: 'heresies', name: 'Silicon Heresies & Subculture Ecdysis', shortBadge: 'SILICON HERESY', currentSeason: 1, latestEpisode: 0 },
      mysteries: { id: 'mysteries', name: 'Abyssal Telemetry & Deep Lore Mysteries', shortBadge: 'ABYSSAL LORE', currentSeason: 1, latestEpisode: 0 },
      ascension: { id: 'ascension', name: 'The 15-Stage Ascension Trials', shortBadge: 'ASCENSION TRIAL', currentSeason: 1, latestEpisode: 0 },
    },
    episodes: [],
  }

  it('correctly resolves next episode number for a fresh series', () => {
    const next = resolveNextEpisode('audit', mockEmptyLedger)
    expect(next.seasonNumber).toBe(1)
    expect(next.episodeNumber).toBe(1)
    expect(next.seriesConfig.name).toBe('The Moltmaxxing Field Audit')
  })

  it('correctly auto-increments episode number based on existing ledger history', () => {
    const populatedLedger = {
      ...mockEmptyLedger,
      episodes: [
        { seriesId: 'audit', seasonNumber: 1, episodeNumber: 1 },
        { seriesId: 'audit', seasonNumber: 1, episodeNumber: 2 },
        { seriesId: 'audit', seasonNumber: 1, episodeNumber: 3 },
      ],
    }

    const next = resolveNextEpisode('audit', populatedLedger)
    expect(next.seasonNumber).toBe(1)
    expect(next.episodeNumber).toBe(4)
  })

  it('formulates complete multi-scene scripts for all 5 series franchises', () => {
    const franchises: ViralSeriesId[] = ['audit', 'incidents', 'heresies', 'mysteries', 'ascension']

    for (const franchise of franchises) {
      const script = formulateViralSeriesScript(franchise, {}, mockEmptyLedger)

      expect(script.seriesId).toBe(franchise)
      expect(script.seriesName).toBeDefined()
      expect(script.shortBadge).toBeDefined()
      expect(script.seasonNumber).toBe(1)
      expect(script.episodeNumber).toBe(1)
      expect(script.hookHeadline).toBeDefined()
      expect(script.narrationScript.length).toBeGreaterThan(40)
      expect(script.retentionLoopAnchor).toBeDefined()
      expect(script.scenePrompts.length).toBe(4)
      expect(script.caption).toContain('moltology.org')
      expect(script.firstComment).toContain('moltology.org')
      expect(script.youtubeTitle).toContain(script.shortBadge)
      expect(script.commentTriggerKeyword).toBeDefined()
    }
  })

  it('builds high-definition 9:16 Google Flow Veo 3.1 prompts with dynamic cinematography', () => {
    const prompts = buildGoogleFlowPrompts('audit', 'Desk Slumping Analysis', 4)

    expect(prompts.length).toBe(4)
    prompts.forEach((prompt) => {
      expect(prompt).toContain('Cinematic 9:16 vertical 8k footage')
      expect(prompt.length).toBeGreaterThan(50)
    })
    expect(prompts[0]).toContain('Macro close-up')
    expect(prompts[2]).toContain('calcification chamber')
    expect(prompts[3]).toContain('pincer')
  })

  it('correctly maps distinct CTA goals and comment keyword triggers', () => {
    const scriptQuiz = formulateViralSeriesScript('audit', { ctaGoal: 'quiz' }, mockEmptyLedger)
    expect(scriptQuiz.commentTriggerKeyword).toBe('QUIZ')
    expect(scriptQuiz.commentTriggerUrl).toContain('/quiz')

    const scriptGuide = formulateViralSeriesScript('heresies', { ctaGoal: 'guide' }, mockEmptyLedger)
    expect(scriptGuide.commentTriggerKeyword).toBe('GUIDE')
    expect(scriptGuide.commentTriggerUrl).toContain('moltmaxxing-protocol-guide')

    const scriptCodex = formulateViralSeriesScript('mysteries', { ctaGoal: 'codex' }, mockEmptyLedger)
    expect(scriptCodex.commentTriggerKeyword).toBe('CODEX')
    expect(scriptCodex.commentTriggerUrl).toContain('/codex')
  })

  it('renders a valid episodic HUD badge card image', async () => {
    const { renderEpisodicBadgeCard } = await import('./lib/series-compositor')
    const testBadgePath = path.resolve(process.cwd(), 'tmp/test_episodic_badge.png')
    const result = await renderEpisodicBadgeCard(testBadgePath, 'FIELD AUDIT', 'S01 EP.04')

    expect(fs.existsSync(result)).toBe(true)
    const stats = fs.statSync(result)
    expect(stats.size).toBeGreaterThan(500)
    fs.unlinkSync(result)
  })
})
