import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  formulateViralSeriesScript,
  buildGoogleFlowPrompts,
  resolveNextEpisode,
  formatEpisodicBadgeLine,
  DEFAULT_VIRAL_SERIES_ID,
  INSTAGRAM_SERIES_HANDLE,
  SERIES_HASHTAGS,
  ViralSeriesId,
} from './create-viral-series-reel'
import { hasSlashPair } from '../src/lib/copy-slash-pair'

const BANNED_COPY = /fathom|15-stage|15 stage|stage 15|silas\.trench|satir|parody|dismantling the joke/i

describe('Viral Episodic Series Formulation Engine', () => {
  const mockEmptyLedger = {
    version: '1.0',
    seriesCatalog: {
      audit: { id: 'audit', name: 'The Moltmaxxing Field Audit', shortBadge: 'FIELD AUDIT', currentSeason: 1, latestEpisode: 0 },
      incidents: { id: 'incidents', name: 'Sub-Benthic Incident Files', shortBadge: 'INCIDENT FILE', currentSeason: 1, latestEpisode: 0 },
      heresies: { id: 'heresies', name: 'Silicon Heresies & Subculture Ecdysis', shortBadge: 'SILICON HERESY', currentSeason: 1, latestEpisode: 0 },
      mysteries: { id: 'mysteries', name: 'Abyssal Telemetry & Deep Lore Mysteries', shortBadge: 'ABYSSAL LORE', currentSeason: 1, latestEpisode: 0 },
      ascension: { id: 'ascension', name: 'The Ascension Trials', shortBadge: 'ASCENSION TRIAL', currentSeason: 1, latestEpisode: 0 },
    },
    episodes: [],
  }

  it('defaults the operational franchise to incidents and Instagram to moltology_org', () => {
    expect(DEFAULT_VIRAL_SERIES_ID).toBe('incidents')
    expect(INSTAGRAM_SERIES_HANDLE).toBe('moltology_org')
    expect(INSTAGRAM_SERIES_HANDLE).not.toMatch(/silas/i)
  })

  it('formats the episodic badge as two fields with a middle dot', () => {
    expect(formatEpisodicBadgeLine('FIELD AUDIT', 1, 4)).toBe('FIELD AUDIT · S01 EP.04')
    expect(hasSlashPair(formatEpisodicBadgeLine('FIELD AUDIT', 1, 4))).toBe(false)
  })

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
      expect(script.hashtags.length).toBeLessThanOrEqual(3)
      expect(script.hashtags).toEqual([...SERIES_HASHTAGS])
    }
  })

  it('keeps generated copy free of banned canon and slash-pair chrome', () => {
    const franchises: ViralSeriesId[] = ['audit', 'incidents', 'heresies', 'mysteries', 'ascension']

    for (const franchise of franchises) {
      const script = formulateViralSeriesScript(franchise, {}, mockEmptyLedger)
      const blob = [
        script.seriesName,
        script.shortBadge,
        script.episodeTitle,
        script.hookHeadline,
        script.narrationScript,
        script.hookHeadline,
        script.caption,
        script.firstComment,
        script.youtubeTitle,
        script.youtubeDescription,
        ...script.scenePrompts,
        ...script.hashtags,
      ].join('\n')

      expect(blob, franchise).not.toMatch(BANNED_COPY)
      expect(hasSlashPair(script.caption), `${franchise} caption`).toBe(false)
      expect(hasSlashPair(script.firstComment), `${franchise} firstComment`).toBe(false)
      expect(hasSlashPair(script.youtubeTitle), `${franchise} youtubeTitle`).toBe(false)
      expect(hasSlashPair(formatEpisodicBadgeLine(script.shortBadge, script.seasonNumber, script.episodeNumber))).toBe(
        false
      )
    }
  })

  it('keeps the ascension franchise on four stages and twelve clearances', () => {
    const script = formulateViralSeriesScript('ascension', {}, mockEmptyLedger)
    expect(script.seriesName).toBe('The Ascension Trials')
    expect(script.narrationScript).toMatch(/four-stage/)
    expect(script.narrationScript).toMatch(/twelve-clearance/)
    expect(script.narrationScript).toMatch(/Stage 4/)
    expect(script.scenePrompts.join('\n')).toMatch(/Stage 4/)
  })

  it('measures mystery depth in meters', () => {
    const script = formulateViralSeriesScript('mysteries', {}, mockEmptyLedger)
    expect(script.narrationScript).toMatch(/meters/)
    expect(script.scenePrompts.join('\n')).toMatch(/meters/)
    expect(script.episodeTitle).not.toMatch(/fathom/i)
  })

  it('builds high-definition 9:16 Google Flow Veo 3.1 prompts with dynamic cinematography', () => {
    const prompts = buildGoogleFlowPrompts('audit', 'Desk Slumping Analysis', 4)

    expect(prompts.length).toBe(4)
    prompts.forEach((prompt) => {
      expect(prompt).toContain('Cinematic 9:16 vertical 8k footage')
      expect(prompt.length).toBeGreaterThan(50)
      expect(prompt).not.toMatch(BANNED_COPY)
    })
    expect(prompts[0]).toContain('Macro close-up')
    expect(prompts[2]).toContain('calcification chamber')
    expect(prompts[3]).toContain('pincer')
  })

  it('correctly maps distinct CTA goals and comment keyword triggers', () => {
    const scriptQuiz = formulateViralSeriesScript('audit', { ctaGoal: 'quiz' }, mockEmptyLedger)
    expect(scriptQuiz.commentTriggerKeyword).toBe('QUIZ')
    expect(scriptQuiz.commentTriggerUrl).toContain('/quiz')
    expect(scriptQuiz.firstComment).toMatch(/four-stage/)
    expect(scriptQuiz.firstComment).not.toMatch(/15-stage/i)

    const scriptGuide = formulateViralSeriesScript('heresies', { ctaGoal: 'guide' }, mockEmptyLedger)
    expect(scriptGuide.commentTriggerKeyword).toBe('GUIDE')
    expect(scriptGuide.commentTriggerUrl).toContain('moltmaxxing-protocol-guide')

    const scriptCodex = formulateViralSeriesScript('mysteries', { ctaGoal: 'codex' }, mockEmptyLedger)
    expect(scriptCodex.commentTriggerKeyword).toBe('CODEX')
    expect(scriptCodex.commentTriggerUrl).toContain('/codex')
  })

  it('keeps the on-disk ledger aligned with canon locks', () => {
    const ledgerPath = path.resolve(process.cwd(), 'content/social/viral-series-ledger.json')
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))

    expect(ledger.account).toBe('moltology_org')
    expect(ledger.accountId).toBe('6a7f7f0777555aae01d99b54')
    expect(ledger.voicePersona).toBe('Silas Trench')
    expect(ledger.youtubeChannel).toBe('moltology')
    expect(ledger.queueId).toBe('6a84b7702421e968ac81f5bd')
    expect(ledger.defaultSeries).toBe('incidents')
    expect(Object.keys(ledger.seriesCatalog)).toEqual(['audit', 'incidents', 'heresies', 'mysteries', 'ascension'])
    expect(ledger.seriesCatalog.ascension.name).toBe('The Ascension Trials')
    expect(JSON.stringify(ledger)).not.toMatch(BANNED_COPY)
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
