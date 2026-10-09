import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import type { ForumEditorHandle, ForumEditorProps } from '../ForumEditor'

/**
 * Test double for the rich editor: a textarea holding the same markdown the
 * real editor emits, so composer tests can drive value changes directly.
 * Opt in with `vi.mock('@/components/forum/ForumEditor')`.
 */
export const ForumEditor = forwardRef<ForumEditorHandle, ForumEditorProps>(function ForumEditor(props, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }))
  return (
    <textarea
      ref={textareaRef}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') props.onSubmit?.()
      }}
      disabled={props.disabled}
      placeholder={props.placeholder}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      data-testid={props.testId ?? 'forum-editor'}
    />
  )
})
