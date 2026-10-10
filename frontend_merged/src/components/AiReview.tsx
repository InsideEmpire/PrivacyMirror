import { useEffect, useRef, useState } from 'react'
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import './AiReview.css'
import { compareText } from '../repair.ts'

type Review = { summary: string; repairedText: string; model: string; analyzedAt: string; findings: { title: string; severity: string; evidence: string; explanation: string; action: string }[] }

export function AiReview({ text, onApply }: { text: string; onApply: (text: string) => void }) {
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [result, setResult] = useState<{ source: string; review: Review } | null>(null)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const applied = result !== null && result.review.repairedText === text
  const stale = result !== null && result.source !== text && !applied
  const comparison = result ? compareText(result.source, result.review.repairedText) : null
  async function exportReview() {
    if (!result || !comparison) return
    const report = `PrivacyMirror — Review receipt\nModel: ${result.review.model}\nGenerated: ${result.review.analyzedAt}\nStatus: ${stale ? 'Source changed' : applied ? 'Draft applied' : 'Draft preview'}\n\n${result.review.summary}\n\n${result.review.findings.map(f => `${f.severity.toUpperCase()}: ${f.title}\nEvidence: ${f.evidence}\n${f.explanation}\nAction: ${f.action}`).join('\n\n')}\n\nLocal rule comparison: ${comparison.before.length} → ${comparison.after.length} exposure findings\nFewer detections do not guarantee privacy.\n\nOriginal:\n${result.source}\n\nRepaired draft:\n${result.review.repairedText}`
    try { await navigator.clipboard.writeText(report); setExportMessage('Review receipt copied') }
    catch { setExportMessage('Clipboard unavailable. Select the result text to copy.') }
  }
  async function review() {
    const source = text
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current
    setLoading(true)
    setError('')
    setExportMessage('')
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: source, consent }), signal: current.signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'AI review unavailable.')
      setResult({ source, review: data })
    } catch (failure) {
      if (!current.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to reach the AI backend.')
    } finally { if (!current.signal.aborted) setLoading(false) }
  }
  return <section className="ai-review" aria-label="Gemini AI review">
    <div className="ai-review-heading"><div><span className="ai-kicker"><Sparkles size={14} /> LIVE MODEL REVIEW</span><h2>A second perspective.<br /><em>Grounded in your evidence.</em></h2><p>Gemini reviews the current text and drafts a safer version. Every returned evidence quote is checked against your source.</p></div><span className="ai-provider">GOOGLE GEMINI<br /><small>{result?.review.model ?? 'Real API · Text only'}</small></span></div>
    <div className="ai-workflow" aria-label="Review workflow"><span className={result ? 'complete' : ''}>01 <b>Reveal</b><small>Source-backed AI findings</small></span><span className={result ? 'complete' : ''}>02 <b>Rewrite</b><small>Model-generated privacy edits</small></span><span className={applied ? 'complete' : ''}>03 <b>Verify</b><small>Independent local rule check</small></span></div><div className="ai-controls"><label><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />I have permission to send this text to Google Gemini for review.</label><button type="button" disabled={!consent || loading || !text.trim() || text.length > 12000} onClick={() => void review()}>{loading ? <><span className="spinner" />Waiting for Gemini…</> : <><Sparkles size={16} />{result ? 'Review current text again' : 'Run live AI review'}<ArrowRight size={16} /></>}</button></div>
    <p className="ai-disclosure">Only the text is sent after you click. Images stay in this browser. Local rule results remain separate. Maximum 12,000 characters.</p>
    {loading && <p role="status">Calling Google Gemini. The response may take up to a minute.</p>}
    {error && <p className="ai-error" role="alert">{error}</p>}
    {result && <div className="ai-result"><div className="ai-result-meta"><span><ShieldCheck size={15} />Source quotes verified · AI interpretation requires review</span><span>{new Date(result.review.analyzedAt).toLocaleTimeString()}</span></div>{stale && <p className="ai-error">Text has changed since this review. Run AI review again before applying a draft.</p>}{applied && <div className="ai-success" role="status"><ShieldCheck size={20} /><div><strong>Repair applied. Local verification complete.</strong><p>The workspace now uses your repaired text. Original evidence is preserved below.</p></div></div>}{comparison && <div className="ai-impact"><div><span>LOCAL EXPOSURE FINDINGS</span><div className="ai-impact-count"><b>{comparison.before.length}</b><ArrowRight size={30} /><strong>{comparison.after.length}</strong></div><small>{applied ? 'Applied draft' : 'Draft preview'} · Same rules, both versions</small></div><div><span>VERIFIED SOURCE QUOTES</span><strong>{result.review.findings.length.toString().padStart(2, '0')}</strong><small>Exact matches to supplied text</small></div><div><span>NO LONGER DETECTED</span><strong>{comparison.resolved.length.toString().padStart(2, '0')}</strong><small>{comparison.after.length} remain · Not a safety guarantee</small></div></div>}<p className="ai-summary">{result.review.summary}</p><div className="ai-findings">{result.review.findings.map((finding, index) => <article key={index}><span className={`ai-severity ${finding.severity}`}>{finding.severity}</span><h3>{finding.title}</h3><blockquote>{finding.evidence}</blockquote><p>{finding.explanation}</p><strong>Suggested action</strong><p>{finding.action}</p></article>)}</div><div className="ai-draft"><div><span className="ai-kicker">MODEL-GENERATED REPAIR</span><h3>Your safer draft</h3><p>Review the edits, then apply them to run the local rules again. Text edits do not remove image metadata.</p><button type="button" disabled={stale || loading || applied} onClick={() => onApply(result.review.repairedText)}>{applied ? 'Draft applied & verified' : 'Apply draft & verify locally'}<ArrowRight size={16} /></button></div><div className="ai-document-pair"><details><summary>Compare with original material</summary><pre>{result.source}</pre></details><pre>{result.review.repairedText}</pre></div></div><div className="ai-receipt"><span>TRACEABLE BY DESIGN · {result.review.model}</span><button type="button" onClick={() => void exportReview()}>Copy review receipt</button><small role="status">{exportMessage}</small></div></div>}
  </section>
}
