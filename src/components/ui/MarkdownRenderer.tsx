import React, { useState } from 'react'
import { Copy, Check, Terminal } from 'lucide-react'

export interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Standard HUD Markdown Renderer for AI Model responses.
 * Parses code blocks, inline code, headers, bold, italics, lists, blockquotes, and links.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null

  // Split content by code blocks (```lang\n...```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index)
    if (textBefore) {
      elements.push(renderFormattedText(textBefore, `text-${lastIndex}`))
    }

    const language = match[1] || 'code'
    const codeContent = match[2].trimEnd()
    elements.push(
      <CodeBlock key={`code-${match.index}`} language={language} code={codeContent} />
    )
    lastIndex = match.index + match[0].length
  }

  const textRemaining = content.substring(lastIndex)
  if (textRemaining) {
    elements.push(renderFormattedText(textRemaining, `text-${lastIndex}`))
  }

  return <div className={`space-y-2 text-xs leading-relaxed text-[#dfe3e3] font-sans ${className}`}>{elements}</div>
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-2.5 bg-[#040708] border border-cyan-900/70 chamfer-corner overflow-hidden group shadow-lg">
      {/* Code Header Bar */}
      <div className="bg-[#0b1011] border-b border-cyan-950 px-3 py-1 flex items-center justify-between text-[10px] text-cyan-400 font-sans">
        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-widest font-bold">{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-300 transition-colors p-0.5"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3 overflow-x-auto text-[11px] font-sans text-cyan-200 leading-relaxed no-scrollbar select-text">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function renderFormattedText(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split('\n')
  const renderedLines: React.ReactNode[] = []

  let inList = false
  let listItems: React.ReactNode[] = []

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      renderedLines.push(
        <ul key={key} className="space-y-1 my-1.5 pl-1">
          {listItems}
        </ul>
      )
      listItems = []
    }
    inList = false
  }

  lines.forEach((line, lineIdx) => {
    const lineKey = `${keyPrefix}-line-${lineIdx}`

    // Headers (#, ##, ###)
    if (line.startsWith('# ')) {
      flushList(`${lineKey}-flush`)
      renderedLines.push(
        <h1 key={lineKey} className="text-sm font-bold text-cyan-300 tracking-wider uppercase border-b border-cyan-900/60 pb-1 mt-3 mb-2 font-grotesk">
          {formatInline(line.slice(2))}
        </h1>
      )
      return
    }
    if (line.startsWith('## ')) {
      flushList(`${lineKey}-flush`)
      renderedLines.push(
        <h2 key={lineKey} className="text-xs font-bold text-cyan-300 tracking-wider uppercase border-b border-cyan-950 pb-0.5 mt-2.5 mb-1.5 font-grotesk">
          {formatInline(line.slice(3))}
        </h2>
      )
      return
    }
    if (line.startsWith('### ')) {
      flushList(`${lineKey}-flush`)
      renderedLines.push(
        <h3 key={lineKey} className="text-xs font-semibold text-cyan-400 mt-2 mb-1">
          {formatInline(line.slice(4))}
        </h3>
      )
      return
    }

    // Blockquotes (> text)
    if (line.startsWith('> ')) {
      flushList(`${lineKey}-flush`)
      renderedLines.push(
        <blockquote key={lineKey} className="border-l-2 border-cyan-500 pl-3 py-1 my-1.5 bg-cyan-950/30 text-cyan-200/90 text-[11px] italic chamfer-corner">
          {formatInline(line.slice(2))}
        </blockquote>
      )
      return
    }

    // Unordered Bullet lists (- item or * item)
    if (/^\s*[-*]\s+/.test(line)) {
      inList = true
      const itemText = line.replace(/^\s*[-*]\s+/, '')
      listItems.push(
        <li key={lineKey} className="flex items-start gap-1.5 text-xs text-[#dfe3e3]">
          <span className="text-cyan-400 font-sans text-[10px] shrink-0 mt-0.5">◆</span>
          <span>{formatInline(itemText)}</span>
        </li>
      )
      return
    }

    // Numbered lists (1. item)
    if (/^\s*\d+\.\s+/.test(line)) {
      inList = true
      const numMatch = line.match(/^\s*(\d+)\.\s+(.*)/)
      const num = numMatch ? numMatch[1] : '1'
      const itemText = numMatch ? numMatch[2] : line
      listItems.push(
        <li key={lineKey} className="flex items-start gap-1.5 text-xs text-[#dfe3e3]">
          <span className="text-cyan-400 font-sans text-[10px] font-bold shrink-0 mt-0.5">{num}.</span>
          <span>{formatInline(itemText)}</span>
        </li>
      )
      return
    }

    // Standard paragraph or line break
    flushList(`${lineKey}-flush`)
    if (line.trim() === '') {
      renderedLines.push(<div key={lineKey} className="h-1.5" />)
    } else {
      renderedLines.push(
        <p key={lineKey} className="my-0.5 leading-relaxed">
          {formatInline(line)}
        </p>
      )
    }
  })

  flushList(`${keyPrefix}-final-flush`)
  return <React.Fragment key={keyPrefix}>{renderedLines}</React.Fragment>
}

/**
 * Formats inline Markdown constructs (**bold**, *italic*, `code`, [link](url))
 */
function formatInline(text: string): React.ReactNode[] {
  // Regex to match inline code (`code`), bold (**bold**), italic (*italic*), links ([label](url))
  const parts: React.ReactNode[] = []
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g

  let lastIdx = 0
  let m: RegExpExecArray | null

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.substring(lastIdx, m.index))
    }

    const matchedStr = m[0]
    const partKey = `inline-${m.index}`

    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      // Inline Code
      parts.push(
        <code key={partKey} className="bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 px-1.5 py-0.5 font-sans text-[11px] chamfer-corner">
          {matchedStr.slice(1, -1)}
        </code>
      )
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      // Bold
      parts.push(
        <strong key={partKey} className="font-bold text-white">
          {matchedStr.slice(2, -2)}
        </strong>
      )
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      // Italic
      parts.push(
        <em key={partKey} className="italic text-cyan-200">
          {matchedStr.slice(1, -1)}
        </em>
      )
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      // Link
      const linkMatch = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkMatch) {
        const label = linkMatch[1]
        const url = linkMatch[2]
        parts.push(
          <a
            key={partKey}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-sans"
          >
            {label}
          </a>
        )
      } else {
        parts.push(matchedStr)
      }
    } else {
      parts.push(matchedStr)
    }

    lastIdx = m.index + matchedStr.length
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx))
  }

  return parts
}
