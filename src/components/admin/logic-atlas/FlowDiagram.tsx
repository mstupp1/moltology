import React, { memo, useMemo } from 'react'
import {
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import type { AtlasFlow, AtlasFlowStep } from '@/lib/logic-atlas/types'

type StepNode = Node<{ step: AtlasFlowStep }, 'step'>

const FlowStepNode = memo(function FlowStepNode({ data }: NodeProps<StepNode>) {
  const { step } = data
  return (
    <div className="atlas-flow-step" data-kind={step.kind} data-tone={step.tone}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      {step.label}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  )
})

const NODE_TYPES = { step: FlowStepNode }

/**
 * Read-only step diagram for a flow rule. Layout is precomputed by the sync
 * script. `preview` fits a small frame; `full` fills its parent and can zoom.
 */
export function FlowDiagram({ flow, mode = 'preview' }: { flow: AtlasFlow; mode?: 'preview' | 'full' }) {
  const full = mode === 'full'
  const nodes = useMemo<StepNode[]>(
    () =>
      flow.steps.map((step) => ({
        id: step.id,
        type: 'step',
        position: step.position,
        width: step.width,
        height: step.height,
        data: { step },
        draggable: false,
        selectable: false,
      })),
    [flow],
  )
  const edges = useMemo<Edge[]>(
    () =>
      flow.links.map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
        label: link.label ?? undefined,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: 'rgba(159, 179, 178, 0.7)' },
        style: { stroke: 'rgba(159, 179, 178, 0.55)' },
        labelStyle: { fontSize: 10, fill: '#9fb3b2', fontWeight: 600 },
        labelBgPadding: [4, 2] as [number, number],
        selectable: false,
      })),
    [flow],
  )
  const height = full ? '100%' : Math.min(340, Math.max(200, Math.round(flow.height * 0.4) + 24))

  return (
    <div
      className={`logic-atlas-flow ${full ? '' : 'pointer-events-none'} border border-[#243233]`}
      style={{ height }}
      data-testid={full ? 'atlas-flow-full' : 'atlas-flow-diagram'}
    >
      <ReactFlowProvider>
        <ReactFlow
          colorMode="dark"
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: full ? 0.12 : 0.06, maxZoom: 1.1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={full}
          panOnScroll={false}
          zoomOnScroll={full}
          zoomOnPinch={full}
          preventScrolling={full}
          zoomOnDoubleClick={false}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        />
      </ReactFlowProvider>
    </div>
  )
}
