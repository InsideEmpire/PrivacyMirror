import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  CircleHelp,
  Clock3,
  FileImage,
  FileText,
  ImagePlus,
  Layers3,
  LockKeyhole,
  MapPinned,
  Plus,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import './App.css'
import { analyzeText, SAMPLE_TEXT, type AnalysisReport, type ExposureFinding, type RiskLevel } from './analyze.ts'
import { MirrorStage } from './components/MirrorStage.tsx'
import { RepairLab } from './components/RepairLab.tsx'
import { PERSONAS } from './data/personas.ts'

export interface AuthorizedSubject {
  name: string
}

type WorkspaceView = 'overview' | 'evidence' | 'itinerary'
type AttachedFile = { file: File; preview: string | null }

const viewLabels: Record<WorkspaceView, string> = {
  overview: 'Risk overview',
  evidence: 'Evidence',
  itinerary: 'Route scenarios',
}

const mitigations = [
  { id: 'delay', label: 'Delay live event posts', icon: Clock3 },
  { id: 'routine', label: 'Hide recurring hours', icon: CalendarClock },
  { id: 'metadata', label: 'Remove photo location data', icon: FileImage },
  { id: 'address', label: 'Redact street address', icon: MapPinned },
] as const

function severityName(level: RiskLevel) {
  return level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'
}

export default function App() {
  const [subjectName, setSubjectName] = useState('Alex Rivera')
  const [text, setText] = useState(SAMPLE_TEXT)
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [report, setReport] = useState<AnalysisReport>(() => analyzeText(SAMPLE_TEXT, true))
  const [view, setView] = useState<WorkspaceView>('overview')
  const [consented, setConsented] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedFinding, setSelectedFinding] = useState<string | null>('route-chain')
  const [activeMitigations, setActiveMitigations] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [presenting, setPresenting] = useState(false)
  const [personaId, setPersonaId] = useState<string | null>('student')
  const fileInput = useRef<HTMLInputElement>(null)
  const previews = useMemo(
    () => files.map(({ file }) => ({ file, url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null })),
    [files],
  )
  const visibleFindings = report.findings.filter((finding) => !finding.mitigation || !activeMitigations.includes(finding.mitigation))
  const overallLevel = visibleFindings.some((finding) => finding.level === 'high')
    ? 'high'
    : visibleFindings.some((finding) => finding.level === 'medium')
      ? 'medium'
      : 'low'

  useEffect(() => () => previews.forEach(({ url }) => url && URL.revokeObjectURL(url)), [previews])

  function announce(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  async function attachFiles(incoming: FileList | File[]) {
    const selected = Array.from(incoming)
    const accepted = selected.filter((file) => file.type.startsWith('image/') || /\.(?:md|txt|csv)$/i.test(file.name) || file.type.startsWith('text/'))
    const rejected = selected.length - accepted.length
    if (!accepted.length) {
      announce('Choose an image, Markdown, TXT, or CSV file.')
      return
    }

    setFiles((current) => [...current, ...accepted.map((file) => ({ file, preview: null }))])
    const textFiles = accepted.filter((file) => !file.type.startsWith('image/'))
    const importedText = await Promise.all(textFiles.map((file) => file.text()))
    if (importedText.length) setText((current) => [current, ...importedText].filter(Boolean).join('\n'))
    if (rejected) announce(`Added ${accepted.length} file(s); skipped ${rejected} unsupported file(s).`)
  }

  function removeFile(fileToRemove: File) {
    setFiles((current) => current.filter(({ file }) => file !== fileToRemove))
  }

  function runAnalysis() {
    if (!consented) {
      setConsentError(true)
      announce('Confirm that you are authorized to analyze this content first.')
      return
    }
    if (!text.trim() && files.length === 0) {
      announce('Paste some text or add a supported file first.')
      return
    }
    if (!subjectName.trim()) {
      announce('Enter the authorized subject name first.')
      return
    }
    setConsentError(false)
    setIsAnalyzing(true)
    window.setTimeout(() => {
      setReport(analyzeText(text, false, files.filter(({ file }) => file.type.startsWith('image/')).length))
      setActiveMitigations([])
      setSelectedFinding(null)
      setView('overview')
      setIsAnalyzing(false)
    }, 700)
  }

  function loadDemo(persona = PERSONAS[0] as typeof PERSONAS[number]) {
    setPersonaId(persona.id)
    setSubjectName(persona.name)
    setText(persona.text)
    setFiles([])
    const nextReport = analyzeText(persona.text, true)
    setReport(nextReport)
    setActiveMitigations([])
    setSelectedFinding(nextReport.findings[0]?.id ?? null)
    setView('overview')
    setConsentError(false)
    if (fileInput.current) fileInput.current.value = ''
    announce('Loaded fictional sample data with no real personal information.')
  }

  function resetWorkspace() {
    setPersonaId(null)
    setSubjectName('')
    setText('')
    setFiles([])
    setReport(analyzeText(''))
    setActiveMitigations([])
    setSelectedFinding(null)
    setView('overview')
    setConsentError(false)
    setConsented(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  function toggleMitigation(id: string) {
    setActiveMitigations((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    void attachFiles(event.dataTransfer.files)
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(`${report.summary}\n\n${visibleFindings.map((finding) => `- ${severityName(finding.level)} risk: ${finding.title} (${finding.location})`).join('\n')}`)
      announce('Analysis summary copied.')
    } catch {
      announce('Clipboard access was not permitted by the browser.')
    }
  }

  return (
    <div className={`app-shell ${presenting ? 'presentation-mode' : ''}`}>
      <aside className="sidebar">
        <a className="brand" href="#workspace" aria-label="PrivacyMirror workspace">
          <span className="brand-mark"><Shield size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">privacy<span>mirror</span></span>
        </a>

        <p className="nav-caption">WORKSPACE</p>
        <nav className="primary-nav" aria-label="Workspace navigation">
          {(['overview', 'evidence', 'itinerary'] as WorkspaceView[]).map((item) => {
            const Icon = item === 'overview' ? Layers3 : item === 'evidence' ? Activity : MapPinned
            return (
              <button key={item} type="button" className={`nav-item ${view === item ? 'active' : ''}`} onClick={() => setView(item)}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{viewLabels[item]}</span>
                {item === 'overview' && <span className="nav-count">{visibleFindings.length}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-session">
          <div className="session-icon"><LockKeyhole size={16} /></div>
          <div><strong>Authorized content only</strong><p>Files stay in this browser session</p></div>
          <BadgeCheck className="session-check" size={15} />
        </div>
        <div className="sidebar-manifesto"><span>THE PRIVACY PARADOX</span><p>Small traces.<br />Bigger picture.</p><small>Understand what your content reveals when the pieces come together.</small></div>

        <div className="sidebar-bottom">
          <div className="account-row"><span className="account-avatar">P</span><span><strong>PrivacyMirror</strong><small>Demo</small></span><button type="button" aria-label="Reset workspace" onClick={resetWorkspace}><RotateCcw size={15} /></button></div>
        </div>
      </aside>

      <main className="main-area" id="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>Personal workspace</span><span className="breadcrumb-slash">/</span><strong>{viewLabels[view]}</strong></div>
          <div className="topbar-right"><span className="local-status"><i />Local rules preview</span><button type="button" className="icon-button" title="Privacy and security" onClick={() => announce('Content stays on this page; no AI backend is configured.')}><LockKeyhole size={16} /></button><span className="top-avatar">P</span></div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow"><span>YOUR DIGITAL FOOTPRINT, RECONSIDERED</span><span className="eyebrow-line" /></div><h1>See yourself from the outside.</h1><p>One post tells a story. Connected traces can reveal a whole routine.</p><p className="subject-context">Authorized subject: <strong>{subjectName || 'Not set'}</strong></p></div>
            <div className="heading-actions"><span className={`data-badge ${report.isDemo ? 'demo' : ''}`}><i />{report.isDemo ? 'Fictional sample data' : 'Current analysis'}</span><button type="button" className="button-secondary" onClick={() => loadDemo()}><Sparkles size={15} />Load sample</button><button type="button" className="button-icon-label" onClick={resetWorkspace} aria-label="New analysis"><Plus size={17} /><span>New analysis</span></button></div>
          </section>

          <section className="persona-gallery" aria-label="Fictional case studies">
            <div className="persona-heading"><span>EXPLORE THE HUMAN SIDE</span><small>4 fictional cases · Real extraction rules</small></div>
            <div className="persona-cards">{PERSONAS.map((persona, index) => <button type="button" key={persona.id} disabled={isAnalyzing} className={`persona-card ${persona.color} ${personaId === persona.id ? 'chosen' : ''}`} aria-pressed={personaId === persona.id} onClick={() => loadDemo(persona)}><span className="persona-top"><span className="persona-avatar">{persona.initials}</span><span className="persona-case">CASE / 0{index + 1}</span>{personaId === persona.id ? <Check size={14} /> : <ArrowRight size={14} />}</span><strong>{persona.name}</strong><span className="persona-role">{persona.role}</span><p>{persona.description}</p><span className="persona-tag">{persona.tag}</span></button>)}</div>
          </section>
          <MirrorStage report={report} visibleFindings={visibleFindings} selectedFinding={selectedFinding} onSelect={(id) => { setSelectedFinding(id); setView('overview') }} activeMitigations={activeMitigations} onToggle={toggleMitigation} onCompare={() => setActiveMitigations(activeMitigations.length ? [] : [...new Set(report.findings.flatMap((finding) => finding.mitigation ? [finding.mitigation] : []))])} presenting={presenting} onPresent={() => setPresenting((current) => !current)} />

          <RepairLab key={personaId ?? 'custom'} text={text} imageCount={files.filter(({ file }) => file.type.startsWith('image/')).length} onApply={(nextText) => { setText(nextText); setReport(analyzeText(nextText, report.isDemo, files.filter(({ file }) => file.type.startsWith('image/')).length)); setActiveMitigations([]); setSelectedFinding(null); setView('overview'); }} />
          <section className="metric-strip" aria-label="Analysis summary">
            <div className="metric-cell"><span className="metric-icon teal"><FileText size={17} /></span><div><small>Sources added</small><strong>{report.sourceCount.toString().padStart(2, '0')} <em>items</em></strong></div></div>
            <div className="metric-cell"><span className="metric-icon blue"><Building2 size={17} /></span><div><small>Place mentions</small><strong>{report.locations.length.toString().padStart(2, '0')} <em>places</em></strong></div></div>
            <div className="metric-cell"><span className={`metric-icon ${overallLevel === 'high' ? 'coral' : overallLevel === 'medium' ? 'amber' : 'teal'}`}><ShieldAlert size={17} /></span><div><small>Open findings</small><strong>{visibleFindings.length.toString().padStart(2, '0')} <em>items</em></strong></div></div>
            <div className="metric-note"><span className="pulse-dot" />{report.isDemo ? 'Sample data is ready' : 'Local analysis complete'}<span className="metric-note-divider" />Only your supplied content</div>
          </section>

          <div className="workbench-grid">
            <div className="primary-column">
              <section className="input-panel panel">
                <div className="panel-heading input-heading"><div className="panel-title-group"><span className="step-index">01</span><div><h2>Add your material</h2><p>Text gets a local rule-based preview. Images are added as sources only.</p></div></div><span className="secure-label"><LockKeyhole size={13} />Private workspace</span></div>
                <div className="input-tabs"><span className="input-tab active"><FileText size={14} />Text content</span><button type="button" className="input-tab" onClick={() => fileInput.current?.click()}><ImagePlus size={14} />Images / files</button><span className="input-hint">Paste · .md · .txt · .csv · images</span></div>
                <div className="subject-fields">
                  <label><span>Authorized name</span><input value={subjectName} onChange={(event) => setSubjectName(event.target.value)} autoComplete="name" placeholder="Your name or synthetic subject" /></label>
                </div>
                <textarea aria-label="Text to analyze" value={text} onChange={(event) => { setPersonaId(null); setText(event.target.value); if (report.isDemo) setReport((current) => ({ ...current, isDemo: false })) }} placeholder="Paste posts, schedules, or a bio you are authorized to analyze…" />
                <input ref={fileInput} className="visually-hidden" type="file" accept="image/*,.md,.txt,.csv,text/*" multiple onChange={(event) => { if (event.target.files) void attachFiles(event.target.files); event.target.value = '' }} />
                <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
                  <span className="dropzone-icon"><Upload size={16} /></span><span>Drop files here, or <button type="button" onClick={() => fileInput.current?.click()}>browse files</button></span><small>Images are previewed, not visually analyzed</small>
                </div>
                {previews.length > 0 && <div className="file-list">{previews.map(({ file, url }) => <div className="file-chip" key={`${file.name}-${file.lastModified}`}>
                  {url ? <span className="file-thumb"><img src={url} alt="" /></span> : <span className="file-thumb document"><FileText size={15} /></span>}
                  <span className="file-name">{file.name}<small>{url ? 'Awaiting visual analysis' : `${Math.max(1, Math.round(file.size / 1024))} KB · Text loaded`}</small></span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(file)}><X size={14} /></button>
                </div>)}</div>}
                <div className={`consent-row ${consentError ? 'needs-consent' : ''}`}><label><input type="checkbox" checked={consented} onChange={(event) => { setConsented(event.target.checked); setConsentError(false) }} /><span className="custom-check"><Check size={12} /></span><span>I own this content or have permission to analyze it.</span></label><button type="button" className="text-button" onClick={() => announce('Do not upload another person’s private data, credentials, or content without authorization.')} title="Authorization details"><CircleHelp size={14} /></button></div>
                <div className="compose-footer"><span><span className="privacy-led" />Processed locally · never uploaded</span><button type="button" className="analyze-button" onClick={runAnalysis} disabled={isAnalyzing}>{isAnalyzing ? <><span className="spinner" />Reviewing clues</> : <><Sparkles size={16} />Generate analysis<ArrowRight size={15} /></>}</button></div>
              </section>

              <section className="results-panel panel">
                <div className="results-header"><div className="panel-title-group"><span className="step-index">02</span><div><h2>Analysis results</h2><p>Each finding links to its source text; routes are possible scenarios only.</p></div></div><div className="view-switch" role="tablist" aria-label="Analysis views">{(['overview', 'evidence', 'itinerary'] as WorkspaceView[]).map((item) => <button key={item} type="button" role="tab" aria-selected={view === item} className={view === item ? 'selected' : ''} onClick={() => setView(item)}>{viewLabels[item]}</button>)}</div></div>
                {view === 'overview' && <Overview report={report} visibleFindings={visibleFindings} onSelect={setSelectedFinding} selectedFinding={selectedFinding} onEvidence={() => setView('evidence')} />}
                {view === 'evidence' && <EvidenceView report={report} onSelectView={() => setView('overview')} />}
                {view === 'itinerary' && <ItineraryView report={report} />}
              </section>

              {report.imageCount > 0 && <div className="image-ai-notice"><FileImage size={16} /><span><strong>{report.imageCount} image(s) added as sources.</strong> Visual AI is not connected in this preview, so images have not been analyzed. Adding an image is not an analysis result.</span></div>}
              <div className="footer-disclaimer"><ShieldCheck size={14} /><span>Probabilistic clues are not facts. No web-wide search, identity matching, address inference, or real-time tracking.</span><button type="button" onClick={copySummary}>Copy summary</button></div>
            </div>

            <aside className="insight-column">
              <section className={`risk-summary panel risk-${overallLevel}`}>
                <div className="risk-summary-top"><div><span className="overline">EXPOSURE LEVEL</span><h2>{overallLevel === 'high' ? 'Needs attention first' : overallLevel === 'medium' ? 'Exposure can be reduced' : activeMitigations.length ? 'No open findings in simulation' : 'No clear combination found'}</h2></div><span className={`risk-emblem ${overallLevel}`}><ShieldAlert size={21} /></span></div>
                <p>Qualitative tiers reflect the supplied clues, not a calibrated personal risk score.</p>
                <div className="risk-meter" aria-label={`Current risk: ${severityName(overallLevel)}`}><i className={overallLevel} /></div><div className="risk-meter-labels"><span>Low</span><span>Medium</span><span>High</span></div>
                <div className="risk-counts"><span><i className="count-dot high-dot" />High <b>{visibleFindings.filter((finding) => finding.level === 'high').length}</b></span><span><i className="count-dot medium-dot" />Medium <b>{visibleFindings.filter((finding) => finding.level === 'medium').length}</b></span><span><i className="count-dot low-dot" />Low <b>{visibleFindings.filter((finding) => finding.level === 'low').length}</b></span></div>
              </section>

              <section className="findings-panel panel"><div className="side-panel-heading"><div><span className="overline">PRIORITIZED FINDINGS</span><h2>Risk findings <span>{visibleFindings.length}</span></h2></div></div>
                {visibleFindings.map((finding, index) => <FindingCard key={finding.id} finding={finding} index={index} selected={selectedFinding === finding.id} onClick={() => { setSelectedFinding(finding.id); setView('overview') }} />)}
                {visibleFindings.length === 0 && <div className="empty-findings"><ShieldCheck size={21} /><strong>{report.findings.length ? 'No open findings in this simulation' : 'No analysis yet'}</strong><span>{report.findings.length ? 'Turn off a mitigation to restore its related clue.' : 'Add your material to reveal connected clues.'}</span></div>}
              </section>

              <section className="mitigation-panel panel"><div className="side-panel-heading"><div><span className="overline">WHAT-IF SIMULATION</span><h2>Mitigation simulation</h2></div><span className="simulation-tag">SIMULATED</span></div><p>Toggle a change to see how findings respond.</p><div className="mitigation-list">{mitigations.map(({ id, label, icon: Icon }) => { const active = activeMitigations.includes(id); const exists = report.findings.some((finding) => finding.mitigation === id); return <button key={id} type="button" disabled={!exists} aria-pressed={active} className={`mitigation-option ${active ? 'on' : ''} ${!exists ? 'unavailable' : ''}`} onClick={() => toggleMitigation(id)}><span className="mitigation-icon"><Icon size={15} /></span><span>{label}<small>{active ? 'Enabled in simulation' : exists ? 'Click to preview change' : 'No related clue found'}</small></span><span className="toggle"><i /></span></button> })}</div><div className="simulation-foot"><i />Changes this view only; original content stays untouched</div></section>

              <section className="locations-panel panel"><div className="side-panel-heading"><div><span className="overline">PLACE MENTIONS</span><h2>Buildings &amp; places</h2></div><MapPinned size={17} className="location-heading-icon" /></div>{report.locations.length ? <div className="location-list">{report.locations.map((location, index) => <div className="location-row" key={`${location}-${index}`}><span className="location-index">0{index + 1}</span><span className="location-name">{location}</span><span className="location-kind"><Building2 size={13} />In source</span></div>)}</div> : <div className="location-empty">No building names identified in text</div>}<p className="location-note">Only names explicitly present in text; no map matching or address inference.</p></section>
            </aside>
          </div>
        </div>
        {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
      </main>
    </div>
  )
}

function FindingCard({ finding, index, selected, onClick }: { finding: ExposureFinding; index: number; selected: boolean; onClick: () => void }) {
  return <button type="button" className={`finding-card ${selected ? 'selected' : ''}`} onClick={onClick}><span className={`finding-marker ${finding.level}`}>{String(index + 1).padStart(2, '0')}</span><span className="finding-copy"><span className="finding-title">{finding.title}</span><span className="finding-meta"><i className={finding.level} />{severityName(finding.level)}<b>·</b>{finding.location}</span></span><ArrowRight size={15} className="finding-arrow" /></button>
}

function Overview({ report, visibleFindings, onSelect, selectedFinding, onEvidence }: { report: AnalysisReport; visibleFindings: ExposureFinding[]; onSelect: (id: string) => void; selectedFinding: string | null; onEvidence: () => void }) {
  const selected = visibleFindings.find((finding) => finding.id === selectedFinding) ?? visibleFindings[0]
  return <div className="overview-content"><div className="overview-topline"><span className="result-chip"><span />{report.isDemo ? 'Synthetic sample analysis' : 'Current analysis'}</span><span className="analysis-method"><Sparkles size={13} />Local keyword rules · Not an AI conclusion</span></div>
    <div className="overview-summary"><div className="summary-symbol"><Activity size={21} /></div><div><span className="overline">EXECUTIVE SUMMARY</span><p>{report.summary}</p></div></div>
    {selected ? <article className={`selected-finding ${selected.level}`}><div className="selected-finding-head"><span className={`severity-pill ${selected.level}`}><i />{severityName(selected.level)} risk</span><span className="finding-id">FINDING / {selected.id.toUpperCase()}</span></div><h3>{selected.title}</h3><p className="finding-explanation">{selected.explanation}</p><div className="finding-location"><MapPinned size={15} /><span>{selected.location}</span><span className="location-source-label">Mentioned in text</span></div>{selected.evidence && <blockquote><span>Source excerpt</span><p>“{selected.evidence}”</p></blockquote>}<div className="action-row"><span className="action-check"><Check size={13} /></span><span><b>Suggested action</b>{selected.action}</span><button type="button" onClick={() => onSelect(selected.id)} aria-label="View risk finding"><ArrowRight size={15} /></button></div></article> : <div className="empty-state"><ShieldCheck size={24} /><h3>{report.findings.length ? 'All available mitigations are enabled' : 'Your mirror is ready'}</h3><p>{report.findings.length ? 'Findings are hidden in this simulation view.' : 'Add authorized text or load the fictional sample to begin.'}</p></div>}
    <div className="overview-bottom"><div className="bottom-stat"><span>Source snippets</span><strong>{report.sourceSnippets.length}</strong></div><div className="bottom-stat"><span>Place mentions</span><strong>{report.locations.length}</strong></div><div className="bottom-stat"><span>Future route</span><strong>{report.recurring && report.route.length > 1 ? 'Scenario only' : 'Insufficient clues'}</strong></div><button type="button" onClick={onEvidence}>Open evidence chain<ArrowRight size={14} /></button></div>
  </div>
}

function EvidenceView({ report, onSelectView }: { report: AnalysisReport; onSelectView: () => void }) {
  if (!report.sourceSnippets.length) return <div className="empty-state"><FileText size={23} /><h3>No text sources yet</h3><p>Add text or import a text file to see traceable source excerpts here.</p></div>
  return <div className="evidence-content"><div className="evidence-intro"><span className="evidence-count">{String(report.sourceSnippets.length).padStart(2, '0')}</span><div><h3>Original source excerpts</h3><p>Place, frequency, and time clues come from the text below; no web search was performed.</p></div></div>{report.sourceSnippets.map((snippet, index) => <article className="source-row" key={`${snippet}-${index}`}><span className="source-number">S{String(index + 1).padStart(2, '0')}</span><div><p>{snippet}</p><div className="source-tags">{report.locations.filter((location) => snippet.includes(location)).map((location) => <span key={location}><MapPinned size={11} />{location}</span>)}{/(?:周[一二三四五六日天]|\d{1,2}(?::\d{2})?\s*(?:点|时|am|pm)|上午|下午|早上|晚上|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekdays|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))/i.test(snippet) && <span><Clock3 size={11} />Time clue</span>}</div></div></article>)}<div className="evidence-note"><Shield size={15} />Rule extraction may miss context; review every inference against its source.<button type="button" onClick={onSelectView}>View related findings<ArrowRight size={13} /></button></div></div>
}

function ItineraryView({ report }: { report: AnalysisReport }) {
  return <div className="itinerary-content"><div className="itinerary-heading"><div><span className="overline">POSSIBLE FUTURE ROUTE</span><h3>Possible next route</h3><p>A hypothetical scenario based on recurring cues and source order.</p></div><span className="hypothesis-badge">Not real-time · Not certain</span></div>{report.route.length > 0 ? <div className="route-list">{report.route.map((stop, index) => <div className="route-stop" key={`${stop.location}-${index}`}><div className="route-track"><span className="route-dot" />{index < report.route.length - 1 && <i />}</div><div className="route-stop-content"><div><strong>{stop.location}</strong><span className="route-time"><Clock3 size={12} />{stop.time}</span></div><p>{stop.evidence || 'No matching source excerpt'}</p></div><span className="route-order">{String(index + 1).padStart(2, '0')}</span></div>)}</div> : <div className="route-empty"><MapPinned size={23} /><strong>Not enough route clues</strong><span>No specific building or place names appear in the text.</span></div>}<div className="route-caveat"><ShieldAlert size={15} /><span><strong>Interpret with care</strong>{report.recurring ? 'The text contains a recurring schedule cue, but it cannot confirm that you will visit any location.' : 'There is not enough recurring-pattern evidence for a future route; this view only shows the order of mentions.'} No map matching, address inference, or real-time tracking.</span></div></div>
}
