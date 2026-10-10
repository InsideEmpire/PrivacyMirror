export type RiskLevel = 'high' | 'medium' | 'low'

export interface ExposureFinding {
  id: string
  title: string
  level: RiskLevel
  location: string
  evidence: string
  explanation: string
  action: string
  mitigation: 'delay' | 'routine' | 'metadata' | 'address' | null
}

export interface RouteStop {
  location: string
  time: string
  evidence: string
}

export interface AnalysisReport {
  isDemo: boolean
  sourceCount: number
  sourceSnippets: string[]
  locations: string[]
  route: RouteStop[]
  recurring: boolean
  findings: ExposureFinding[]
  summary: string
  imageCount: number
}

export const SAMPLE_TEXT = `On weekdays around 8 AM, I usually work from the cafe on the first floor of Pinewind Student Center.\nI study on the fourth floor of Northshore Library around 3 PM on Tuesdays, and have gone every week lately.\nI attend club events at Begonia Hall at 6 PM on Fridays. I share event photos afterward.\nMy desk plant is thriving; this photo may retain location data.`

const placePattern = /[\u4e00-\u9fa5A-Za-z0-9·]{2,16}(?:学生中心|图书馆|教学楼|实验楼|宿舍|礼堂|体育馆|办公楼|大厦|大楼|咖啡馆|咖啡厅|咖啡角|校区|活动中心|文化中心|馆|楼栋)/g
const englishPlacePattern = /\b(?:[A-Z][A-Za-z'-]*\s+){0,3}(?:Hall|Library|Center|Centre|Tower|Dormitory|Building)\b/g
const timePattern = /(?:周[一二三四五六日天]|星期[一二三四五六日天]|每周|每天|\d{1,2}(?::\d{2})?\s*(?:点|时|am|pm)|上午|下午|早上|晚上|傍晚|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekdays|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?))/i
const recurringPattern = /(?:通常|经常|每周|每天|每个工作日|周一至周五|固定|usually|often|every\s+(?:day|week|weekday)|on\s+weekdays)/i

function cleanPlace(value: string): string {
  return value
    .replace(/^.*(?:在|去|到|于)\s*/u, '')
    .replace(/^(?:at|in|visit)\s+/i, '')
    .replace(/^(?:的|在|去|到|于)\s*/u, '')
    .trim()
}

function extractPlaces(text: string): string[] {
  const matches = [...text.matchAll(placePattern), ...text.matchAll(englishPlacePattern)]
  return [...new Set(matches.map((match) => cleanPlace(match[0])).filter((place) => place.length > 1))]
}

function splitSources(text: string): string[] {
  return text
    .split(/\n+|(?<=[。！？!?；;])/u)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function analyzeText(text: string, isDemo = false, imageCount = 0): AnalysisReport {
  const sources = splitSources(text)
  const locations = extractPlaces(text)
  const recurring = recurringPattern.test(text)
  const route = locations.map((location) => {
    const evidence = sources.find((source) => source.includes(location)) ?? ''
    const preciseTime = evidence.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i)?.[0]
    const time = preciseTime ?? evidence.match(timePattern)?.[0] ?? 'No time specified'
    return { location, time, evidence }
  })
  const findings: ExposureFinding[] = []
  const addressPattern = /\b\d{1,5}\s+(?:[A-Za-z][A-Za-z'-]*\s+){1,5}(?:Street|St|Road|Rd|Lane|Ln|Avenue|Ave|Drive|Dr|Boulevard|Blvd)\b(?:,?\s+(?:Unit|Apt|Suite)\s+[A-Za-z0-9-]+)?/i
  const addressSource = sources.find((source) => addressPattern.test(source))
  const address = addressSource?.match(addressPattern)?.[0]
  if (address && addressSource) {
    findings.push({
      id: 'address-disclosure', title: 'An explicit street address is exposed', level: 'high',
      location: address, evidence: addressSource,
      explanation: 'A street-address-shaped string appears directly in the supplied text. This is extraction, not a guessed home address; ownership, existence, and residential use are not verified.',
      action: 'Redact the street address and unit number. Use a separate business mailing address or private delivery channel.',
      mitigation: 'address',
    })
  }

  if (locations.length >= 2 && route.some((stop) => stop.time !== 'No time specified')) {
    const routeEvidence = route.map((stop) => stop.evidence).filter(Boolean).slice(0, 2)
    findings.push({
      id: 'route-chain',
      title: 'Multiple places and times can be connected',
      level: 'high',
      location: locations.slice(0, 2).join(' → '),
      evidence: routeEvidence.join(' '),
      explanation: 'The supplied text names multiple places and times. Together, they could suggest an activity sequence; this does not confirm that the route occurred.',
      action: 'Remove precise times from public posts, or share event updates afterward.',
      mitigation: 'delay',
    })
  }

  if (locations.length > 0 && recurring && !findings.some((finding) => finding.id === 'routine')) {
    const evidence = sources.find((source) => recurringPattern.test(source) && locations.some((place) => source.includes(place))) ?? sources[0] ?? ''
    findings.push({
      id: 'routine',
      title: 'A recurring place may reveal a routine',
      level: 'medium',
      location: locations[0] ?? 'Recurring place',
      evidence,
      explanation: 'A recurring schedule appears alongside a specific place. Someone familiar with you could infer when you tend to be there.',
      action: 'Remove recurring hours from public bios and avoid repeated real-time check-ins.',
      mitigation: 'routine',
    })
  }

  if (/(?:定位|gps|exif|元数据|照片位置|location data)/i.test(text)) {
    const evidence = sources.find((source) => /(?:定位|gps|exif|元数据|照片位置|location data)/i.test(source)) ?? ''
    findings.push({
      id: 'metadata',
      title: 'A photo may contain location metadata',
      level: 'medium',
      location: 'Image file',
      evidence,
      explanation: 'The text mentions photo location data or metadata. This frontend does not inspect image contents or EXIF, so this is an unverified text clue, not a finding about the file itself.',
      action: 'Disable location access on your device or remove photo metadata before sharing.',
      mitigation: 'metadata',
    })
  }

  if (findings.length === 0 && (sources.length > 0 || imageCount > 0)) {
    findings.push({
      id: 'no-combination',
      title: locations.length ? 'No clear place-and-time combination found' : 'No specific building or place identified',
      level: 'low',
      location: locations[0] ?? 'Not identified',
      evidence: sources[0] ?? '',
      explanation: 'Local rules did not find enough text clues to connect a place and time. This is not a complete privacy audit and does not mean the content is risk-free.',
      action: 'Add context you are authorized to analyze, or review whether precise times or unnecessary address details are included.',
      mitigation: null,
    })
  }

  const summary = locations.length
    ? `Found ${locations.length} place mention${locations.length === 1 ? '' : 's'} across ${sources.length} text segment${sources.length === 1 ? '' : 's'}${recurring ? ', including a recurring schedule cue' : ''}. The route follows mention order; any future route is a scenario, not tracking or a certain prediction.`
    : `Reviewed ${sources.length} text segment${sources.length === 1 ? '' : 's'} and found no specific building names. Place extraction uses local keyword rules and may miss or misclassify locations.`

  return {
    isDemo,
    sourceCount: sources.length + imageCount,
    sourceSnippets: sources,
    locations,
    route,
    recurring,
    findings,
    summary: sources.length === 0 && imageCount === 0 ? 'Add authorized source material to start your analysis.' : `${address ? 'An explicit street-address-shaped string was found in the source text. ' : ''}${summary}`,
    imageCount,
  }
}
