import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { appendTranscript, classifyDictationError, useSpeechDictation } from './useSpeechDictation'

describe('appendTranscript', () => {
  it('returns the spoken text when the box is empty', () => {
    expect(appendTranscript('', ' hello there ')).toBe('hello there')
  })

  it('adds a space before speech unless the text already ends in one', () => {
    expect(appendTranscript('Tell me', 'about molting')).toBe('Tell me about molting')
    expect(appendTranscript('Tell me ', 'about molting')).toBe('Tell me about molting')
  })

  it('leaves the text alone when nothing was heard', () => {
    expect(appendTranscript('Draft', '   ')).toBe('Draft')
  })
})

describe('classifyDictationError', () => {
  it('groups permission and device errors', () => {
    expect(classifyDictationError('not-allowed')).toBe('not-allowed')
    expect(classifyDictationError('service-not-allowed')).toBe('not-allowed')
    expect(classifyDictationError('audio-capture')).toBe('not-allowed')
    expect(classifyDictationError('no-speech')).toBe('no-speech')
    expect(classifyDictationError('network')).toBe('other')
  })
})

describe('useSpeechDictation', () => {
  afterEach(() => {
    delete (window as any).webkitSpeechRecognition
    delete (window as any).SpeechRecognition
  })

  it('reports unsupported when the browser has no speech API', () => {
    const { result } = renderHook(() =>
      useSpeechDictation({ getBaseText: () => '', onText: vi.fn() })
    )
    expect(result.current.isSupported).toBe(false)
  })

  it('streams results onto the base text and stops on end', () => {
    const instances: any[] = []
    class FakeRecognition {
      lang = ''
      continuous = false
      interimResults = false
      onresult: any = null
      onerror: any = null
      onend: any = null
      start = vi.fn()
      stop = vi.fn(() => this.onend?.())
      abort = vi.fn()
      constructor() {
        instances.push(this)
      }
    }
    ;(window as any).webkitSpeechRecognition = FakeRecognition
    const onText = vi.fn()

    const { result } = renderHook(() =>
      useSpeechDictation({ getBaseText: () => 'Oracle,', onText })
    )
    expect(result.current.isSupported).toBe(true)

    act(() => result.current.toggle())
    expect(result.current.isListening).toBe(true)
    expect(instances[0].start).toHaveBeenCalled()

    act(() => {
      instances[0].onresult({ results: [[{ transcript: 'what is' }], [{ transcript: ' depth' }]] })
    })
    expect(onText).toHaveBeenLastCalledWith('Oracle, what is depth')

    act(() => result.current.toggle())
    expect(instances[0].stop).toHaveBeenCalled()
    expect(result.current.isListening).toBe(false)
  })
})
