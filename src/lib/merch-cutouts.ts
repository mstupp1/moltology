/**
 * Transparent product cutouts for product cards (store grid and dashboard Store panel), shown on a
 * tinted square. The product page and cart keep the catalog photos.
 */
export const MERCH_CUTOUTS: Record<string, { src: string; alt: string; background: string }> = {
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
MERCH_CUTOUTS['moltology-mug-v2'] = MERCH_CUTOUTS['moltology-mug']
MERCH_CUTOUTS['moltology-tee-v2'] = MERCH_CUTOUTS['moltology-tee']
