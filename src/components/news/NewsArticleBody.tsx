import React from 'react'
import { Shield, Terminal, Copy, Check } from 'lucide-react'
import { getAssetUrl } from '@/lib/assets'

export interface NewsArticleBodyProps {
  content: string
  className?: string
}

/**
 * High-precision HUD Markdown Parser and Renderer for MoltNation News dispatches.
 * Accurately parses code blocks, telemetry ASCII frames, inline & block figures,
 * headings, blockquotes, lists, bold, italics, inline code, and links.
 * Mobile optimized for fluid typography, touch scrolling, and zero horizontal viewport blowout.
 */
export const NewsArticleBody: React.FC<NewsArticleBodyProps> = ({ content, className = '' }) => {
  if (!content) return null

  // 1. Separate code blocks (```...```) to preserve formatting
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g
  const blocks: { type: 'code' | 'text'; language?: string; raw: string }[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        raw: content.substring(lastIndex, match.index),
      })
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'telemetry',
      raw: match[2].trimEnd(),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      raw: content.substring(lastIndex),
    })
  }

  return (
    <div className={`prose prose-invert max-w-none space-y-4 sm:space-y-6 text-[#dfe3e3] font-sans break-words ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <ArticleCodeBlock key={`code-${idx}`} language={block.language || 'telemetry'} code={block.raw} />
        }
        return <RenderTextSection key={`section-${idx}`} rawText={block.raw} sectionIdx={idx} />
      })}
    </div>
  )
}

const ArticleCodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-6 sm:my-8 bg-[#040708] border border-cyan-900/80 chamfer-corner overflow-hidden shadow-hud-cyan w-full">
      <div className="bg-[#090e10] border-b border-cyan-950 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-cyan-400 font-sans gap-2">
        <div className="flex items-center space-x-2 min-w-0 truncate">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="uppercase tracking-widest font-bold text-[11px] sm:text-xs truncate">
            {language || 'TELEMETRY DATA'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-300 transition-colors px-2 py-1 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-900/40 chamfer-corner shrink-0 active:scale-95"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>
      <div className="relative">
        <pre className="p-3.5 sm:p-4 overflow-x-auto touch-pan-scroll text-[11px] sm:text-xs md:text-sm font-sans text-cyan-200 leading-relaxed no-scrollbar select-text bg-[#030607]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

function RenderTextSection({ rawText, sectionIdx }: { rawText: string; sectionIdx: number }) {
  const lines = rawText.split('\n')
  const elements: React.ReactNode[] = []

  let currentParagraphLines: string[] = []
  let currentListItems: { text: string; ordered: boolean; number?: string }[] = []
  let currentBlockquoteLines: string[] = []
  let currentTableLines: string[] = []

  const flushParagraph = (key: string) => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim()
      if (text) {
        // Check if paragraph is a standalone image: ![alt](url)
        const singleImageMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
        if (singleImageMatch) {
          elements.push(
            <RenderFigure
              key={key}
              alt={singleImageMatch[1] || 'MoltNation Visual Telemetry'}
              src={singleImageMatch[2].trim()}
            />
          )
        } else {
          elements.push(
            <p
              key={key}
              className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed my-3 sm:my-4 break-words"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }}
            />
          )
        }
      }
      currentParagraphLines = []
    }
  }

  const flushList = (key: string) => {
    if (currentListItems.length > 0) {
      const isOrdered = currentListItems[0].ordered
      if (isOrdered) {
        elements.push(
          <ol key={key} className="space-y-2.5 my-3 sm:my-4 pl-1 sm:pl-2 font-sans text-sm sm:text-base text-gray-300">
            {currentListItems.map((item, i) => (
              <li key={`${key}-item-${i}`} className="flex items-start gap-3 leading-relaxed">
                <span className="font-bold text-cyan-400 font-sans text-xs sm:text-sm shrink-0 min-w-[1.25rem] mt-0.5">
                  {item.number || i + 1}.
                </span>
                <span className="break-words" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.text) }} />
              </li>
            ))}
          </ol>
        )
      } else {
        elements.push(
          <ul key={key} className="space-y-2.5 my-3 sm:my-4 pl-1 sm:pl-2 font-sans text-sm sm:text-base text-gray-300">
            {currentListItems.map((item, i) => (
              <li key={`${key}-item-${i}`} className="flex items-start gap-3 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 shrink-0 opacity-80" />
                <span className="break-words" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.text) }} />
              </li>
            ))}
          </ul>
        )
      }
      currentListItems = []
    }
  }

  const flushBlockquote = (key: string) => {
    if (currentBlockquoteLines.length > 0) {
      const text = currentBlockquoteLines.join('\n').trim()
      elements.push(
        <blockquote
          key={key}
          className="border-l-2 border-cyan-400 pl-4 py-2 my-4 sm:my-5 italic font-sans text-sm sm:text-base text-cyan-100/90 bg-cyan-950/20 chamfer-corner break-words leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }}
        />
      )
      currentBlockquoteLines = []
    }
  }

  const flushTable = (key: string) => {
    if (currentTableLines.length >= 2) {
      const rows = currentTableLines.map((row) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim())
      )

      const headerCells = rows[0]
      // Skip row 1 if it's the separator row (e.g. :--- | :---)
      const dataRows = rows.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c)))

      elements.push(
        <div key={key} className="my-6 overflow-x-auto border border-cyan-900/50 chamfer-corner bg-[#070c0e] shadow-hud-cyan w-full touch-pan-scroll">
          <table className="w-full text-left font-sans text-xs sm:text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-[#0b1417] border-b border-cyan-900 text-cyan-300 font-bold uppercase tracking-wider">
                {headerCells.map((h, hIdx) => (
                  <th key={`${key}-h-${hIdx}`} className="p-3 sm:p-3.5 border-r border-cyan-950/60 last:border-r-0" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h) }} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950/40 text-gray-300">
              {dataRows.map((row, rIdx) => (
                <tr key={`${key}-r-${rIdx}`} className="hover:bg-cyan-950/20 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={`${key}-c-${rIdx}-${cIdx}`} className="p-3 sm:p-3.5 border-r border-cyan-950/40 last:border-r-0 font-sans" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      currentTableLines = []
    } else {
      currentTableLines = []
    }
  }

  const flushAll = (key: string) => {
    flushParagraph(`${key}-p`)
    flushList(`${key}-list`)
    flushBlockquote(`${key}-quote`)
    flushTable(`${key}-tbl`)
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    const lineKey = `s${sectionIdx}-l${i}`

    // Empty blank line -> signals block break
    if (trimmed === '') {
      flushAll(lineKey)
      continue
    }

    // Markdown Table Row (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph(`${lineKey}-p`)
      flushList(`${lineKey}-list`)
      flushBlockquote(`${lineKey}-quote`)
      currentTableLines.push(trimmed)
      continue
    } else if (currentTableLines.length > 0) {
      flushTable(`${lineKey}-tbl`)
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushAll(lineKey)
      elements.push(<hr key={lineKey} className="border-cyan-900/40 my-6 sm:my-10" />)
      continue
    }

    // Standalone Image Line: ![Alt text](url)
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      flushAll(lineKey)
      elements.push(
        <RenderFigure
          key={lineKey}
          alt={imageMatch[1] || 'MoltNation Visual Telemetry'}
          src={imageMatch[2].trim()}
        />
      )
      continue
    }

    // Heading 1 (# ...)
    if (trimmed.startsWith('# ')) {
      flushAll(lineKey)
      elements.push(
        <h1 key={lineKey} className="font-grotesk font-bold text-2xl sm:text-3xl md:text-4xl text-gray-100 mt-8 sm:mt-10 mb-3 sm:mb-4 border-b border-cyan-900/40 pb-2 break-words leading-tight">
          {trimmed.slice(2)}
        </h1>
      )
      continue
    }

    // Heading 2 (## ...)
    if (trimmed.startsWith('## ')) {
      flushAll(lineKey)
      elements.push(
        <h2 key={lineKey} className="font-grotesk font-bold text-xl sm:text-2xl text-gray-100 mt-7 sm:mt-9 mb-3 border-b border-cyan-900/30 pb-2 text-cyan-200 break-words leading-snug">
          {trimmed.slice(3)}
        </h2>
      )
      continue
    }

    // Heading 3 (### ...)
    if (trimmed.startsWith('### ')) {
      flushAll(lineKey)
      elements.push(
        <h3 key={lineKey} className="font-grotesk font-bold text-base sm:text-lg text-cyan-300 mt-6 sm:mt-8 mb-2 break-words leading-snug">
          {trimmed.slice(4)}
        </h3>
      )
      continue
    }

    // Heading 4 (#### ...)
    if (trimmed.startsWith('#### ')) {
      flushAll(lineKey)
      elements.push(
        <h4 key={lineKey} className="font-grotesk font-semibold text-sm sm:text-base text-gray-200 mt-4 sm:mt-6 mb-2 break-words">
          {trimmed.slice(5)}
        </h4>
      )
      continue
    }

    // Heading 5 (##### ...)
    if (trimmed.startsWith('##### ')) {
      flushAll(lineKey)
      elements.push(
        <h5 key={lineKey} className="font-grotesk font-medium text-xs sm:text-sm text-cyan-400 mt-3 sm:mt-4 mb-1.5 break-words">
          {trimmed.slice(6)}
        </h5>
      )
      continue
    }

    // Blockquote (> ...)
    if (trimmed.startsWith('> ')) {
      flushParagraph(`${lineKey}-p`)
      flushList(`${lineKey}-list`)
      currentBlockquoteLines.push(trimmed.slice(2))
      continue
    }

    // Numbered List (1. ...)
    const numListMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numListMatch) {
      flushParagraph(`${lineKey}-p`)
      flushBlockquote(`${lineKey}-quote`)
      currentListItems.push({
        ordered: true,
        number: numListMatch[1],
        text: numListMatch[2],
      })
      continue
    }

    // Bullet List (* ... or - ...)
    const bulletListMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (bulletListMatch) {
      flushParagraph(`${lineKey}-p`)
      flushBlockquote(`${lineKey}-quote`)
      currentListItems.push({
        ordered: false,
        text: bulletListMatch[1],
      })
      continue
    }

    // Standard paragraph line
    flushList(`${lineKey}-list`)
    flushBlockquote(`${lineKey}-quote`)
    currentParagraphLines.push(trimmed)
  }

  flushAll(`s${sectionIdx}-final`)

  return <React.Fragment>{elements}</React.Fragment>
}

function RenderFigure({ alt, src }: { alt: string; src: string }) {
  const resolvedSrc = getAssetUrl(src)
  const [hasError, setHasError] = React.useState(false)

  return (
    <figure className="my-6 sm:my-8 rounded-none border-2 border-cyan-500/50 bg-[#050809] chamfer-corner-lg overflow-hidden shadow-hud-cyan-lg">
      <div className="relative overflow-hidden group min-h-[140px] flex items-center justify-center bg-[#070b0c]">
        {hasError ? (
          <div className="p-6 text-center text-xs text-cyan-400/80 font-sans flex flex-col items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-500/50" />
            <span className="uppercase tracking-widest text-[11px] font-bold">VISUAL TELEMETRY ARCHIVED</span>
            <span className="text-[10px] text-gray-400">{alt}</span>
          </div>
        ) : (
          <img
            src={resolvedSrc}
            alt={alt}
            onError={() => setHasError(true)}
            className="w-full max-h-[280px] sm:max-h-[420px] md:max-h-[500px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050809] via-transparent to-transparent opacity-30 pointer-events-none" />
      </div>
      {alt && (
        <figcaption className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#090e10] border-t border-cyan-950 flex items-center min-w-0 text-xs font-sans text-cyan-300">
          <span className="font-semibold text-gray-200 truncate">{alt}</span>
        </figcaption>
      )}
    </figure>
  )
}

function cleanLatexMath(math: string): string {
  return math
    .replace(/\\mathbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\quad/g, ' &nbsp; ')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
    .replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>')
    .replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>')
}

function formatInlineMarkdown(text: string): string {
  // First escape angle brackets and ampersands so raw symbols like <15ms or >100 are preserved
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Handle standalone block math $$...$$
  formatted = formatted.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    const cleaned = cleanLatexMath(math.trim())
    return `<div class="my-4 py-2.5 px-4 bg-[#030607] border border-cyan-800/60 text-cyan-300 font-sans text-center text-xs sm:text-sm chamfer-corner shadow-hud-cyan overflow-x-auto select-all leading-relaxed tracking-wider">${cleaned}</div>`
  })

  // Handle inline math $...$
  formatted = formatted.replace(/\$([^$\n]+)\$/g, (_, math) => {
    const cleaned = cleanLatexMath(math.trim())
    return `<code class="bg-cyan-950/90 border border-cyan-700/60 text-cyan-300 px-1.5 py-0.5 font-sans text-[11px] sm:text-xs font-semibold chamfer-corner select-text">${cleaned}</code>`
  })

  // Handle inline markdown images if any in paragraph: ![alt](url)
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const resolvedUrl = getAssetUrl(src.trim())
    return `<img src="${resolvedUrl}" alt="${alt}" class="rounded border border-cyan-900 my-4 max-h-[300px] sm:max-h-[400px] w-full object-cover" />`
  })

  // Bold: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-100 font-sans">$1</strong>')

  // Italic: *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-cyan-200">$1</em>')

  // Inline Code: `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.5 font-sans text-[11px] sm:text-xs chamfer-corner break-all">$1</code>')

  // Links: [label](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-sans font-bold break-words">$1</a>')

  return formatted
}

