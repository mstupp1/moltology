import { useEffect, type RefObject } from 'react'

/** Keyboard containment for custom sheets, with focus returned to their opener. */
export function useModalPanelFocus(
  active: boolean,
  panel: RefObject<HTMLElement | null>,
  trigger?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = panel.current
    if (!active || !root) return
    const previous = document.activeElement as HTMLElement | null
    const controls = () => {
      const items = Array.from(root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      )).filter(element => !element.closest('[hidden], [inert], [aria-hidden="true"]'))
      if (trigger?.current) items.push(trigger.current)
      return items
    }
    ;(controls()[0] ?? root).focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== 'Tab') return
      // Portaled menus/dialogs own their keyboard handling while they are active.
      const target = event.target as HTMLElement
      if (!root.contains(target) && target !== trigger?.current && target.closest('[role="dialog"], [role="menu"], [role="alertdialog"]')) return
      const items = controls()
      const first = items[0] ?? root
      const last = items[items.length - 1] ?? root
      if (!items.length || (event.shiftKey ? document.activeElement === first : document.activeElement === last) ||
        (!root.contains(document.activeElement) && document.activeElement !== trigger?.current)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const destination = trigger?.current ?? previous
      if (destination?.isConnected) destination.focus()
    }
  }, [active, panel, trigger])
}
