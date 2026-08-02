import { runWithStartContext } from '@tanstack/start-storage-context'

/**
 * Helper to execute a TanStack Start server function within a request context.
 * Runs the full middleware chain (validators, auth, RLS-scoped db injection) and
 * returns the handler result. Intended for server-side callers (SSR handlers,
 * CLI scripts) and Vitest test environments. This module is server-only and must
 * not be statically imported from client code.
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
        // createServerFn handlers expose a server-side executor that runs the full
        // middleware chain and returns the handler result.
        if (typeof fn.__executeServer === 'function') {
          const { result, error } = await fn.__executeServer({
            data,
            context: {},
            sendContext: {},
            headers: request.headers,
          })
          if (error) throw error
          return result
        }

        return await fn({ data, request })
      }

      return fn
    },
  )
}
