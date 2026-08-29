import React, { useEffect, useRef, useState } from 'react'
import { scaledCodexBox } from '@/lib/codex-reader'
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
  }, [pageWidth, scriptureId])

  const box = scaledCodexBox(pageWidth, pageHeight, zoom)

  return (
    <div
      data-codex-pdf-stage=""
      className="mx-auto"
      style={{
        width: box.width,
        height: pageHeight > 0 ? box.height : undefined,
      }}
    >
      <div
        ref={pageRef}
        data-codex-pdf-page=""
        className={cn(
          'pdf-page-sheet codex-parchment-theme border shadow-2xl relative',
          className
        )}
        style={{
          width: pageWidth,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
