export type MitigationId = 'strip-exif' | 'delay-events'

export interface Mitigation {
  id: MitigationId
  title: string
  detail: string
}

export const MITIGATIONS: Mitigation[] = [
  {
    id: 'strip-exif',
    title: 'Strip photo location',
    detail: 'Keep the photo. Remove place metadata.',
  },
  {
    id: 'delay-events',
    title: 'Delay the Friday post',
    detail: 'Share the fair after it happens.',
  },
]

export interface DemoSource {
  id: string
  kind: 'Profile' | 'Post' | 'Photo'
  label: string
  text: string
  short: string
  modality: 'Language' | 'Vision'
  vision?: string[]
  hint?: string
  columnOrder: number
  hiddenBy?: MitigationId[]
}

export interface DemoClaim {
  id: string
  label: string
  value: string
  status: 'observed' | 'inferred'
  confidence: 'high' | 'medium'
  evidenceIds: string[]
  requiresAll?: string[]
  droppedBy?: MitigationId[]
  columnOrder: number
}

export interface DemoFinding {
  id: string
  title: string
  severity: 'medium' | 'high'
  claimIds: string[]
  explanation: string
  mitigation: string
  mitigationId?: MitigationId
  columnOrder: number
  listOrder: number
}

export interface DemoEdge {
  source: string
  target: string
  relation: 'supports' | 'contributes_to'
}

export interface DemoData {
  persona: string
  birthDate: string
  role: string
  sources: DemoSource[]
  claims: DemoClaim[]
  findings: DemoFinding[]
  edges: DemoEdge[]
}

export interface Exposure {
  level: 'elevated' | 'narrowed' | 'residual' | 'reduced'
  label: string
  note: string
}

export interface ScenarioView {
  sources: DemoSource[]
  claims: DemoClaim[]
  findings: DemoFinding[]
  edges: DemoEdge[]
  activeIds: Set<string>
  removedFindings: DemoFinding[]
  exposure: Exposure
}

export function assertDemoIntegrity(data: DemoData): void {
  const sourceIds = new Set(data.sources.map((source) => source.id))
  const claimIds = new Set(data.claims.map((claim) => claim.id))
  const findingIds = new Set(data.findings.map((finding) => finding.id))
  const nodeIds = new Set([...sourceIds, ...claimIds, ...findingIds])

  for (const claim of data.claims) {
    if (claim.status === 'observed') {
      if (claim.evidenceIds.length === 0) {
        throw new Error(`${claim.id} has no source`)
      }
      for (const id of claim.evidenceIds) {
        if (!sourceIds.has(id)) {
          throw new Error(`${claim.id} cites a missing source ${id}`)
        }
      }
    } else if (!claim.requiresAll?.length) {
      throw new Error(`${claim.id} is inferred without the claims it depends on`)
    } else {
      for (const id of claim.requiresAll) {
        if (!claimIds.has(id)) {
          throw new Error(`${claim.id} depends on a missing claim ${id}`)
        }
      }
    }
  }

  for (const finding of data.findings) {
    if (finding.claimIds.length === 0) {
      throw new Error(`${finding.id} has no claims`)
    }
    for (const id of finding.claimIds) {
      if (!claimIds.has(id)) {
        throw new Error(`${finding.id} cites a missing claim ${id}`)
      }
    }
  }

  for (const edge of data.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Dangling edge ${edge.source} -> ${edge.target}`)
    }
  }

  if (findingIds.size !== data.findings.length) {
    throw new Error('Duplicate finding ids')
  }
}

export function exposureFor(findings: DemoFinding[]): Exposure {
  if (findings.some((finding) => finding.severity === 'high')) {
    return {
      level: 'elevated',
      label: 'Elevated',
      note: 'Friday, 1–5. Alex is away, phone in the bag, roommate gone.',
    }
  }
  if (findings.length > 1) {
    return {
      level: 'narrowed',
      label: 'Narrowed',
      note: 'The Friday story breaks. The photo still has a location tag.',
    }
  }
  if (findings.length === 1) {
    return {
      level: 'residual',
      label: 'Residual',
      note: 'Only the weekday café habit is still public.',
    }
  }
  return {
    level: 'reduced',
    label: 'Reduced',
      note: 'Nothing left in this simulation.',
  }
}

export function resolveScenario(data: DemoData, enabled: readonly MitigationId[]): ScenarioView {
  const enabledSet = new Set(enabled)
  const sourceById = new Map(data.sources.map((source) => [source.id, source]))
  const claimById = new Map(data.claims.map((claim) => [claim.id, claim]))

  const sourceActive = (source: DemoSource) => !source.hiddenBy?.some((id) => enabledSet.has(id))

  const claimActive = (claim: DemoClaim, stack: Set<string>): boolean => {
    if (stack.has(claim.id) || claim.droppedBy?.some((id) => enabledSet.has(id))) {
      return false
    }
    const next = new Set(stack)
    next.add(claim.id)
    if (claim.requiresAll?.length) {
      return claim.requiresAll.every((id) => {
        const required = claimById.get(id)
        return required ? claimActive(required, next) : false
      })
    }
    return claim.evidenceIds.some((id) => {
      const source = sourceById.get(id)
      return source ? sourceActive(source) : false
    })
  }

  const sources = data.sources.filter(sourceActive)
  const claims = data.claims.filter((claim) => claimActive(claim, new Set()))
  const activeClaimIds = new Set(claims.map((claim) => claim.id))
  const findings = data.findings.filter((finding) =>
    finding.claimIds.every((id) => activeClaimIds.has(id)),
  )
  const activeIds = new Set<string>([
    ...sources.map((source) => source.id),
    ...claims.map((claim) => claim.id),
    ...findings.map((finding) => finding.id),
  ])
  const findingIds = new Set(findings.map((finding) => finding.id))

  return {
    sources,
    claims,
    findings,
    edges: data.edges.filter((edge) => activeIds.has(edge.source) && activeIds.has(edge.target)),
    activeIds,
    removedFindings: data.findings.filter((finding) => !findingIds.has(finding.id)),
    exposure: exposureFor(findings),
  }
}

export function inferencesUsing(claimId: string, data: DemoData) {
  return data.claims.filter((claim) => claim.requiresAll?.includes(claimId))
}
