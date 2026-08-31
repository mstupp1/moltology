import React, { useEffect, useRef, useState } from 'react'
import { scaledCodexBox } from '@/lib/codex-reader'
import { cn } from '@/lib/utils'

interface ReaderPdfPageProps {
  zoom: number
  pageWidth: number
  pageId: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  dataPageAttribute?: string
  dataStageAttribute?: string
}

/**
 * Fixed-width, zoom-scaled page frame shared by immersive document readers.
 * The sheet reserves layout space for the scaled transform so the viewport
 * scrollbars stay accurate, exactly like the codex pdf page.
 */
export function ReaderPdfPage({
  zoom,
  pageWidth,
  pageId,
  children,
  className,
  style,
  dataPageAttribute = 'data-reader-pdf-page',
  dataStageAttribute = 'data-reader-pdf-stage',
}: ReaderPdfPageProps) {
  const pageRef = useRef<HTMLDivElement>(null)
  const [pageHeight, setPageHeight] = useState(0)

  useEffect(() => {
    const el = pageRef.current
    if (!el) return

    const measure = () => {
      setPageHeight(el.offsetHeight)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [pageWidth, pageId])

  const box = scaledCodexBox(pageWidth, pageHeight, zoom)

  return (
    <div
      {...{ [dataStageAttribute]: '' }}
      className="mx-auto"
      style={{
        width: box.width,
        height: pageHeight > 0 ? box.height : undefined,
      }}
    >
      <div
        ref={pageRef}
        {...{ [dataPageAttribute]: '' }}
        className={cn('pdf-page-sheet border shadow-2xl relative', className)}
        style={{
          width: pageWidth,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  )
}
