import { demo } from '../data/demo.ts'
import { type ScenarioView } from '../model.ts'

const severityClass = {
  high: 'text-high',
  medium: 'text-mid',
} as const

export function Inspector({
  scenario,
  selectedId,
  onSelect,
}: {
  scenario: ScenarioView
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const findings = [...scenario.findings].sort((a, b) => a.listOrder - b.listOrder)

  return (
    <aside className="flex max-h-[520px] flex-col overflow-hidden rounded-xl border border-line bg-card lg:max-h-[calc(100vh-132px)] lg:min-h-[520px]">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Evidence</h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        <SelectionDetail selectedId={selectedId} scenario={scenario} />

        <section className="space-y-1">
          {findings.map((finding) => {
            const selected = finding.id === selectedId
            return (
              <button
                key={finding.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(finding.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left ${
                  selected ? 'bg-canvas' : 'hover:bg-canvas'
                }`}
              >
                <span className="text-sm font-medium text-ink">{finding.title}</span>
                <span className={`text-xs font-semibold ${severityClass[finding.severity]}`}>
                  {finding.severity === 'high' ? 'High' : 'Medium'}
                </span>
              </button>
            )
          })}
        </section>
      </div>
    </aside>
  )
}

function SelectionDetail({ selectedId, scenario }: { selectedId: string | null; scenario: ScenarioView }) {
  if (!selectedId) {
    return <p className="text-sm text-muted">Click a node to see the source.</p>
  }

  const source = demo.sources.find((item) => item.id === selectedId)
  if (source && scenario.activeIds.has(source.id)) {
    const metadataOff = source.id === 'src-photo' && !scenario.activeIds.has('c-meta')
    return (
      <article>
        <p className="text-xs font-semibold text-ok">
          {source.kind} · {source.label}
        </p>
        <blockquote className="mt-2 border-l-2 border-ink pl-3 text-sm leading-relaxed text-ink">{source.text}</blockquote>
        {(metadataOff || source.hint) && (
          <p className="mt-2 text-sm text-muted">
            {metadataOff ? 'Location metadata removed. Caption stays.' : source.hint}
          </p>
        )}
      </article>
    )
  }

  const claim = demo.claims.find((item) => item.id === selectedId)
  if (claim && scenario.activeIds.has(claim.id)) {
    const quotes = claim.evidenceIds
      .map((id) => demo.sources.find((item) => item.id === id))
      .filter((item) => item !== undefined)
    const parents = claim.requiresAll
      ?.map((id) => demo.claims.find((item) => item.id === id))
      .filter((item) => item !== undefined)

    return (
      <article>
        <p className={`text-xs font-semibold ${claim.status === 'observed' ? 'text-ok' : 'text-mid'}`}>
          {claim.status === 'observed' ? 'Observed' : 'Inferred'} · {claim.label}
        </p>
        {quotes.map((quote) => (
          <blockquote key={quote.id} className="mt-2 border-l-2 border-ok pl-3 text-sm leading-relaxed text-ink">
            {quote.text}
          </blockquote>
        ))}
        {parents && parents.length > 0 && (
          <p className="mt-2 text-sm text-ink">
            From {parents.map((parent) => parent.label).join(' + ')}. {claim.value}
          </p>
        )}
      </article>
    )
  }

  const finding = demo.findings.find((item) => item.id === selectedId)
  if (finding && scenario.activeIds.has(finding.id)) {
    return (
      <article>
        <p className={`text-xs font-semibold ${severityClass[finding.severity]}`}>
          {finding.severity === 'high' ? 'High' : 'Medium'}
        </p>
        <h3 className="mt-1 text-base font-semibold text-ink">{finding.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink">{finding.explanation}</p>
        <p className="mt-2 text-sm font-medium text-ink">{finding.mitigation}</p>
      </article>
    )
  }

  return <p className="text-sm text-muted">Hidden by the current switch.</p>
}
