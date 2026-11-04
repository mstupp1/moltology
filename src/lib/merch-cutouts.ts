/**
 * Transparent product cutouts for product cards (store grid, related items and dashboard Store panel), shown on a
 * brand benthic-border surface (#3a4a49), keeping dark silhouettes visible.
 * The main product gallery and cart keep the catalog photos.
 */
export const MERCH_CUTOUTS: Record<string, { src: string; alt: string; background: string }> = {
  'moltology-hoodie': {
    src: 'images/merch/dashboard/2026-11-04/moltology-hoodie-v1.png',
    alt: 'Black Moltology pullover hoodie with a small red left chest emblem',
    background: 'bg-benthic-border',
  },
  'moltology-tote': {
    src: 'images/merch/dashboard/2026-11-04/moltology-tote-v1.png',
    alt: 'Black Moltology tote with a red emblem and white wordmark',
    background: 'bg-benthic-border',
  },
  'moltology-hat': {
    src: 'images/merch/dashboard/2026-10-22/moltology-hat-v1.png',
    alt: 'Black Moltology dad hat with red embroidered emblem',
    background: 'bg-benthic-border',
  },
  'moltology-desk-mat': {
    src: 'images/merch/dashboard/2026-10-22/moltology-desk-mat-v1.png',
    alt: 'Dark Moltology desk mat with depth contours',
    background: 'bg-benthic-border',
  },
  'moltology-mug': {
    src: 'images/merch/dashboard/2026-10-21/moltology-mug-v2.png',
    alt: 'White Moltology mug with red emblem',
    background: 'bg-benthic-border',
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
