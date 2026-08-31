import React from 'react'
import type { JournalPaper } from '@/lib/journal-data'
import { ReaderToolbar } from '@/components/reader/ReaderToolbar'
import {
  ReaderPreferences,
  useReaderPreferences,
} from '@/components/reader/useReaderPreferences'
import { JournalPaperSheet } from './JournalPaperSheet'

interface JournalPaperReaderProps {
  paper: JournalPaper
  preferences?: ReaderPreferences
  pageIndex?: number
  pageCount?: number
  onPrev?: () => void
  onNext?: () => void
}

/**
 * Reading pane for a journal paper: the shared reader toolbar (sheet theme +
 * type scale) above the paper sheet. Theme and type preferences can be lifted
 * into a workspace via the `preferences` prop so the immersive overlay stays
 * in sync; without it the reader owns its own persisted preferences.
 */
export const JournalPaperReader: React.FC<JournalPaperReaderProps> = ({
  paper,
  preferences,
  pageIndex,
  pageCount,
  onPrev,
  onNext,
}) => {
  const internalPreferences = useReaderPreferences('moltology_journal_reader_prefs')
  const activePreferences = preferences ?? internalPreferences

  return (
    <div>
      <ReaderToolbar
        label="Paper Reader"
        className="mt-3"
        theme={activePreferences.theme}
        onThemeChange={activePreferences.setTheme}
        fontSize={activePreferences.fontSize}
        onFontSizeChange={activePreferences.setFontSize}
      />

      <div className="flex justify-center mt-4">
        <JournalPaperSheet
          paper={paper}
          theme={activePreferences.theme}
          fontSize={activePreferences.fontSize}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </div>
  )
}

export default JournalPaperReader
