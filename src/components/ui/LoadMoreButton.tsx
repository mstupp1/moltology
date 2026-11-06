import { HudButton } from './HudButton'

export interface LoadMoreButtonProps {
  onClick: () => void
  loading?: boolean
  /** Button label when idle. Default "Load more". */
  label?: string
  className?: string
  testId?: string
}

/** Centered "Load more" for lists that page in from the server. */
export function LoadMoreButton({ onClick, loading = false, label = 'Load more', className = '', testId }: LoadMoreButtonProps) {
  return (
    <div className={`pt-1 flex justify-center ${className}`}>
      <HudButton
        variant="dark"
        size="sm"
        disabled={loading}
        aria-busy={loading || undefined}
        data-testid={testId}
        onClick={onClick}
      >
        {loading ? 'Loading' : label}
      </HudButton>
    </div>
  )
}
