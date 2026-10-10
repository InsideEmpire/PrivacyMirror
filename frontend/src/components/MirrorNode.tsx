import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

export type MirrorNodeData = {
  kind: 'source' | 'claim' | 'finding'
  kicker: string
  title: string
  detail?: string
  badge?: string
  accent: string
}

export type MirrorNodeType = Node<MirrorNodeData, 'mirror'>

export function MirrorNode({ data, selected }: NodeProps<MirrorNodeType>) {
  return (
    <div
      className={`mirror-node w-[210px] rounded-lg border bg-card px-3 py-2 text-left ${
        selected ? 'border-ink shadow-sm' : 'border-line'
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: data.accent }}
    >
      {data.kind !== 'source' && <Handle type="target" position={Position.Left} isConnectable={false} />}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold" style={{ color: data.accent }}>
          {data.kicker}
        </span>
        {data.badge && (
          <span className="text-[11px] font-semibold" style={{ color: data.accent }}>
            {data.badge}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-sm font-semibold leading-snug text-ink">{data.title}</div>
      {data.detail && <p className="mt-0.5 text-[13px] leading-snug text-muted">{data.detail}</p>}
      {data.kind !== 'finding' && <Handle type="source" position={Position.Right} isConnectable={false} />}
    </div>
  )
}
