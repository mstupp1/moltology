import React, { useState } from 'react'
import { marked, type Token, type Tokens } from 'marked'
import { Copy, Check, Terminal } from 'lucide-react'

export interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Standard ChatGPT-style Markdown Renderer for AI responses.
 * Parses standard GFM: Tables, Headings, Lists, Code Blocks, Inline Code,
 * Blockquotes, Horizontal Rules, Bold, Italic, Strikethrough, and Links.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content || !content.trim()) return null

  // Configure marked for standard GFM parsing
  const tokens = marked.lexer(content, { gfm: true, breaks: true })

  return (
    <div className={`space-y-3.5 text-xs sm:text-[13px] leading-[1.75] text-[#dfe3e3] font-sans ${className}`}>
      <RenderTokens tokens={tokens} keyPrefix="root" />
    </div>
  )
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-3.5 sm:my-4 bg-[#040708] border border-cyan-900/70 chamfer-corner overflow-hidden group shadow-lg">
      {/* Code Header Bar */}
      <div className="bg-[#0b1011] border-b border-cyan-950 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-cyan-400 font-sans select-none">
        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-widest font-bold">{language || 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-300 transition-colors p-0.5 cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3.5 sm:p-4 overflow-x-auto text-xs font-mono text-cyan-200 leading-[1.7] no-scrollbar select-text">
        <code>{code}</code>
      </pre>
    </div>
  )
}

interface RenderTokensProps {
  tokens?: Token[]
  keyPrefix?: string
}

const RenderTokens: React.FC<RenderTokensProps> = ({ tokens, keyPrefix = 'tok' }) => {
  if (!tokens || tokens.length === 0) return null

  return (
    <>
      {tokens.map((token, index) => {
        const key = `${keyPrefix}-${index}`

        switch (token.type) {
          case 'heading': {
            const headingToken = token as Tokens.Heading
            const inner = <RenderTokens tokens={headingToken.tokens} keyPrefix={`${key}-h`} />
            if (headingToken.depth === 1) {
              return (
                <h1
                  key={key}
                  className="text-sm sm:text-base font-bold text-cyan-300 tracking-wider uppercase border-b border-cyan-900/60 pb-1.5 mt-4 sm:mt-5 mb-2.5 sm:mb-3 font-grotesk first:mt-0"
                >
                  {inner}
                </h1>
              )
            }
            if (headingToken.depth === 2) {
              return (
                <h2
                  key={key}
                  className="text-xs sm:text-sm font-bold text-cyan-300 tracking-wider uppercase border-b border-cyan-950/80 pb-1 mt-3.5 sm:mt-4 mb-2 font-grotesk first:mt-0"
                >
                  {inner}
                </h2>
              )
            }
            if (headingToken.depth === 3) {
              return (
                <h3
                  key={key}
                  className="text-xs sm:text-[13px] font-semibold text-cyan-300 tracking-wide mt-3 mb-1.5 font-grotesk first:mt-0"
                >
                  {inner}
                </h3>
              )
            }
            return (
              <h4
                key={key}
                className="text-xs font-medium text-cyan-400 tracking-wide mt-2.5 mb-1 font-grotesk first:mt-0"
              >
                {inner}
              </h4>
            )
          }

          case 'paragraph': {
            const paragraphToken = token as Tokens.Paragraph
            return (
              <p key={key} className="my-2 sm:my-2.5 leading-[1.75] text-[#dfe3e3] first:mt-0 last:mb-0">
                <RenderTokens tokens={paragraphToken.tokens} keyPrefix={`${key}-p`} />
              </p>
            )
          }

          case 'table': {
            const tableToken = token as Tokens.Table
            return (
              <div
                key={key}
                className="my-3.5 sm:my-4 overflow-x-auto rounded border border-cyan-900/60 bg-[#060a0d]/80 shadow-md"
              >
                <table className="w-full text-left text-xs sm:text-[13px] border-collapse min-w-full">
                  <thead>
                    <tr className="border-b border-cyan-800/60 bg-cyan-950/40">
                      {tableToken.header.map((col, hIdx) => (
                        <th
                          key={hIdx}
                          className={`px-3.5 py-2.5 text-cyan-300 font-semibold text-xs uppercase tracking-wider ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          <RenderTokens
                            tokens={col.tokens || [{ type: 'text', text: col.text, raw: col.text }]}
                            keyPrefix={`${key}-th-${hIdx}`}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-950/40">
                    {tableToken.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-cyan-950/20 transition-colors odd:bg-transparent even:bg-cyan-950/10"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-3.5 py-2.5 text-[#dfe3e3] text-xs sm:text-[13px] leading-relaxed ${
                              cell.align === 'center'
                                ? 'text-center'
                                : cell.align === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          >
                            <RenderTokens
                              tokens={cell.tokens || [{ type: 'text', text: cell.text, raw: cell.text }]}
                              keyPrefix={`${key}-td-${rIdx}-${cIdx}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          case 'list': {
            const listToken = token as Tokens.List
            const ListTag = listToken.ordered ? 'ol' : 'ul'
            return (
              <ListTag
                key={key}
                className={`my-2.5 sm:my-3 space-y-1.5 pl-5 sm:pl-6 text-xs sm:text-[13px] text-[#dfe3e3] ${
                  listToken.ordered ? 'list-decimal' : 'list-disc'
                }`}
                start={typeof listToken.start === 'number' && listToken.start !== 1 ? listToken.start : undefined}
              >
                {listToken.items.map((item, itemIdx) => (
                  <li key={`${key}-item-${itemIdx}`} className="leading-[1.75] pl-0.5">
                    <RenderTokens tokens={item.tokens} keyPrefix={`${key}-item-${itemIdx}`} />
                  </li>
                ))}
              </ListTag>
            )
          }

          case 'list_item': {
            const itemToken = token as Tokens.ListItem
            return (
              <li key={key} className="leading-[1.75] pl-0.5">
                <RenderTokens tokens={itemToken.tokens} keyPrefix={`${key}-li`} />
              </li>
            )
          }

          case 'blockquote': {
            const blockquoteToken = token as Tokens.Blockquote
            return (
              <blockquote
                key={key}
                className="border-l-2 border-cyan-500/70 pl-3.5 sm:pl-4 py-2 sm:py-2.5 my-3 sm:my-3.5 bg-cyan-950/25 text-cyan-200/90 text-xs sm:text-[13px] italic rounded-r leading-[1.75]"
              >
                <RenderTokens tokens={blockquoteToken.tokens} keyPrefix={`${key}-bq`} />
              </blockquote>
            )
          }

          case 'code': {
            const codeToken = token as Tokens.Code
            return (
              <CodeBlock
                key={key}
                language={codeToken.lang || 'code'}
                code={codeToken.text}
              />
            )
          }

          case 'codespan': {
            const codespanToken = token as Tokens.Codespan
            return (
              <code
                key={key}
                className="bg-cyan-950/80 border border-cyan-800/50 text-cyan-200 px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11.5px] sm:text-xs"
              >
                {codespanToken.text}
              </code>
            )
          }

          case 'strong': {
            const strongToken = token as Tokens.Strong
            return (
              <strong key={key} className="font-bold text-white">
                <RenderTokens tokens={strongToken.tokens} keyPrefix={`${key}-str`} />
              </strong>
            )
          }

          case 'em': {
            const emToken = token as Tokens.Em
            return (
              <em key={key} className="italic text-cyan-200">
                <RenderTokens tokens={emToken.tokens} keyPrefix={`${key}-em`} />
              </em>
            )
          }

          case 'del': {
            const delToken = token as Tokens.Del
            return (
              <del key={key} className="line-through text-gray-400">
                <RenderTokens tokens={delToken.tokens} keyPrefix={`${key}-del`} />
              </del>
            )
          }

          case 'link': {
            const linkToken = token as Tokens.Link
            return (
              <a
                key={key}
                href={linkToken.href}
                title={linkToken.title || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-sans"
              >
                <RenderTokens tokens={linkToken.tokens} keyPrefix={`${key}-link`} />
              </a>
            )
          }

          case 'image': {
            const imageToken = token as Tokens.Image
            return (
              <img
                key={key}
                src={imageToken.href}
                alt={imageToken.text || imageToken.title || ''}
                title={imageToken.title || undefined}
                className="max-w-full rounded border border-cyan-900/50 my-3 sm:my-4"
              />
            )
          }

          case 'hr': {
            return <hr key={key} className="border-cyan-900/50 my-4 sm:my-5" />
          }

          case 'br': {
            return <br key={key} />
          }

          case 'space': {
            return null
          }

          case 'text': {
            const textToken = token as Tokens.Text
            if (textToken.tokens && textToken.tokens.length > 0) {
              return <RenderTokens key={key} tokens={textToken.tokens} keyPrefix={`${key}-txt`} />
            }
            return <React.Fragment key={key}>{textToken.text}</React.Fragment>
          }

          case 'html': {
            const htmlToken = token as Tokens.HTML
            return <React.Fragment key={key}>{htmlToken.text}</React.Fragment>
          }

          default: {
            if ('text' in token && typeof (token as any).text === 'string') {
              return <React.Fragment key={key}>{(token as any).text}</React.Fragment>
            }
            return null
          }
        }
      })}
    </>
  )
}

