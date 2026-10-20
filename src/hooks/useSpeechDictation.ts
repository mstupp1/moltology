import { useCallback, useEffect, useRef, useState } from 'react'

/** Minimal shape of the Web Speech API recognizer (Chrome, Edge and Safari ship it). */
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as SpeechRecognitionCtor | null
}

/** Joins dictated speech onto whatever was already typed. */
export function appendTranscript(base: string, transcript: string): string {
  const spoken = transcript.trim()
  if (!spoken) return base
  if (!base.trim()) return spoken
  const separator = /\s$/.test(base) ? '' : ' '
  return `${base}${separator}${spoken}`
}

export type DictationError = 'not-allowed' | 'no-speech' | 'other'

export function classifyDictationError(code: string | undefined): DictationError {
  if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
    return 'not-allowed'
  }
  if (code === 'no-speech') return 'no-speech'
  return 'other'
}

export interface UseSpeechDictationOptions {
  /** Text in the box when dictation starts. Speech is appended to it. */
  getBaseText: () => string
  onText: (text: string) => void
  onError?: (error: DictationError) => void
}

/**
 * Browser speech-to-text for the Oracle prompt box. `isSupported` stays false during SSR
 * and in browsers without the Web Speech API (Firefox), so the mic button is hidden there.
 */
export function useSpeechDictation({ getBaseText, onText, onError }: UseSpeechDictationOptions) {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const callbacksRef = useRef({ getBaseText, onText, onError })
  callbacksRef.current = { getBaseText, onText, onError }

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionCtor()))
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || recognitionRef.current) return

    const recognition = new Ctor()
    recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    const base = callbacksRef.current.getBaseText()
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? ''
      }
      callbacksRef.current.onText(appendTranscript(base, transcript))
    }
    recognition.onerror = (event: any) => {
      if (event?.error === 'aborted') return
      callbacksRef.current.onError?.(classifyDictationError(event?.error))
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setIsListening(false)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsListening(true)
    } catch {
      recognitionRef.current = null
      setIsListening(false)
      callbacksRef.current.onError?.('other')
    }
  }, [])

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop()
    else start()
  }, [start, stop])

  return { isSupported, isListening, start, stop, toggle }
}
