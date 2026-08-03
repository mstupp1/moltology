import { runWithStartContext } from '@tanstack/start-storage-context'
import { TSS_SERVER_FUNCTION } from '@tanstack/start-client-core'

/**
 * Helper to execute a TanStack Start server function within a request context.
 * Runs the full middleware chain (validators, auth, RLS-scoped db injection) and
 * returns the handler result. Intended for server-side callers (SSR handlers).
 * This module is server-only and must not be statically imported from client code.
 */
export async function executeServerFn<T>(
  fn: any,
  request: Request = new Request('http://localhost'),
  data?: unknown,
): Promise<T> {
  return await runWithStartContext(
    {
      request,
      getRouter: () => ({} as any),
      startOptions: {},
      contextAfterGlobalMiddlewares: {},
      executedRequestMiddlewares: new Set(),
      handlerType: 'serverFn',
    },
    async () => {
      if (fn && typeof fn === 'function') {
        // Compiled server functions carry the TSS_SERVER_FUNCTION marker (added by
        // createServerRpc) and expose __executeServer, which runs the full middleware
        // chain and returns the handler result.
        if (typeof fn.__executeServer === 'function' && fn[TSS_SERVER_FUNCTION]) {
          const { result, error } = await fn.__executeServer({
            data,
            context: {},
            sendContext: {},
            headers: request.headers,
          })
          if (error) throw error
          return result
        }

        // Raw/uncompiled functions (Vitest, CLI scripts) are not split by the TanStack
        // compiler: .handler() only receives the extracted handler without a serverFn,
        // so neither __executeServer nor direct invocation can run the server chain.
        // Invoke the exported handler directly instead.
        throw new Error(
          'executeServerFn requires a compiled server function. In tests/scripts, call the exported handler directly.',
        )
      }

      return fn
    },
  )
}
