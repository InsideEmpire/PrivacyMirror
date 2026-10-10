import { analyzeText } from './analyze.ts'

export function repairText(text: string) {
  const edits: { kind: string; removed: string; replacement: string }[] = []
  const replace = (value: string, pattern: RegExp, kind: string, replacement: string) => value.replace(pattern, (removed) => {
    edits.push({ kind, removed, replacement })
    return replacement
  })
  let draft = replace(text, /\b\d{1,5}\s+(?:[A-Za-z][A-Za-z'-]*\s+){1,5}(?:Street|St|Road|Rd|Lane|Ln|Avenue|Ave|Drive|Dr|Boulevard|Blvd)\b(?:,?\s+(?:Unit|Apt|Suite)\s+[A-Za-z0-9-]+)?/gi, 'Street address', '[address withheld]')
  draft = replace(draft, /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b|\d{1,2}(?::\d{2})?\s*(?:点|时)/gi, 'Precise time', '[time withheld]')
  draft = replace(draft, /\b(?:usually|often|every\s+(?:day|week|weekday)s?|weekdays|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\b|每个工作日|周一至周五|通常|经常|每周|每天|固定|星期[一二三四五六日天]|周[一二三四五六日天]|上午|下午|早上|晚上|傍晚/gi, 'Schedule cue', '[schedule withheld]')
  return { draft, edits }
}

export function compareText(original: string, draft: string, imageCount = 0) {
  const before = analyzeText(original, false, imageCount)
  const after = analyzeText(draft, false, imageCount)
  const risks = (report: typeof before) => report.findings.filter((finding) => finding.mitigation !== null)
  const previous = risks(before)
  const next = risks(after)
  return {
    before: previous, after: next,
    resolved: previous.filter((finding) => !next.some((item) => item.id === finding.id)),
    introduced: next.filter((finding) => !previous.some((item) => item.id === finding.id)),
  }
}
