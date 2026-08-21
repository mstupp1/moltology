import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface HudPaginationProps {
  currentPage: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  itemName?: string
  className?: string
  showItemCount?: boolean
}

export function HudPagination({
  currentPage,
  totalItems,
  pageSize = 20,
  onPageChange,
  itemName = 'releases',
  className = '',
  showItemCount = true,
}: HudPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems <= 0) return null

  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(totalItems, currentPage * pageSize)

  // Generate pagination numbers array with smart ellipsis
  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 'ellipsis-end', totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis-start', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [
      1,
      'ellipsis-start',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis-end',
      totalPages,
    ]
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-2 text-xs font-sans border-t border-cyan-900/40 select-none ${className}`}
    >
      {/* Items Counter Summary */}
      {showItemCount && (
        <div className="text-[#839493] text-xs">
          Showing <strong className="text-cyan-300 font-mono">{startIndex}</strong>–
          <strong className="text-cyan-300 font-mono">{endIndex}</strong> of{' '}
          <strong className="text-gray-100 font-mono">{totalItems}</strong> {itemName}
        </div>
      )}

      {/* Page Navigation Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
            className="p-1.5 bg-[#060a0c] border border-cyan-900/60 hover:border-cyan-500 text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none chamfer-corner transition-all"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className="px-2.5 py-1.5 bg-[#060a0c] border border-cyan-900/60 hover:border-cyan-500 text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none chamfer-corner transition-all flex items-center gap-1 font-grotesk font-bold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">PREV</span>
          </button>

          {/* Numbered Page Buttons & Ellipses */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (p === 'ellipsis-start' || p === 'ellipsis-end') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 py-1 text-gray-500 font-mono"
                    aria-hidden="true"
                  >
                    …
                  </span>
                )
              }

              const isActive = p === currentPage

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                  className={`min-w-[30px] h-[30px] px-2 text-xs font-mono font-bold chamfer-corner transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-cyan-500 text-black shadow-hud-cyan font-black'
                      : 'bg-[#060a0c] text-gray-300 hover:text-white border border-cyan-900/60 hover:border-cyan-500'
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            className="px-2.5 py-1.5 bg-[#060a0c] border border-cyan-900/60 hover:border-cyan-500 text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none chamfer-corner transition-all flex items-center gap-1 font-grotesk font-bold"
          >
            <span className="hidden xs:inline">NEXT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Go to last page"
            className="p-1.5 bg-[#060a0c] border border-cyan-900/60 hover:border-cyan-500 text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none chamfer-corner transition-all"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </nav>
  )
}
