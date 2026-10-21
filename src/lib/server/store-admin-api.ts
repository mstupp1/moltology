import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { publicMiddleware } from './functions'
const auth = z.object({ token: z.string().optional(), userId: z.string().optional() })
export const getAdminStoreFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.parse(data))
  .handler(async args => (await import('./store-operations')).getAdminStore(args))
export const mutateAdminStoreFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.extend({ action: z.enum(['settings','availability','retry','reconcile']), target: z.string().max(100).optional(), value: z.unknown().optional() }).parse(data))
  .handler(async args => (await import('./store-operations')).mutateAdminStore(args))
export const listAdminShopOrdersFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.extend({ query: z.string().max(100).optional(), filter: z.enum(['attention','paid','all']).optional(), includeTest: z.boolean().optional() }).parse(data))
  .handler(async args => (await import('./store-operations')).listAdminShopOrders(args))
export const listAdminStoreCouponsFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.parse(data))
  .handler(async args => {
    await (await import('./admin-oversight')).requireStaff(args)
    return (await import('./store-coupons')).listStoreCoupons()
  })
export const mutateAdminStoreCouponFn = createServerFn({ method: 'POST' })
  .middleware(publicMiddleware)
  .validator((data: unknown) => auth.extend({ action: z.enum(['create', 'activate', 'deactivate']), id: z.string().regex(/^promo_[A-Za-z0-9]+$/).optional(), coupon: z.unknown().optional() }).parse(data))
  .handler(async args => {
    const actor = await (await import('./admin-oversight')).requireStaff(args)
    const coupons = await import('./store-coupons')
    const { getDb } = await import('../../db')
    const { storeAudit } = await import('../../db/schema')
    const { action, id } = args.data
    let target = id ?? ''
    if (action === 'create') {
      const { storeCouponCreateSchema } = await import('../store-coupons')
      const parsed = storeCouponCreateSchema.safeParse(args.data.coupon)
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Check the coupon details.')
      const created = await coupons.createStoreCoupon(parsed.data)
      target = created.id
    } else {
      if (!id) throw new Error('Choose a code.')
      await coupons.setStoreCouponActive(id, action === 'activate')
    }
    await getDb().insert(storeAudit).values({ id: crypto.randomUUID(), actor: actor.userId, action: `coupon-${action}`, target, detail: { coupon: args.data.coupon ?? null } })
    return { ok: true }
  })
