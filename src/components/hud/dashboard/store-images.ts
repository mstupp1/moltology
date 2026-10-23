/** Dashboard-only cutouts. Keep official catalog, cart and product-page photos unchanged. */
export const DASHBOARD_STORE_IMAGES: Record<string, { src: string; alt: string; background: string }> = {
  'moltology-hat': {
    src: 'images/merch/dashboard/2026-10-22/moltology-hat-v1.png',
    alt: 'Black Moltology dad hat with red embroidered emblem',
    background: 'bg-surface-3',
  },
  'moltology-desk-mat': {
    src: 'images/merch/dashboard/2026-10-22/moltology-desk-mat-v1.png',
    alt: 'Dark Moltology desk mat with depth contours',
    background: 'bg-surface-3',
  },
  'moltology-mug': {
    src: 'images/merch/dashboard/2026-10-21/moltology-mug-v2.png',
    alt: 'White Moltology mug with red emblem',
    background: 'bg-surface-3',
  },
  'moltology-tee': {
    src: 'images/merch/dashboard/2026-10-21/moltology-tee-v2.png',
    alt: 'Black Moltology tee, front',
    background: 'bg-benthic-border',
  },
}

// Existing DB rows may retain their earlier URLs until the catalog slug update runs.
DASHBOARD_STORE_IMAGES['moltology-mug-v2'] = DASHBOARD_STORE_IMAGES['moltology-mug']
DASHBOARD_STORE_IMAGES['moltology-tee-v2'] = DASHBOARD_STORE_IMAGES['moltology-tee']
