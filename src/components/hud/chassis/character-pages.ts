/**
 * The Character tabs' page chunks. Each tab route lazy-loads its own; the /character layout
 * warms the other two once the page is idle, so switching tabs never waits on a download.
 */
export const loadCustomizePage = () => import('@/components/hud/chassis/ChassisStatusPage')
export const loadShopPage = () => import('@/components/hud/market/MarketShopPage')
export const loadProgressPage = () => import('@/components/hud/PipelineView')
