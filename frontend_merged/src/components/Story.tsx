import { ArrowRight, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AuthorizedSubject } from '../App.tsx'
import { demo } from '../data/demo.ts'

const bio = demo.sources.find((source) => source.id === 'src-bio')
const eventPost = demo.sources.find((source) => source.id === 'src-event')
const note = demo.sources.find((source) => source.id === 'src-note')
const photoSource = demo.sources.find((source) => source.id === 'src-photo')

type FieldKey = 'name' | 'bio' | 'event' | 'note'
type Phase = 'idle' | 'typing' | 'photo' | 'ready' | 'running'

const runSteps = ['Language', 'Vision', 'Metadata', 'Link']

function PlantStill() {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <rect width="320" height="180" fill="#f3ecdf" />
      <rect y="128" width="320" height="52" fill="#e7d7be" />
      <rect x="124" y="104" width="72" height="34" rx="5" fill="#b08968" />
      <rect x="132" y="98" width="56" height="10" rx="3" fill="#d8c09a" />
      <path d="M160 104 C156 70 140 54 124 40" fill="none" stroke="#1f6b45" strokeWidth="3" />
      <path d="M160 104 C166 64 188 50 208 34" fill="none" stroke="#2f8a58" strokeWidth="3" />
      <path d="M160 102 C170 74 162 52 174 32" fill="none" stroke="#67a67a" strokeWidth="2.5" />
      <ellipse cx="122" cy="42" rx="16" ry="7" transform="rotate(-30 122 42)" fill="#1f6b45" />
      <ellipse cx="210" cy="36" rx="18" ry="7" transform="rotate(22 210 36)" fill="#2f8a58" />
      <ellipse cx="176" cy="30" rx="12" ry="6" transform="rotate(8 176 30)" fill="#8fb89a" />
    </svg>
  )
}

function Field({
  label,
  value,
  active,
  tall,
}: {
  label: string
  value: string
  active: boolean
  tall?: boolean
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">{label}</span>
      <div
        className={`mt-1.5 rounded-xl border bg-card px-3 py-2.5 text-sm leading-relaxed text-ink shadow-sm ${
          active ? 'border-accent' : 'border-line'
        } ${tall ? 'min-h-20' : 'min-h-11'}`}
      >
        {value}
        {active && <span className="caret" />}
        {!value && !active && <span className="text-muted">Waiting</span>}
      </div>
    </label>
  )
}

export function Story({ onOpen }: { onOpen: (subject: AuthorizedSubject) => void }) {
  const [consented, setConsented] = useState(false)
  const [subjectName, setSubjectName] = useState(demo.persona)
  const [phase, setPhase] = useState<Phase>('idle')
  const [values, setValues] = useState<Record<FieldKey, string>>({ name: '', bio: '', event: '', note: '' })
  const [activeKey, setActiveKey] = useState<FieldKey | null>(null)
  const [photo, setPhoto] = useState(0)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (phase !== 'typing') return
    let cancelled = false
    const script = [
      { key: 'name', text: subjectName },
      { key: 'bio', text: bio?.text ?? '' },
      { key: 'event', text: eventPost?.text ?? '' },
      { key: 'note', text: note?.text ?? '' },
    ] as const
    async function typeSources() {
      for (const item of script) {
        setActiveKey(item.key)
        for (let index = 1; index <= item.text.length; index += 1) {
          if (cancelled) return
          const next = item.text.slice(0, index)
          setValues((current) => ({ ...current, [item.key]: next }))
          await new Promise((resolve) => window.setTimeout(resolve, 14))
        }
      }
      if (cancelled) return
      setActiveKey(null)
      setPhase('photo')
    }
    void typeSources()
    return () => {
      cancelled = true
    }
  }, [phase, subjectName])

  useEffect(() => {
    if (phase !== 'photo') return
    if (photo >= 100) {
      const timer = window.setTimeout(() => setPhase('ready'), 0)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setPhoto((current) => Math.min(100, current + 10)), 45)
    return () => window.clearTimeout(timer)
  }, [phase, photo])

  useEffect(() => {
    if (phase !== 'running') return
    if (step < runSteps.length) {
      const timer = window.setTimeout(() => setStep((current) => current + 1), 520)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => onOpen({ name: subjectName.trim() }), 420)
    return () => window.clearTimeout(timer)
  }, [onOpen, phase, step, subjectName])

  const busy = phase === 'typing' || phase === 'photo' || phase === 'running'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between">
        <p className="font-serif text-xl text-ink">PrivacyMirror</p>
        <p className="text-sm text-muted">Sample export · fictional student · no web search</p>
      </header>

      <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="story-beat">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">Intake</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-ink">Enter what was already posted.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Language, the picture, and the file tag are typed in as separate sources. The read only starts after they are on the page.
          </p>
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">Authorized name</span>
              <input
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                autoComplete="name"
              />
            </label>
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#143d34]"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
            />
            <span>Fictional person. Inferences are not facts. I will only analyze material I am allowed to use.</span>
          </label>
          <button
            type="button"
            disabled={!consented || !subjectName.trim() || busy || phase === 'ready'}
            onClick={() => setPhase('typing')}
            className="mt-5 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            {phase === 'idle' ? 'Type the sample export' : 'Entering sources'}
          </button>
          <button
            type="button"
            disabled={phase !== 'ready'}
            onClick={() => {
              setStep(0)
              setPhase('running')
            }}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-accent disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
          >
            Run multimodal read
            <ArrowRight size={16} />
          </button>
        </aside>

        <section className="story-beat grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-3">
            <Field label="Subject" value={values.name} active={activeKey === 'name'} />
            <Field label="Profile · language" value={values.bio} active={activeKey === 'bio'} tall />
            <Field label="Friday post · language" value={values.event} active={activeKey === 'event'} tall />
            <Field label="Weekend note · language" value={values.note} active={activeKey === 'note'} tall />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">Photo · vision + metadata</p>
            <div className={`mt-1.5 overflow-hidden rounded-xl border bg-card shadow-sm ${photo > 0 ? 'border-accent' : 'border-dashed border-line'}`}>
              <div className="h-36 bg-[#f3ecdf]">
                {photo >= 100 ? <PlantStill /> : null}
              </div>
              <div className="px-3 py-2.5 text-sm text-ink">
                {photo === 0 && <span className="text-muted">No file yet</span>}
                {photo > 0 && photo < 100 && <span>Receiving image… {photo}%</span>}
                {photo >= 100 && <span>{photoSource?.text}</span>}
              </div>
            </div>
            {phase === 'running' && (
              <ul className="mt-4 space-y-2">
                {runSteps.map((label, index) => {
                  const done = step > index
                  return (
                    <li key={label} className="flex items-center gap-2 text-sm text-ink">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? 'bg-accent text-white' : 'bg-line text-muted'}`}>
                        {done ? <Check size={12} /> : index + 1}
                      </span>
                      {label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
