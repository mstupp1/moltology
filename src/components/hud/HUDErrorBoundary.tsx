import React, { Component, ErrorInfo, ReactNode, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronRight, RefreshCw, Home, Copy, Check } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class HUDErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Error Boundary caught error]:', error, errorInfo)
  }

  public resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <HUDErrorFallback error={this.state.error} reset={this.resetErrorBoundary} />
    }

    return this.props.children
  }
}

export function HUDErrorFallback({
  error,
  reset,
}: {
  error?: Error | unknown
  reset?: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const errorMessage =
    error instanceof Error ? error.message : String(error || 'An unexpected runtime error occurred.')
  const errorStack = error instanceof Error ? error.stack : undefined
  const errorCode =
    error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string'
      ? (error as any).code
      : error instanceof Error
        ? error.name
        : 'ERR_RUNTIME_EXCEPTION'

  const handleReset = () => {
    if (reset) {
      reset()
    } else if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  const handleCopy = async () => {
    const errorDetails = [
      `Error: ${errorMessage}`,
      `Code: ${errorCode}`,
      `Timestamp: ${new Date().toISOString()}`,
      typeof window !== 'undefined' ? `URL: ${window.location.href}` : null,
      errorStack ? `\nStack Trace:\n${errorStack}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(errorDetails)
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea')
        textarea.value = errorDetails
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  return (
    <div className="min-h-[400px] w-full flex items-center justify-center p-4 sm:p-6 bg-abyss text-ink font-sans">
      <div className="w-full max-w-2xl rounded-card border border-line-subtle bg-surface-1 hud-sheen p-6 shadow-menu">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line-subtle mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson-aggro" />
            <span className="text-xs font-semibold text-crimson-text uppercase tracking-[0.08em]">
              Application Error
            </span>
          </div>
          <span className="text-xs font-sans text-ink-muted bg-surface-2 px-2 py-0.5 rounded-chip border border-line-subtle">
            {errorCode}
          </span>
        </div>

        {/* Error Info */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="p-2.5 rounded-control bg-crimson-soft border border-crimson-aggro/20 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-crimson-text" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-ink mb-1">
              Something went wrong
            </h2>
            <p className="text-xs text-ink-body leading-relaxed">
              An unhandled exception occurred during application execution.
            </p>
          </div>
        </div>

        {/* Error Message Box */}
        <div className="p-3.5 mb-5 rounded-control bg-surface-2 border border-crimson-aggro/20 text-xs font-sans text-crimson-text leading-relaxed break-words">
          {errorMessage}
        </div>

        {/* Expandable Stack Trace */}
        {errorStack && (
          <div className="mb-5 border border-line-subtle rounded-card overflow-hidden bg-surface-1">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 text-xs text-ink-body hover:text-ink bg-surface-2 hover:bg-surface-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow focus-visible:-outline-offset-2"
            >
              <span className="flex items-center gap-2 font-medium">
                {showDetails ? <ChevronDown className="w-4 h-4 text-cyan-glow" /> : <ChevronRight className="w-4 h-4" />}
                {showDetails ? 'Hide technical details' : 'Show technical details'}
              </span>
              <span className="text-[11px] text-ink-muted font-sans">Stack Trace</span>
            </button>
            {showDetails && (
              <pre className="p-4 bg-abyss text-[11px] text-ink-body font-sans overflow-x-auto max-h-48 border-t border-line-subtle whitespace-pre-wrap leading-relaxed select-text">
                {errorStack}
              </pre>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-control border border-line bg-surface-1 hud-sheen text-ink hover:bg-surface-2 hover:border-line-strong transition-colors text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-ink-muted" />}
            {copied ? 'Copied' : 'Copy Error Details'}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-control bg-surface-1 hover:bg-crimson-soft text-crimson-text border border-crimson-aggro/55 hover:border-crimson-aggro transition-colors text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>

          <a
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-control border border-line bg-surface-1 hud-sheen text-cyan-glow hover:bg-surface-2 hover:border-line-strong transition-colors text-xs font-medium sm:ml-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </a>
        </div>
      </div>
    </div>
  )
}

