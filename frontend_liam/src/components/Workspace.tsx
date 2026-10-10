import { RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { demo } from '../data/demo.ts'
import { MITIGATIONS, resolveScenario, type MitigationId } from '../model.ts'
import { ExposureGraph } from './ExposureGraph.tsx'
import { Inspector } from './Inspector.tsx'

function initialStage() {
  if (typeof window === 'undefined') return 0
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 3 : 0
}

const exposureClass = {
  elevated: 'bg-[#fde8e6] text-high',
  narrowed: 'bg-[#fff4d6] text-mid',
  residual: 'bg-[#e5f6f0] text-ok',
  reduced: 'bg-[#e5f6f0] text-ok',
} as const

export function Workspace({ onReset }: { onReset: () => void }) {
  const [enabled, setEnabled] = useState<MitigationId[]>([])
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [stage, setStage] = useState(initialStage)
  const scenario = useMemo(() => resolveScenario(demo, enabled), [enabled])
  const selectedId = pickedId && scenario.activeIds.has(pickedId) ? pickedId : null

  useEffect(() => {
    if (initialStage() === 3) return
    const timers = [180, 700, 1250].map((delay, index) =>
      window.setTimeout(() => setStage(index + 1), delay),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  function toggle(id: MitigationId) {
    setEnabled((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 py-3 sm:px-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-ink">PrivacyMirror</p>
          <h1 className="text-sm text-muted">{demo.persona} · fictional · no web search</h1>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <RotateCcw size={14} />
          Start over
        </button>
      </header>

      <section className="mt-3 flex flex-wrap items-center gap-2">
        {MITIGATIONS.map((mitigation) => {
          const on = enabled.includes(mitigation.id)
          return (
            <button
              key={mitigation.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(mitigation.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                on ? 'border-ink bg-ink text-white' : 'border-line bg-card text-ink hover:border-ink'
              }`}
            >
              {mitigation.title}
            </button>
          )
        })}
        <p
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${exposureClass[scenario.exposure.level]}`}
          aria-live="polite"
        >
          {scenario.exposure.label}
          <span className="ml-2 font-medium">{scenario.exposure.note}</span>
        </p>
      </section>

      <div className="mt-3 grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ExposureGraph
          scenario={scenario}
          stage={stage}
          selectedId={selectedId}
          photoNote={enabled.includes('strip-exif') ? 'Plant photo, location removed' : null}
          onSelect={setPickedId}
        />
        <Inspector scenario={scenario} selectedId={selectedId} onSelect={setPickedId} />
      </div>
    </div>
  )
}
