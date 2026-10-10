import { useState } from 'react'
import { ArrowRight, Check, RotateCcw, ShieldCheck, WandSparkles } from 'lucide-react'
import { compareText, repairText } from '../repair.ts'
import './RepairLab.css'

export function RepairLab({ text, imageCount, onApply }: { text: string; imageCount: number; onApply: (text: string) => void }) {
  const [session, setSession] = useState<ReturnType<typeof repairText> & { original: string } | null>(null)
  const [verified, setVerified] = useState<{ text: string; imageCount: number; result: ReturnType<typeof compareText> } | null>(null)
  const [copied, setCopied] = useState('')
  const current = session !== null && verified?.text === session.draft && verified.imageCount === imageCount
  const stale = session !== null && text !== session.original && text !== session.draft
  function generate() {
    const repaired = repairText(text)
    setSession({ original: text, ...repaired })
    setVerified({ text: repaired.draft, imageCount, result: compareText(text, repaired.draft, imageCount) })
    setCopied('')
  }
  async function copy() {
    try { await navigator.clipboard.writeText(session?.draft ?? ''); setCopied('Draft copied') }
    catch { setCopied('Copy unavailable. Select the draft text manually.') }
  }
  return <section className="repair-lab" aria-label="Repair and verify material">
    <div className="repair-intro"><div><span className="repair-eyebrow">FROM EXPOSURE TO CONTROL</span><h2>Change the story.<em> Keep the meaning.</em></h2><p>Redact address and schedule cues, then run the edited text through the same detection rules.</p></div><button type="button" className="repair-primary" disabled={!text.trim()} onClick={generate}><WandSparkles size={17} />{session ? 'Regenerate from current material' : 'Repair & re-analyze'}<ArrowRight size={16} /></button></div>
    {!session ? <div className="repair-steps"><span>01 / FIND THE EXPOSURE</span><ArrowRight size={14} /><span>02 / EDIT THE MATERIAL</span><ArrowRight size={14} /><span>03 / VERIFY THE DIFFERENCE</span></div> : <>
      <div className="repair-status" role="status">{stale ? 'Source material changed. Regenerate to compare the latest version.' : current ? 'Re-analysis complete · Results computed from the edited text' : 'Draft changed · Re-analyze to update the comparison'}</div>
      <div className="repair-documents"><article><div className="document-label"><span>BEFORE / ORIGINAL SNAPSHOT</span><span>{session.edits.length} automatic edits</span></div><pre>{session.original}</pre></article><article className="repaired-document"><div className="document-label"><label htmlFor="repair-draft">AFTER / EDITABLE DRAFT</label><ShieldCheck size={16} /></div><textarea id="repair-draft" value={session.draft} onChange={(event) => { setSession({ ...session, draft: event.target.value }); setCopied('') }} /><span className="draft-note">Review the wording before sharing. Bracketed text marks redactions.</span></article></div>
      <details className="repair-edits"><summary>Inspect {session.edits.length} automatic replacements</summary>{session.edits.length ? session.edits.map((edit, index) => <div key={index}><b>{edit.kind}</b><del>{edit.removed}</del><ArrowRight size={12} /><span>{edit.replacement}</span></div>) : <p>No supported address or schedule cues were replaced.</p>}</details>
      {current && verified && <div className="repair-comparison" aria-live="polite"><div className="repair-score"><span>DETECTED EXPOSURE FINDINGS</span><div><b>{verified.result.before.length}</b><ArrowRight size={24} /><strong>{verified.result.after.length}</strong></div><small>{verified.result.resolved.length} resolved · {verified.result.introduced.length} introduced</small></div><div className="repair-outcomes">{verified.result.resolved.map((finding) => <p key={finding.id}><Check size={15} /><span>{finding.title}</span><b>NO LONGER DETECTED</b></p>)}{verified.result.after.map((finding) => <p className="remaining" key={finding.id}><span className="remaining-dot" /><span>{finding.title}</span><b>STILL DETECTED</b></p>)}{!verified.result.before.length && !verified.result.after.length && <p>No supported exposure findings in either version.</p>}</div></div>}
      <div className="repair-actions"><button type="button" onClick={() => setVerified({ text: session.draft, imageCount, result: compareText(session.original, session.draft, imageCount) })} disabled={!session.draft.trim()}><RotateCcw size={14} />Re-analyze edited draft</button><button type="button" className="repair-primary" disabled={!current || stale || !session.draft.trim()} onClick={() => onApply(session.draft)}><Check size={15} />Use repaired material</button><button type="button" onClick={copy}>Copy draft</button><button type="button" disabled={stale} onClick={() => onApply(session.original)}>Restore original</button><span role="status">{copied}</span></div>
      <p className="repair-footnote">Text-only repair. Image files and EXIF are unchanged; metadata clues remain for manual review. Fewer detections do not guarantee privacy.</p>
    </>}
  </section>
}
