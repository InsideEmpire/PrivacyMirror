import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { demo } from '../data/demo.ts'

export function Landing({ onStart }: { onStart: () => void }) {
  const [consented, setConsented] = useState(false)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <header className="text-sm font-semibold text-ink">PrivacyMirror</header>

      <main className="mt-16">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Ordinary posts, read together.</h1>
        <p className="mt-3 text-base text-muted">
          Four posts from {demo.persona}, a fictional student. Two switches break the risky path.
        </p>

        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
          {demo.sources.map((source) => (
            <li key={source.id} className="flex items-baseline gap-3 px-4 py-3">
              <span className="w-16 shrink-0 text-xs font-semibold text-ok">{source.kind}</span>
              <span className="text-sm text-ink">{source.short}</span>
            </li>
          ))}
        </ul>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[#1a1814]"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
          />
          <span>Fictional demo. Inferences are not facts. I will only check information I am allowed to use.</span>
        </label>

        <button
          type="button"
          disabled={!consented}
          onClick={() => {
            if (consented) onStart()
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          Try the demo
          <ArrowRight size={16} />
        </button>
      </main>
    </div>
  )
}
