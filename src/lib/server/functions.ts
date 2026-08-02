import { createServerFn } from '@tanstack/react-start'
import { loggingMiddleware, authMiddleware, optionalAuthMiddleware } from './middleware'

/**
 * Standard public server function builder with logging and optional authentication context.
 */
export const publicServerFn = createServerFn()
  .middleware([loggingMiddleware, optionalAuthMiddleware])

/**
 * Standard authenticated server function builder with logging and strict JWT authentication.
 * Handlers attached to this will receive verified `user`, `token`, and RLS-scoped `db` in context.
 */
export const authenticatedServerFn = createServerFn()
  .middleware([loggingMiddleware, authMiddleware])

type AnyFn = (...args: any[]) => any
type HandlerReturn<T extends AnyFn> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : T extends (...args: any[]) => infer R
    ? R
    : never

export interface ServerFunction<TReturn> {
  (data?: unknown): Promise<TReturn>
  __executeServer: (opts: {
    data?: unknown
    context?: unknown
    sendContext?: unknown
    headers?: unknown
  }) => Promise<{ result?: unknown; error?: unknown }>
}

/**
 * Registers a handler as both the client-facing `extractedFn` and the server-side
 * `serverFn`, mirroring the TanStack Start compiler output so the server-side
 * executor works even without a build transform (tests, SSR helpers, CLI scripts).
 */
export function handlerWithServer<T extends AnyFn>(
  builder: any,
  handler: T,
): ServerFunction<HandlerReturn<T>> {
  return (builder.handler as AnyFn)(handler, handler)
}
