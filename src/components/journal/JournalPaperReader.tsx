import React from 'react'
import type { JournalPaper } from '@/lib/journal-data'
import { READER_FONT_SIZE } from '@/lib/paper-palette'
import { JournalPaperSheet } from './JournalPaperSheet'

interface JournalPaperReaderProps {
  paper: JournalPaper
  pageIndex?: number
  pageCount?: number
  onPrev?: () => void
  onNext?: () => void
}

/**
 * Reading pane for a journal paper: fixed paper theme and type scale above the
 * document sheet. Theme and font pickers were removed in favor of the shared
 * immersive fullscreen reader for layout controls.
 */
export const JournalPaperReader: React.FC<JournalPaperReaderProps> = ({
  paper,
  pageIndex,
  pageCount,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex justify-center mt-3">
      <JournalPaperSheet
        paper={paper}
        theme="paper"
        fontSize={READER_FONT_SIZE.default}
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  )
}

export default JournalPaperReader
