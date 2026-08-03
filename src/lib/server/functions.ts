import { loggingMiddleware, authMiddleware, optionalAuthMiddleware } from './middleware'

/**
 * Standard middleware stacks for server functions.
 *
 * IMPORTANT: Server functions must be declared with the statically visible chain
 * `createServerFn({ method: 'POST' }).middleware([...]).validator(...).handler(...)`
 * so TanStack Start's compiler can generate the client RPC stub and server endpoint.
 * Do NOT wrap `.handler()` behind a helper function, or the handler body will be
 * bundled into the client and executed in the browser.
 */
export const publicMiddleware = [loggingMiddleware, optionalAuthMiddleware]
export const authenticatedMiddleware = [loggingMiddleware, authMiddleware]
