import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'

export const forumMentionPluginKey = new PluginKey('forumMention')

/** Handles a member search can match (3–20 letters, numbers, underscore). */
export const FORUM_MENTION_QUERY_RE = /^[A-Za-z0-9_]{0,20}$/

type ForumMentionOptions = {
  render: NonNullable<SuggestionOptions['render']>
}

/**
 * `@` autocomplete. The chosen member is inserted as plain `@handle ` text,
 * which is exactly what the stored markdown and the mention parser expect.
 */
export const ForumMention = Extension.create<ForumMentionOptions>({
  name: 'forumMention',

  addOptions() {
    return { render: () => ({}) }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: forumMentionPluginKey,
        char: '@',
        allowedPrefixes: [' ', '(', ' '],
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          if ($from.parent.type.spec.code) return false
          return !$from.marks().some((mark) => mark.type.name === 'code' || mark.type.name === 'link')
        },
        render: this.options.render,
      }),
    ]
  },
})

type ForumEditorKeysOptions = {
  onLink: () => void
  onSubmit: () => void
}

/** Ctrl/Cmd+K opens the link field, Ctrl/Cmd+Enter posts. */
export const ForumEditorKeys = Extension.create<ForumEditorKeysOptions>({
  name: 'forumEditorKeys',

  addOptions() {
    return { onLink: () => {}, onSubmit: () => {} }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        this.options.onLink()
        return true
      },
      'Mod-Enter': () => {
        this.options.onSubmit()
        return true
      },
    }
  },
})
