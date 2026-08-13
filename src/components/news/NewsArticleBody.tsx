import React from 'react'
import { Shield, Terminal, Copy, Check } from 'lucide-react'

export interface NewsArticleBodyProps {
  content: string
  className?: string
}

/**
 * High-precision HUD Markdown Parser and Renderer for MoltNation News dispatches.
 * Accurately parses code blocks, telemetry ASCII frames, inline & block figures,
 * headings, blockquotes, lists, bold, italics, inline code, and links.
 */
export const NewsArticleBody: React.FC<NewsArticleBodyProps> = ({ content, className = '' }) => {
  if (!content) return null

  // 1. Separate code blocks (```...```) to preserve formatting
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
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
    <div className={`prose prose-invert max-w-none space-y-6 text-[#dfe3e3] font-sans ${className}`}>
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
    <div className="relative my-8 bg-[#040708] border border-cyan-900/80 chamfer-corner overflow-hidden shadow-hud-cyan">
      <div className="bg-[#090e10] border-b border-cyan-950 px-4 py-2 flex items-center justify-between text-xs text-cyan-400 font-mono">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-widest font-bold">// {language || 'TELEMETRY DATA'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-300 transition-colors p-1"
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
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono text-cyan-200 leading-relaxed no-scrollbar select-text bg-[#030607]">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function RenderTextSection({ rawText, sectionIdx }: { rawText: string; sectionIdx: number }) {
  const lines = rawText.split('\n')
  const elements: React.ReactNode[] = []

  let currentParagraphLines: string[] = []
  let currentListItems: { text: string; ordered: boolean; number?: string }[] = []
  let currentBlockquoteLines: string[] = []

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
              className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed my-4"
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
      elements.push(
        <ul key={key} className="space-y-3 my-4 pl-1 font-mono text-xs sm:text-sm text-gray-300">
          {currentListItems.map((item, i) => (
            <li key={`${key}-item-${i}`} className="flex items-start gap-2.5 chitin-card-inset p-3 chamfer-corner">
              {item.ordered ? (
                <span className="font-bold text-cyan-400 font-mono text-xs shrink-0 mt-0.5">{item.number}.</span>
              ) : (
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              )}
              <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item.text) }} />
            </li>
          ))}
        </ul>
      )
      currentListItems = []
    }
  }

  const flushBlockquote = (key: string) => {
    if (currentBlockquoteLines.length > 0) {
      const text = currentBlockquoteLines.join('\n').trim()
      elements.push(
        <blockquote
          key={key}
          className="chitin-card p-6 border-l-4 border-l-cyan-400 border-y border-r border-cyan-900/40 chamfer-corner my-6 italic font-serif text-base sm:text-lg text-cyan-100 bg-[#080d0f]/90 shadow-hud-cyan"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }}
        />
      )
      currentBlockquoteLines = []
    }
  }

  const flushAll = (key: string) => {
    flushParagraph(`${key}-p`)
    flushList(`${key}-list`)
    flushBlockquote(`${key}-quote`)
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

    // Horizontal Rule (---, ***, ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushAll(lineKey)
      elements.push(<hr key={lineKey} className="border-cyan-900/40 my-10" />)
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
        <h1 key={lineKey} className="font-grotesk font-black text-3xl sm:text-4xl text-gray-100 uppercase tracking-tight mt-12 mb-4 border-b border-cyan-900/50 pb-2 text-cyan-200">
          {trimmed.slice(2)}
        </h1>
      )
      continue
    }

    // Heading 2 (## ...)
    if (trimmed.startsWith('## ')) {
      flushAll(lineKey)
      elements.push(
        <h2 key={lineKey} className="font-grotesk font-black text-2xl sm:text-3xl text-gray-100 uppercase tracking-tight mt-10 mb-4 border-b border-cyan-900/50 pb-2 text-cyan-300">
          {trimmed.slice(3)}
        </h2>
      )
      continue
    }

    // Heading 3 (### ...)
    if (trimmed.startsWith('### ')) {
      flushAll(lineKey)
      elements.push(
        <h3 key={lineKey} className="font-grotesk font-black text-xl sm:text-2xl text-gray-100 uppercase tracking-wide mt-10 mb-4 border-b border-cyan-900/40 pb-2 text-cyan-300">
          {trimmed.slice(4)}
        </h3>
      )
      continue
    }

    // Heading 4 (#### ...)
    if (trimmed.startsWith('#### ')) {
      flushAll(lineKey)
      elements.push(
        <h4 key={lineKey} className="font-grotesk font-bold text-lg sm:text-xl text-gray-200 uppercase tracking-wide mt-8 mb-3 text-red-400">
          {trimmed.slice(5)}
        </h4>
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
  return (
    <figure className="my-8 rounded-none border-2 border-cyan-500/50 bg-[#050809] chamfer-corner-lg overflow-hidden shadow-hud-cyan-lg">
      <div className="relative overflow-hidden group">
        <img
          src={src}
          alt={alt}
          className="w-full max-h-[500px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050809] via-transparent to-transparent opacity-30 pointer-events-none" />
      </div>
      <figcaption className="px-4 py-3 bg-[#090e10] border-t border-cyan-950 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cyan-300">
        <span className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">//</span>
          <span className="font-semibold text-gray-200">{alt}</span>
        </span>
        <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/60 chamfer-corner">
          BENTHIC VISUAL TELEMETRY
        </span>
      </figcaption>
    </figure>
  )
}

function formatInlineMarkdown(text: string): string {
  return text
    // Handle inline markdown images if any in paragraph
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded border border-cyan-900 my-4 max-h-[400px] w-full object-cover" />')
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-100 font-mono">$1</strong>')
    // Italic: *text*
    .replace(/\*(.*?)\*/g, '<em class="italic text-cyan-200">$1</em>')
    // Inline Code: `code`
    .replace(/`([^`]+)`/g, '<code class="bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.5 font-mono text-xs chamfer-corner">$1</code>')
    // Links: [label](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-mono font-bold">$1</a>')
}
