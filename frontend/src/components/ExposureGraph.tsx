import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import { useEffect } from 'react'
import '@xyflow/react/dist/style.css'
import type { ScenarioView } from '../model.ts'
import { MirrorNode, type MirrorNodeData, type MirrorNodeType } from './MirrorNode.tsx'

const nodeTypes: NodeTypes = { mirror: MirrorNode }
const columnX = { source: 0, claim: 280, finding: 560 }
const rowGap = 108

function FitView({ signature }: { signature: string }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const run = () => {
      void fitView({ padding: 0.16, duration: 280 })
    }
    const timer = window.setTimeout(run, 40)
    window.addEventListener('resize', run)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', run)
    }
  }, [fitView, signature])
  return null
}

function columnNodes(
  items: { id: string; columnOrder: number; data: MirrorNodeData }[],
  kind: keyof typeof columnX,
  selectedId: string | null,
): MirrorNodeType[] {
  return [...items]
    .sort((a, b) => a.columnOrder - b.columnOrder)
    .map((item, index) => ({
      id: item.id,
      type: 'mirror',
      position: { x: columnX[kind], y: index * rowGap },
      data: item.data,
      selected: item.id === selectedId,
      draggable: false,
      connectable: false,
    }))
}

export function ExposureGraph({
  scenario,
  stage,
  selectedId,
  photoNote,
  onSelect,
}: {
  scenario: ScenarioView
  stage: number
  selectedId: string | null
  photoNote: string | null
  onSelect: (id: string | null) => void
}) {
  const sources = stage >= 1 ? scenario.sources : []
  const claims = stage >= 2 ? scenario.claims : []
  const findings = stage >= 3 ? scenario.findings : []
  const visibleIds = new Set<string>([
    ...sources.map((source) => source.id),
    ...claims.map((claim) => claim.id),
    ...findings.map((finding) => finding.id),
  ])

  const nodes: MirrorNodeType[] = [
    ...columnNodes(
      sources.map((source) => ({
        id: source.id,
        columnOrder: source.columnOrder,
        data: {
          kind: 'source',
          kicker: source.kind,
          title: source.label,
          detail: source.id === 'src-photo' && photoNote ? photoNote : source.short,
          accent: '#4e493f',
        },
      })),
      'source',
      selectedId,
    ),
    ...columnNodes(
      claims.map((claim) => ({
        id: claim.id,
        columnOrder: claim.columnOrder,
        data: {
          kind: 'claim',
          kicker: claim.status === 'observed' ? 'Observed' : 'Inferred',
          title: claim.label,
          accent: claim.status === 'observed' ? '#0c6b52' : '#8a5a00',
        },
      })),
      'claim',
      selectedId,
    ),
    ...columnNodes(
      findings.map((finding) => ({
        id: finding.id,
        columnOrder: finding.columnOrder,
        data: {
          kind: 'finding',
          kicker: 'Finding',
          title: finding.title,
          badge: finding.severity === 'high' ? 'High' : 'Medium',
          accent: finding.severity === 'high' ? '#9f1d14' : '#8a5a00',
        },
      })),
      'finding',
      selectedId,
    ),
  ]

  const edges: Edge[] = (stage >= 3 ? scenario.edges : [])
    .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
    .map((edge) => {
      const related = selectedId !== null && (edge.source === selectedId || edge.target === selectedId)
      const color = related ? '#143d34' : '#8a8175'
      return {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: related,
        style: { stroke: color, strokeWidth: related ? 2 : 1.25 },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      }
    })

  const signature = `${stage}:${nodes.map((node) => node.id).join(',')}`

  return (
    <div className="h-[480px] overflow-hidden rounded-2xl border border-line bg-[#f7f4ee] shadow-sm lg:h-[calc(100vh-220px)] lg:min-h-[480px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        colorMode="light"
        fitView
        minZoom={0.35}
        maxZoom={1.35}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.1} color="#ddd4c6" />
        <Controls showInteractive={false} />
        <FitView signature={signature} />
        <Panel position="top-left">
          <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold shadow-sm">
            <span className="text-muted">Posts</span>
            <span className="text-ok">Observed</span>
            <span className="text-mid">Inferred</span>
            <span className="text-high">Finding</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
