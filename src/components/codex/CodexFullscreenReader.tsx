import React from 'react'
import type { ScriptureItem } from '@/lib/codexData'
import { FullscreenDocumentReader } from '@/components/reader/FullscreenDocumentReader'
import { CodexDocumentSheet } from './CodexDocumentSheet'
import { CodexPdfPage } from './CodexPdfPage'

interface CodexFullscreenReaderProps {
  scriptures: ScriptureItem[]
  activeScripture: ScriptureItem
  activeIndex: number
  highlightedVerses: Record<number, boolean>
  copiedVerseIndex: number | null
  onSelectScripture: (id: string) => void
  onPrev: () => void
  onNext: () => void
  onToggleHighlight: (verseNumber: number) => void
  onCopyVerse: (verseNumber: number, text: string) => void
  onPrint: () => void
  onClose: () => void
}

export function CodexFullscreenReader({
  scriptures,
  activeScripture,
  activeIndex,
  highlightedVerses,
  copiedVerseIndex,
  onSelectScripture,
  onPrev,
  onNext,
  onToggleHighlight,
  onCopyVerse,
  onPrint,
  onClose,
}: CodexFullscreenReaderProps) {
  const items = scriptures.map((scripture) => ({
    id: scripture.id,
    title: scripture.title,
    subtitle: `${scripture.volumeName} • ${scripture.id}`,
  }))

  return (
    <FullscreenDocumentReader
      items={items}
      activeIndex={activeIndex}
      overlayLabel="Immersive Codex reader"
      tocToggleTitle="Toggle Canon Table of Contents Index"
      mobileHint="Tap the leaf to rest the well"
      onPrev={onPrev}
      onNext={onNext}
      onSelectItem={onSelectScripture}
      onPrint={onPrint}
      onClose={onClose}
      renderItem={({ zoom, pageWidth }) => (
        <CodexPdfPage
          zoom={zoom}
          pageWidth={pageWidth}
          scriptureId={activeScripture.id}
          className="p-6 sm:p-10 md:p-14"
        >
          <CodexDocumentSheet
            scripture={activeScripture}
            pageIndex={activeIndex}
            pageCount={scriptures.length}
            highlightedVerses={highlightedVerses}
            copiedVerseIndex={copiedVerseIndex}
            onToggleHighlight={onToggleHighlight}
            onCopyVerse={onCopyVerse}
            onPrev={onPrev}
            onNext={onNext}
            onSelectScripture={onSelectScripture}
            compact
          />
        </CodexPdfPage>
      )}
    />
  )
}
