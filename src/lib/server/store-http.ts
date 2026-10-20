
export async function handlePrintfulWebhookRequest(request: Request): Promise<Response> {
    const { secretMatches, limitStoreRequest } = await import('@/lib/server/store')
    // Printful v1 supports a configured HTTPS URL, but does not sign callback bodies.
    // A random URL bearer secret authenticates the trigger; API reads authenticate every fact.
    if (!secretMatches(new URL(request.url).searchParams.get('key'), process.env.PRINTFUL_WEBHOOK_SECRET)) return new Response('Unauthorized', { status: 401 })
    if (Number(request.headers.get('content-length') || 0) > 65536) return new Response('Too large', { status: 413 })
    const raw = await request.text()
    if (raw.length > 65536) return new Response('Too large', { status: 413 })
    let body: any
    try { body = JSON.parse(raw) } catch { return new Response('Invalid JSON', { status: 400 }) }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response('Invalid payload', { status: 400 })
    if (String(body.store) !== process.env.PRINTFUL_STORE_ID) return new Response('Unknown store', { status: 400 })
    const remoteId = String(body.data?.order?.id ?? body.data?.order_id ?? '')
    if (!/^\d+$/.test(remoteId)) return new Response('Invalid order', { status: 400 })
    const { getDb } = await import('@/db')
    const { merchOrders } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const [order] = await getDb().select({ id: merchOrders.id }).from(merchOrders).where(eq(merchOrders.printfulOrderId, remoteId)).limit(1)
    if (!order) return Response.json({ received: true, ignored: true })
    try {
      await limitStoreRequest(`callback:${order.id}`, 60)
      await (await import('@/lib/server/store-operations')).reconcileStoreOrder(order.id)
      return Response.json({ received: true })
    } catch { return Response.json({ error: 'Could not reconcile order.' }, { status: 503 }) }
}

export async function handleStoreRecoveryRequest(request: Request): Promise<Response> {
    const { secretMatches } = await import('@/lib/server/store')
    if (!secretMatches(request.headers.get('authorization')?.replace(/^Bearer /, '') ?? null, process.env.STORE_RECOVERY_SECRET)) return new Response('Unauthorized', { status: 401 })
    try { return Response.json(await (await import('@/lib/server/store-operations')).recoverStore()) }
    catch { return Response.json({ error: 'Store recovery failed.' }, { status: 500 }) }
}
