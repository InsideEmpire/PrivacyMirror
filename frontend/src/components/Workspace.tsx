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
  elevated: 'text-high',
  narrowed: 'text-mid',
  residual: 'text-ok',
  reduced: 'text-ok',
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
      <header className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          PrivacyMirror · Case 014 · {demo.persona}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <RotateCcw size={14} />
          Start over
        </button>
      </header>

      <h1 className="mt-3 max-w-4xl font-serif text-3xl leading-tight text-ink sm:text-4xl" aria-live="polite">
        {scenario.exposure.note}
      </h1>

      <section className="mt-4 flex flex-wrap items-center gap-2">
        {MITIGATIONS.map((mitigation) => {
          const on = enabled.includes(mitigation.id)
          return (
            <button
              key={mitigation.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(mitigation.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                on ? 'border-accent bg-accent text-white' : 'border-line bg-card text-ink hover:border-accent'
              }`}
            >
              {mitigation.title}
            </button>
          )
        })}
        <p className={`text-sm font-semibold ${exposureClass[scenario.exposure.level]}`}>{scenario.exposure.label}</p>
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
