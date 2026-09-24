import ELK from 'elkjs/lib/elk.bundled.js'
import type { ElkNode } from 'elkjs/lib/elk.bundled.js'

export const RULE_NODE = { width: 264, height: 104 }
export const DOMAIN_PADDING = { top: 76, side: 28, bottom: 28 }
export const DOMAIN_GAP = 96
export const CANVAS_ASPECT = 2.1
export const FLOW_STEP = { width: 208, height: 46 }

const elk = new ELK()

export interface Positioned {
  id: string
  x: number
  y: number
}

/**
 * Lay out one domain's rules. Rules that depend on each other stack in layers;
 * unrelated rules are packed toward a readable aspect ratio.
 */
export async function layoutDomainRules(
  ruleIds: string[],
  edges: { source: string; target: string }[],
): Promise<{ positions: Positioned[]; width: number; height: number }> {
  const graph: ElkNode = {
    id: 'domain',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.aspectRatio': '1.6',
      'elk.separateConnectedComponents': 'true',
      'elk.spacing.componentComponent': '28',
      'elk.spacing.nodeNode': '28',
      'elk.layered.spacing.nodeNodeBetweenLayers': '52',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.padding': '[top=0,left=0,bottom=0,right=0]',
    },
    children: ruleIds.map((id) => ({ id, ...RULE_NODE })),
    edges: edges.map((edge, index) => ({
      id: `e${index}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }
  const result = await elk.layout(graph)
  const positions = (result.children ?? []).map((child) => ({
    id: child.id,
    x: Math.round(child.x ?? 0),
    y: Math.round(child.y ?? 0),
  }))
  const width = Math.max(RULE_NODE.width, ...positions.map((p) => p.x + RULE_NODE.width))
  const height = Math.max(RULE_NODE.height, ...positions.map((p) => p.y + RULE_NODE.height))
  return { positions, width, height }
}

/**
 * Row width whose shelf packing lands closest to a landscape screen shape,
 * with a penalty for empty space. Tries every useful width, so it is exact
 * for the handful of domains the atlas has.
 */
export function targetRowWidth(boxes: { id: string; width: number; height: number }[], aspect = CANVAS_ASPECT): number {
  const widest = Math.max(0, ...boxes.map((box) => box.width))
  const total = boxes.reduce((sum, box) => sum + box.width + DOMAIN_GAP, 0)
  const used = boxes.reduce((sum, box) => sum + box.width * box.height, 0)
  let best = widest
  let bestScore = Number.POSITIVE_INFINITY
  for (let width = widest; width <= total; width += 50) {
    const packed = shelfPack(boxes, width)
    const shape = Math.abs(Math.log(packed.width / packed.height / aspect))
    const waste = 1 - used / (packed.width * packed.height)
    const score = shape + waste
    if (score < bestScore) {
      bestScore = score
      best = width
    }
  }
  return best
}

/** Shelf-pack domain boxes in author order so related domains stay neighbors. */
export function packDomains(
  boxes: { id: string; width: number; height: number }[],
  rowWidth = targetRowWidth(boxes),
): { placements: Positioned[]; width: number; height: number } {
  return shelfPack(boxes, rowWidth)
}

function shelfPack(
  boxes: { id: string; width: number; height: number }[],
  rowWidth: number,
): { placements: Positioned[]; width: number; height: number } {
  const placements: Positioned[] = []
  let x = 0
  let y = 0
  let rowHeight = 0
  let maxWidth = 0
  for (const box of boxes) {
    if (x > 0 && x + box.width > rowWidth) {
      x = 0
      y += rowHeight + DOMAIN_GAP
      rowHeight = 0
    }
    placements.push({ id: box.id, x, y })
    x += box.width + DOMAIN_GAP
    rowHeight = Math.max(rowHeight, box.height)
    maxWidth = Math.max(maxWidth, x - DOMAIN_GAP)
  }
  return { placements, width: maxWidth, height: y + rowHeight }
}

/** Lay out a rule's flow diagram top to bottom. */
export async function layoutFlow(
  stepIds: string[],
  links: { id: string; source: string; target: string; label: string | null }[],
): Promise<{ positions: Positioned[]; width: number; height: number }> {
  const graph: ElkNode = {
    id: 'flow',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.spacing.nodeNode': '24',
      'elk.layered.spacing.nodeNodeBetweenLayers': '40',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.edgeLabels.inline': 'true',
      'elk.padding': '[top=0,left=0,bottom=0,right=0]',
    },
    children: stepIds.map((id) => ({ id, ...FLOW_STEP })),
    edges: links.map((link) => ({
      id: link.id,
      sources: [link.source],
      targets: [link.target],
      labels: link.label ? [{ text: link.label, width: link.label.length * 7 + 12, height: 16 }] : [],
    })),
  }
  const result = await elk.layout(graph)
  const positions = (result.children ?? []).map((child) => ({
    id: child.id,
    x: Math.round(child.x ?? 0),
    y: Math.round(child.y ?? 0),
  }))
  return {
    positions,
    width: Math.max(...positions.map((p) => p.x + FLOW_STEP.width)),
    height: Math.max(...positions.map((p) => p.y + FLOW_STEP.height)),
  }
}
