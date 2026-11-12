import React from 'react'
import { ReaderPdfPage } from '@/components/reader/ReaderPdfPage'
import { cn } from '@/lib/utils'

interface CodexPdfPageProps {
  zoom: number
  pageWidth: number
  scriptureId: string
  children: React.ReactNode
  className?: string
  /** light, dark, or auto (follow the device). */
  readingTheme?: string
  onCopy?: React.ClipboardEventHandler<HTMLDivElement>
}

export function CodexPdfPage({
  zoom,
  pageWidth,
  scriptureId,
  children,
  className,
  readingTheme = 'light',
  onCopy,
}: CodexPdfPageProps) {
  return (
    <ReaderPdfPage
      zoom={zoom}
      pageWidth={pageWidth}
      pageId={scriptureId}
      dataPageAttribute="data-codex-pdf-page"
      dataStageAttribute="data-codex-pdf-stage"
      className={cn('codex-parchment-theme', className)}
      dataReadingTheme={readingTheme}
      onCopy={onCopy}
    >
      {children}
    </ReaderPdfPage>
  )
}
