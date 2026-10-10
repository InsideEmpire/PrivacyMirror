# PrivacyMirror — Hackathon Product & Engineering Specification

> **Tagline:** See yourself through an attacker's eyes. Take control of your digital footprint.
>
> **Goal:** Build a compelling, consent-based privacy exposure analysis MVP in 24 hours.

## 1. Executive summary
PrivacyMirror helps a person understand what their **own voluntarily supplied or authorized public information** reveals, how individual clues combine into privacy risks, and what to change. It generates an evidence-backed exposure graph, a prioritized remediation report, and a before/after comparison.

**Success criterion:** A judge can upload a prepared demo dataset, see an interactive graph and grounded risk findings within 60 seconds, click through to supporting evidence, and simulate mitigations that visibly reduce exposure.

## 2. Core experience
1. **Consent & input:** Explicit consent screen; upload an exported social profile archive, text snippets, images, or URLs to content the user controls. MVP may accept pasted page content rather than scrape sites.
2. **Extract:** Parse text, EXIF metadata (when present), user-visible image details (optional), and dates. Do not infer exact home addresses or sensitive personal attributes.
3. **Analyze:** LLM extracts discrete claims with source references, confidence labels, and clear separation of *observed* versus *inferred*.
4. **Connect:** Interactive knowledge graph connects evidence -> exposure -> plausible risk scenario -> mitigation.
5. **Protect:** Rank actionable privacy findings, recommend privacy-setting changes, metadata removal, and post edits.
6. **Compare:** Toggle mitigation scenarios and visualize which graph paths and risk indicators disappear.

## 3. MVP scope (must-have)
- Responsive dark-theme React interface with onboarding, upload/paste, results, and remediation tabs.
- Preloaded **synthetic demo persona** and sample posts/photos; one-click demo works offline except for optional LLM call.
- FastAPI backend with `/api/analyze`, `/api/demo`, `/api/report`.
- Structured analysis JSON with evidence IDs, exact quoted excerpts, claim status, confidence, exposure type, risk, and remediation.
- Interactive graph using React Flow (@xyflow/react).
- Findings cards with evidence drill-down and actionable advice.
- Before/after mitigation toggles.
- Clear disclaimers: probabilistic inferences are not facts; no third-party profiling.

### Stretch goals (only after MVP works)
- Image EXIF inspector and metadata-stripping download.
- User-authorized public-page fetching for supported sources, respecting platform policies.
- PDF export, local persistence, multilingual UI, threat-model templates.

### Explicitly out of scope
- Bulk scraping, searching strangers by name, face recognition, people-search enrichment, private account access, password or credential lookup, doxxing, exact-address inference, automated contacting of people.
- Claiming a calibrated numerical risk score without validation.

## 4. Technical architecture

```text
React + Vite + TypeScript + Tailwind
    |-- Consent + upload/paste
    |-- Analysis dashboard
    |-- React Flow graph
    |-- Mitigation simulator
            |
            v
FastAPI (Python)
    |-- File validation & safe parsing
    |-- Evidence extraction
    |-- LLM analysis (strict JSON schema)
    |-- Rule-based risk categorization
    |-- Evidence validation
    |-- Synthetic demo fallback
```

Suggested libraries: `@xyflow/react`, `lucide-react`, `zod`, `react-dropzone`, `fastapi`, `pydantic`, `pillow`, `exifread` (optional). No database needed for MVP; process files ephemerally by default.

## 5. Data contract

```json
{
  "analysis_id": "demo-001",
  "subject_consent": true,
  "sources": [
    {"id": "src1", "type": "post", "label": "Sample public post", "text": "Our campus event starts Friday at 5 PM."}
  ],
  "claims": [
    {"id": "c1", "type": "event_time", "value": "Friday at 5 PM", "status": "observed", "confidence": "high", "evidence_ids": ["src1"]}
  ],
  "findings": [
    {"id": "f1", "title": "Public schedule clue", "severity": "medium", "claim_ids": ["c1"], "explanation": "A publicly shared event time can reveal a planned attendance window.", "mitigation": "Consider sharing attendance after the event."}
  ],
  "edges": [
    {"source": "src1", "target": "c1", "relation": "supports"},
    {"source": "c1", "target": "f1", "relation": "contributes_to"}
  ]
}
```

**Validation:** Every observed claim must reference an existing source; every finding must reference claims; inferred claims must be visibly labeled. Never fabricate sources. Reject invalid LLM JSON and fall back to rule-based/demo output.

## 6. UX and demo narrative

**Landing:** “What does your digital footprint reveal?” with a clear consent checkbox and a **Try Demo** CTA.

**Analysis animation:** Source cards appear, then claims, then edges and risk findings. Do not imply the product searched the entire internet if it only analyzed uploads.

**Results:** Left: graph. Right: prioritized finding list. Click a node to see the exact supporting snippet and whether it is observed or inferred.

**Before / after:** Toggle “Remove image location metadata” or “Delay public event posts.” Highlight graph paths that disappear and update qualitative exposure labels.

**Pitch (90 seconds):**
- 0–15s: “A harmless photo, an event post, and a public bio may each look safe in isolation.”
- 15–35s: Import the synthetic persona and reveal connected clues.
- 35–55s: Click one risk and show its supporting evidence; emphasize no invented conclusions.
- 55–75s: Apply a mitigation and show the graph shrink.
- 75–90s: “PrivacyMirror turns vague privacy warnings into evidence and concrete actions.”

## 7. Build schedule (24-hour hackathon)

| Hours | Deliverable | Exit criterion |
|---|---|---|
| 0–2 | Repo, UI skeleton, sample persona | App starts locally; demo button visible |
| 2–5 | Upload/paste and backend parser | Input is validated and parsed |
| 5–9 | Analysis pipeline and JSON schema | Findings include source-backed evidence |
| 9–13 | Interactive graph | Click node opens evidence panel |
| 13–16 | Mitigation simulation | Toggle visibly changes exposure graph |
| 16–19 | UI polish and loading/error states | Works on laptop and phone |
| 19–21 | End-to-end tests and privacy review | Demo works with network/LLM unavailable |
| 21–24 | Rehearsal, screenshots, submission | 90-second pitch and stable live demo |

## 8. AI coding agent execution plan

Use small, testable tickets rather than one huge prompt. Commit after each milestone.

**Ticket A — scaffold:** Build Vite React TypeScript frontend, Tailwind styling, FastAPI backend, typed API client, README, and launch scripts. Provide sample data and tests.

**Ticket B — analysis:** Implement Pydantic schemas, source ingestion, evidence extraction, LLM adapter with strict JSON response, validation, timeouts, and deterministic fallback. Never fabricate citations.

**Ticket C — graph:** Build React Flow visualization for sources, claims, findings, and mitigations. Node click shows evidence, confidence, and provenance.

**Ticket D — mitigation:** Implement rule-based before/after changes that remove or deactivate affected edges, update findings, and clearly label simulations.

**Ticket E — harden:** Add input-size limits, file-type validation, error handling, empty states, tests, accessibility, and demo reliability.

### Copy-paste starter prompt for an AI coding agent

> Build PrivacyMirror from this PRD. Prioritize a complete, working 24-hour hackathon MVP, not broad integrations. Start with a beautiful responsive UI and deterministic synthetic demo data, then implement the consent-based ingestion and evidence-backed analysis API. Use React/Vite/TypeScript/Tailwind/React Flow and Python/FastAPI/Pydantic. No scraping strangers, face recognition, or exact-address inference. Every claim must cite a real supplied source, and inferred claims must be labeled. Run tests and show me a working demo after each milestone. Ask before adding any dependencies or external integrations that require paid credentials.

## 9. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Social platform anti-bot controls | High | Use uploads/pasted content first |
| LLM hallucinated personal details | High | Source IDs, schema checks, observed/inferred labels |
| Privacy harm from profiling | High | Consent, synthetic demo, avoid third-party lookups |
| Sensitive data retention | High | Ephemeral processing, no default logging of contents |
| Unreliable live demo | High | Deterministic offline demo mode |
| Overly complex scoring | Medium | Qualitative risk tiers with transparent rules |

## 10. Acceptance checklist
- [ ] One-click synthetic demo loads instantly.
- [ ] User must affirm authorization before real-data analysis.
- [ ] Uploaded/pasted data creates evidence-backed claims.
- [ ] Every displayed claim has a clickable source or an explicit inferred label.
- [ ] Graph nodes are interactive.
- [ ] At least two mitigations update the graph and findings.
- [ ] No unsupported claims of scanning the whole internet.
- [ ] Demo works if the LLM API fails.
- [ ] README includes setup, architecture, privacy safeguards, and known limitations.

## 11. Effort estimate
- **UI + synthetic demo:** ~1–3 hours with an experienced developer supervising an AI agent.
- **Input + AI analysis:** ~3–6 additional hours.
- **Graph + remediation:** ~3–6 additional hours.
- **Testing + pitch:** ~2–4 additional hours.
- **Practical MVP:** ~10–18 hours, with substantial variance depending on integration issues.
- **Automated cross-platform OSINT:** Not a 24-hour MVP; likely several days or more.

An AI coding agent has no universal guaranteed uninterrupted runtime. It is constrained by tool/session limits, API quotas, context management, and failures. Plan checkpointed 60–120 minute work blocks with tests and Git commits.

## 12. Judging strategy
- **Impact:** Make privacy risks understandable to non-experts.
- **Technical merit:** Provenance-aware structured extraction and interactive graph.
- **Originality:** Before/after remediation simulation, not just a privacy score.
- **Polish:** Fast, reliable, visually memorable demo.
- **Integrity:** Clearly distinguish demo data, observed evidence, and uncertain inference.
