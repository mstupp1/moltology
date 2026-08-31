import React from 'react'
import { ReaderPdfPage } from '@/components/reader/ReaderPdfPage'
import { cn } from '@/lib/utils'

interface CodexPdfPageProps {
  zoom: number
  pageWidth: number
  scriptureId: string
  children: React.ReactNode
  className?: string
}

export function CodexPdfPage({
  zoom,
  pageWidth,
  scriptureId,
  children,
  className,
}: CodexPdfPageProps) {
  return (
    <ReaderPdfPage
      zoom={zoom}
      pageWidth={pageWidth}
      pageId={scriptureId}
      dataPageAttribute="data-codex-pdf-page"
      dataStageAttribute="data-codex-pdf-stage"
      className={cn('codex-parchment-theme', className)}
    >
      {children}
    </ReaderPdfPage>
  )
}
