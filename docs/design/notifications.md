# Notifications and toasts

Read this before changing action feedback or notifications.

One toast system, one persistent notification system, one OS bridge. Never `alert()`/`confirm()`, never hand-rolled toast markup or local toast state, never a second toast library.

- **Ephemeral feedback (toasts)**: `useToast()` from [`src/components/ui/ToastProvider.tsx`](../../src/components/ui/ToastProvider.tsx) (mounted in `__root.tsx`). API: `toast.info/success/warning/error/hud(message, { title?, duration?, id? })`. When the provider may be absent (hooks, guest-embedded widgets), use `useOptionalToast()` and no-op gracefully — never `try/catch` around `useToast()`.
- **Types**: `success` = confirmations, `error` = failures, `warning` = reversals/limits, `info` = neutral notices, `hud` = in-world system events (system voice, not general UI feedback).
- **Scope**: Action confirmations and async failures go to toasts. Form validation and field-level feedback stay inline next to the form. Optimistic-mutation failures toast after rollback (see `useThreadActions` for the pattern).
- **Defaults**: 5s duration, no title unless it adds meaning. Pass `id:` for dedupe on repeatable actions. Extend duration only for scheduled reminders (8s max).
- **Persistent notifications**: `NotificationsProvider` ([`src/hooks/useNotifications.tsx`](../../src/hooks/useNotifications.tsx)) + the `notifications` table — never for ephemeral feedback.
- **OS notifications**: only via [`src/lib/system-notifications.ts`](../../src/lib/system-notifications.ts).
- **HUD telemetry**: read toast history from provider context (`HUDTaskBar` pattern); do not keep parallel toast logs.
- **Copy**: plain English that says what happened. Follow [STYLE_GUIDE §3.4](../../STYLE_GUIDE.md#34-utility-copy-buttons-toasts-errors-forms-empty-states).
