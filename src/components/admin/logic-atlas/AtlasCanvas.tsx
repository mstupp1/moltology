import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  type FitViewOptions,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './logic-atlas.css'
import { ruleNeighborhood } from '@/lib/logic-atlas/neighborhood'
import type { AtlasDomain, AtlasRule, LogicAtlas } from '@/lib/logic-atlas/types'
import { DriftDot, FlagIcon, KindTag, StatusTag } from './atlas-ui'

type RuleState = 'normal' | 'dim' | 'neighbor' | 'selected'

type DomainNodeData = { domain: AtlasDomain; dim: boolean; focus: boolean }
type RuleNodeData = { rule: AtlasRule; color: string; state: RuleState }

type DomainLabelData = { domain: AtlasDomain; flagged: number; dim: boolean; hidden: boolean }

type DomainFlowNode = Node<DomainNodeData, 'domain'>
type DomainLabelFlowNode = Node<DomainLabelData, 'domainLabel'>
type RuleFlowNode = Node<RuleNodeData, 'rule'>
type AtlasFlowNode = DomainFlowNode | DomainLabelFlowNode | RuleFlowNode

/**
 * Level of detail by zoom. Overview shows the map as labeled regions with rule
 * tiles, compact shows titles only, and full shows the whole card.
 */
type Lod = 'overview' | 'compact' | 'full'
const OVERVIEW_ZOOM = 0.32
const COMPACT_ZOOM = 0.5

const selectLod = (state: { transform: [number, number, number] }): Lod => {
  const zoom = state.transform[2]
  if (zoom < OVERVIEW_ZOOM) return 'overview'
  if (zoom < COMPACT_ZOOM) return 'compact'
  return 'full'
}

/** Zoom rounded to 0.02 so label sizing re-renders rarely. */
const selectZoomBucket = (state: { transform: [number, number, number] }) =>
  Math.max(0.02, Math.round(state.transform[2] * 50) / 50)

const DomainNode = memo(function DomainNode({ data }: NodeProps<DomainFlowNode>) {
  const { domain } = data
  const lod = useStore(selectLod)
  return (
    <div
      className="atlas-domain chamfer-corner"
      style={{ '--domain': domain.color } as React.CSSProperties}
      data-dim={data.dim}
      data-focus={data.focus}
    >
      {lod === 'overview' ? null : (
        <div className="flex items-start gap-3 px-7 pt-5">
          <span className="mt-2 h-3 w-3 shrink-0 rotate-45" style={{ background: domain.color }} aria-hidden />
          <div className="min-w-0">
            <p
              className={`font-grotesk font-bold uppercase tracking-wider text-[#dfe3e3] ${
                lod === 'compact' ? 'text-[34px] leading-none' : 'text-[22px] leading-tight'
              }`}
            >
              {domain.title}
            </p>
            {lod === 'full' ? <p className="mt-1 truncate text-[12px] text-[#839493]">{domain.summary}</p> : null}
          </div>
        </div>
      )}
    </div>
  )
})

/** Region label drawn above the rule tiles, only in overview. */
const DomainLabelNode = memo(function DomainLabelNode({ data }: NodeProps<DomainLabelFlowNode>) {
  const lod = useStore(selectLod)
  const zoom = useStore(selectZoomBucket)
  if (lod !== 'overview' || data.hidden) return null
  const { domain, flagged } = data
  const titleSize = Math.min(domain.box.height * 0.2, Math.max(28, 17 / zoom))
  return (
    <div
      className="atlas-domain-label flex h-full w-full flex-col items-center justify-center px-6 text-center"
      data-dim={data.dim}
      style={{ '--domain': domain.color } as React.CSSProperties}
    >
      <p
        className="font-grotesk font-bold uppercase leading-[1.05] tracking-wider text-[#f1f5f5]"
        style={{ fontSize: titleSize }}
      >
        {domain.title}
      </p>
      <p className="mt-[0.4em] font-bold uppercase tracking-widest text-[#b9c6c5]" style={{ fontSize: titleSize * 0.42 }}>
        {domain.ruleIds.length} rules
        {flagged > 0 ? <span className="text-[#ffb020]"> · {flagged} flagged</span> : null}
      </p>
    </div>
  )
})

const RuleNode = memo(function RuleNode({ data }: NodeProps<RuleFlowNode>) {
  const { rule, color, state } = data
  const lod = useStore(selectLod)
  return (
    <div
      className="atlas-rule chamfer-corner px-3 py-2.5"
      style={{ '--domain': color } as React.CSSProperties}
      data-state={state}
      data-lod={lod}
      data-flag={rule.flag?.level ?? 'none'}
      data-testid={`atlas-rule-${rule.id}`}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="atlas-rule-body flex items-center justify-between gap-2">
        <KindTag kind={rule.kind} />
        <span className="flex items-center gap-1.5">
          <StatusTag status={rule.status} />
          {rule.flag ? <FlagIcon flag={rule.flag} /> : null}
          <DriftDot drift={rule.drift} />
        </span>
      </div>
      <p className="atlas-rule-title mt-1 font-grotesk text-[14px] font-bold leading-snug text-[#dfe3e3]">
        {rule.title}
      </p>
      <p className="atlas-rule-body atlas-rule-statement mt-1 text-[11.5px] leading-snug text-[#8fa2a1]">
        {rule.statement}
      </p>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  )
})

const NODE_TYPES = { domain: DomainNode, domainLabel: DomainLabelNode, rule: RuleNode }

export interface AtlasCanvasProps {
  atlas: LogicAtlas
  selectedRuleId: string | null
  matches: Set<string> | null
  focusDomain: string | null
  drawerOpen: boolean
  onSelectRule: (ruleId: string | null) => void
}

function fitPadding(drawerOpen: boolean, wide: boolean): NonNullable<FitViewOptions['padding']> {
  return {
    top: '48px',
    bottom: '48px',
    left: '48px',
    right: drawerOpen && wide ? '480px' : '48px',
  }
}

function AtlasCanvasInner({ atlas, selectedRuleId, matches, focusDomain, drawerOpen, onSelectRule }: AtlasCanvasProps) {
  const { fitView } = useReactFlow()
  const containerRef = useRef<HTMLDivElement>(null)

  const domainById = useMemo(() => new Map(atlas.domains.map((domain) => [domain.id, domain])), [atlas])
  const ruleById = useMemo(() => new Map(atlas.rules.map((rule) => [rule.id, rule])), [atlas])

  const neighborhood = useMemo(() => {
    const rule = selectedRuleId ? ruleById.get(selectedRuleId) : undefined
    return rule ? ruleNeighborhood(rule, atlas.edges) : null
  }, [selectedRuleId, ruleById, atlas.edges])

  const nodes = useMemo<AtlasFlowNode[]>(() => {
    const domainNodes: DomainFlowNode[] = atlas.domains.map((domain) => {
      const hasMatch = !matches || domain.ruleIds.some((id) => matches.has(id))
      const inFocus = neighborhood ? domain.ruleIds.some((id) => neighborhood.ruleIds.has(id)) : false
      return {
        id: `domain:${domain.id}`,
        type: 'domain',
        position: { x: domain.box.x, y: domain.box.y },
        width: domain.box.width,
        height: domain.box.height,
        style: { width: domain.box.width, height: domain.box.height },
        data: {
          domain,
          dim: neighborhood ? !inFocus : !hasMatch || (focusDomain !== null && focusDomain !== domain.id),
          focus: inFocus || focusDomain === domain.id,
        },
        selectable: false,
        draggable: false,
        focusable: false,
      }
    })
    const ruleNodes: RuleFlowNode[] = atlas.rules.map((rule) => {
      let state: RuleState = 'normal'
      if (neighborhood) {
        state = rule.id === selectedRuleId ? 'selected' : neighborhood.ruleIds.has(rule.id) ? 'neighbor' : 'dim'
      } else if (matches && !matches.has(rule.id)) {
        state = 'dim'
      }
      return {
        id: rule.id,
        type: 'rule',
        parentId: `domain:${rule.domain}`,
        position: rule.position,
        width: 264,
        height: 104,
        data: { rule, color: domainById.get(rule.domain)?.color ?? '#00c3ff', state },
        draggable: false,
        ariaLabel: `${rule.title}. ${rule.statement}`,
      }
    })
    const labelNodes: DomainLabelFlowNode[] = atlas.domains.map((domain) => ({
      id: `label:${domain.id}`,
      type: 'domainLabel',
      position: { x: domain.box.x, y: domain.box.y },
      width: domain.box.width,
      height: domain.box.height,
      style: { width: domain.box.width, height: domain.box.height, pointerEvents: 'none' },
      data: {
        domain,
        flagged: domain.ruleIds.filter((id) => ruleById.get(id)?.flag).length,
        dim: domainNodes.find((node) => node.id === `domain:${domain.id}`)?.data.dim ?? false,
        hidden: neighborhood !== null,
      },
      selectable: false,
      draggable: false,
      focusable: false,
      zIndex: 20,
    }))
    return [...domainNodes, ...ruleNodes, ...labelNodes]
  }, [atlas, domainById, ruleById, matches, neighborhood, selectedRuleId, focusDomain])

  const edges = useMemo<Edge[]>(
    () =>
      atlas.edges.map((edge) => {
        const classes: string[] = []
        if (edge.crossDomain) classes.push('atlas-edge-cross')
        let active = false
        if (neighborhood) {
          active = neighborhood.edgeIds.has(edge.id)
          classes.push(active ? 'atlas-edge-active' : 'atlas-edge-dim')
        } else if (matches && !(matches.has(edge.source) && matches.has(edge.target))) {
          classes.push('atlas-edge-dim')
        }
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.crossDomain ? 'default' : 'smoothstep',
          className: classes.join(' '),
          animated: active,
          selectable: false,
          focusable: false,
          zIndex: active ? 10 : 0,
        }
      }),
    [atlas.edges, neighborhood, matches],
  )

  const isWide = useCallback(() => (containerRef.current?.clientWidth ?? 0) >= 900, [])

  // Frame the selected rule and its neighbors, leaving room for the drawer.
  useEffect(() => {
    if (!neighborhood) return
    const handle = window.requestAnimationFrame(() => {
      void fitView({
        nodes: [...neighborhood.ruleIds].map((id) => ({ id })),
        duration: 450,
        maxZoom: 1.05,
        // Keep titles readable even when a rule has many neighbors.
        minZoom: COMPACT_ZOOM - 0.04,
        padding: fitPadding(true, isWide()),
      })
    })
    return () => window.cancelAnimationFrame(handle)
  }, [neighborhood, fitView, isWide])

  // Frame a domain when it is picked from the filter chips.
  useEffect(() => {
    if (!focusDomain || neighborhood) return
    const handle = window.requestAnimationFrame(() => {
      void fitView({ nodes: [{ id: `domain:${focusDomain}` }], duration: 450, maxZoom: 0.9, padding: fitPadding(false, true) })
    })
    return () => window.cancelAnimationFrame(handle)
  }, [focusDomain, neighborhood, fitView])

  const onNodeClick = useCallback<NodeMouseHandler<AtlasFlowNode>>(
    (_, node) => {
      if (node.type === 'rule') onSelectRule(node.id === selectedRuleId ? null : node.id)
    },
    [onSelectRule, selectedRuleId],
  )

  const minimapColor = useCallback(
    (node: AtlasFlowNode) => {
      if (node.type === 'rule') return domainById.get(node.data.rule.domain)?.color ?? '#00c3ff'
      if (node.type === 'domain') return 'rgba(18, 32, 40, 0.9)'
      return 'transparent'
    },
    [domainById],
  )

  return (
    <div ref={containerRef} className="h-full w-full" data-testid="atlas-canvas">
      <ReactFlow<AtlasFlowNode>
        className="logic-atlas-flow"
        colorMode="dark"
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelectRule(null)}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onlyRenderVisibleElements
        fitView
        fitViewOptions={{ padding: fitPadding(drawerOpen, true) }}
        minZoom={0.08}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.2} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
          nodeBorderRadius={0}
          ariaLabel="Atlas overview"
          className={drawerOpen ? 'hidden' : ''}
        />
      </ReactFlow>
    </div>
  )
}

export function AtlasCanvas(props: AtlasCanvasProps) {
  return (
    <ReactFlowProvider>
      <AtlasCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
