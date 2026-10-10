import { useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowRight, Check, Clock3, Expand, FileText, GitBranch, LockKeyhole, RotateCcw, Shield, ShieldCheck, Sparkles } from 'lucide-react'
import type { AnalysisReport, ExposureFinding } from '../analyze.ts'
import './MirrorStage.css'

interface Props {
  report: AnalysisReport
  visibleFindings: ExposureFinding[]
  selectedFinding: string | null
  activeMitigations: string[]
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onCompare: () => void
  presenting: boolean
  onPresent: () => void
}

const controls = [
  { id: 'delay', label: 'Delay posts', icon: Clock3 },
  { id: 'routine', label: 'Hide routine', icon: Shield },
  { id: 'metadata', label: 'Strip metadata', icon: LockKeyhole },
]

export function MirrorStage({ report, visibleFindings, selectedFinding, activeMitigations, onSelect, onToggle, onCompare, presenting, onPresent }: Props) {
  const [replay, setReplay] = useState(0)
  const actionable = report.findings.filter((finding) => finding.mitigation)
  const remaining = visibleFindings.filter((finding) => finding.mitigation).length
  const protectedCount = actionable.length - remaining
  const sources = report.sourceSnippets.slice(0, 5)
  const findings = report.findings.slice(0, 4)
  const links = sources.flatMap((source, sourceIndex) => findings.flatMap((finding, findingIndex) =>
    finding.evidence && (finding.evidence.includes(source) || source.includes(finding.evidence))
      ? [{ sourceIndex, findingIndex, finding }]
      : [],
  ))
  const graphHeight = Math.max(sources.length, findings.length, 3) * 78 + 30
  const sourceY = (index: number) => 26 + index * 78
  const findingY = (index: number) => 26 + index * 78 + Math.max(0, sources.length - findings.length) * 39
  const reduced = remaining === 0 && actionable.length > 0

  return <section className={`mirror-stage ${reduced ? 'is-protected' : ''}`} aria-label="Interactive exposure evidence map">
    <div className="stage-top"><span className="stage-live"><i />THE MIRROR / {report.isDemo ? 'SYNTHETIC DEMO' : 'YOUR ANALYSIS'}</span><div><button type="button" onClick={() => setReplay((current) => current + 1)}><RotateCcw size={13} />Replay reveal</button><button type="button" onClick={onPresent} aria-pressed={presenting}><Expand size={14} />{presenting ? 'Exit presentation' : 'Present'}</button></div></div>
    <div className="stage-layout">
      <div className="stage-story"><span className="stage-kicker">THE COMBINATION EFFECT</span><h2>Harmless alone.<br /><em>Revealing together.</em></h2><p>Your posts leave fragments. The mirror shows how those fragments can connect — and where you can break the chain.</p>
        <div className="stage-outcome" aria-live="polite"><span className={`outcome-icon ${reduced ? 'protected' : ''}`}>{reduced ? <ShieldCheck size={22} /> : <GitBranch size={22} />}</span><div><strong>{!actionable.length ? 'Waiting for your clues' : reduced ? 'The chain is interrupted.' : `${remaining} open exposure ${remaining === 1 ? 'finding' : 'findings'}`}</strong><span>{protectedCount ? `${protectedCount} of ${actionable.length} findings hidden in simulation` : 'Traceable to the content you supplied'}</span></div></div>
        <button className="stage-compare" type="button" onClick={onCompare} disabled={!actionable.length}>{activeMitigations.length ? <RotateCcw size={16} /> : <ShieldCheck size={16} />}{activeMitigations.length ? 'Restore original exposure' : 'Preview a safer footprint'}<ArrowRight size={16} /></button>
        <span className="stage-honesty">Local text rules · What-if simulation</span>
      </div>
      <div className="stage-map" key={replay}>
        <div className="map-labels"><span>01 / SOURCE FRAGMENTS</span><span>02 / CONNECTED FINDINGS</span></div>
        {sources.length ? <div className="map-canvas" style={{ '--graph-height': `${graphHeight}px` } as CSSProperties}>
          <svg className="map-wires" viewBox={`0 0 600 ${graphHeight}`} preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="wire-color"><stop stopColor="#b8e68a" /><stop offset="1" stopColor="#e6ad7f" /></linearGradient></defs>{links.map(({ sourceIndex, findingIndex, finding }) => {
            const muted = finding.mitigation !== null && activeMitigations.includes(finding.mitigation)
            return <path key={`${sourceIndex}-${finding.id}`} className={`map-wire ${muted ? 'muted' : ''} ${selectedFinding === finding.id ? 'highlighted' : ''}`} d={`M 218 ${sourceY(sourceIndex) + 10} C 300 ${sourceY(sourceIndex) + 10}, 300 ${findingY(findingIndex) + 10}, 380 ${findingY(findingIndex) + 10}`} />
          })}</svg>
          <div className="source-stack">{sources.map((source, index) => <div className={`fragment-node ${links.some((link) => link.sourceIndex === index && link.finding.id === selectedFinding) ? 'connected' : ''}`} key={`${index}-${source}`} style={{ top: sourceY(index) - 19, animationDelay: `${index * 100}ms` }}><span className="fragment-icon"><FileText size={14} /></span><div><small>SOURCE {String(index + 1).padStart(2, '0')}</small><p title={source}>{source}</p></div><i /></div>)}</div>
          <div className="finding-stack">{findings.map((finding, index) => {
            const mitigated = finding.mitigation !== null && activeMitigations.includes(finding.mitigation)
            return <button type="button" key={finding.id} className={`exposure-node ${finding.level} ${mitigated ? 'mitigated' : ''} ${selectedFinding === finding.id ? 'picked' : ''}`} style={{ top: findingY(index) - 19, animationDelay: `${550 + index * 160}ms` }} aria-pressed={selectedFinding === finding.id} aria-label={`${finding.title}${mitigated ? ', mitigated in simulation' : ''}`} onClick={() => onSelect(finding.id)}><span className="node-pin" /><span className="node-tier">{mitigated ? <><Check size={10} />MITIGATED</> : `${finding.level.toUpperCase()} / INFERENCE`}</span><strong>{finding.title}</strong><ArrowRight className="node-arrow" size={13} /></button>
          })}</div>
          {!findings.length && <div className="map-empty"><ShieldCheck size={24} /><span>No connected findings yet</span></div>}
        </div> : <div className="map-empty"><Sparkles size={28} /><strong>Your story starts with a source.</strong><span>Load the fictional sample or add authorized text below.</span></div>}
        <div className="map-foot"><span><i />Evidence-backed connection</span><span>{links.length} visible links · {report.sourceSnippets.length > 5 || report.findings.length > 4 ? 'Preview; full evidence below' : 'Click a finding to inspect'}</span></div>
      </div>
    </div>
    <div className="stage-bottom"><span><ArrowDown size={14} />BREAK THE CHAIN</span><div>{controls.map(({ id, label, icon: Icon }) => <button type="button" key={id} disabled={!actionable.some((finding) => finding.mitigation === id)} aria-pressed={activeMitigations.includes(id)} className={activeMitigations.includes(id) ? 'enabled' : ''} onClick={() => onToggle(id)}><Icon size={14} />{label}<span className="stage-switch"><i /></span></button>)}</div><span className="stage-simulation">SIMULATION / ORIGINAL CONTENT UNCHANGED</span></div>
  </section>
}
