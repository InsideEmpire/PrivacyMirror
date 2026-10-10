import { demo } from './data/demo.ts'
import { assertDemoIntegrity, resolveScenario } from './model.ts'

assertDemoIntegrity(demo)

const initial = resolveScenario(demo, [])
if (initial.sources.length !== 4 || initial.claims.length !== 5 || initial.findings.length !== 3) {
  throw new Error(`Unexpected initial counts ${initial.sources.length}/${initial.claims.length}/${initial.findings.length}`)
}
if (initial.edges.length !== 9 || initial.exposure.level !== 'elevated') {
  throw new Error('Initial scenario should stay elevated with 9 edges')
}

const stripped = resolveScenario(demo, ['strip-exif'])
if (stripped.activeIds.has('c-meta') || stripped.activeIds.has('f-meta') || !stripped.activeIds.has('src-photo')) {
  throw new Error('Stripping metadata should keep the photo and drop the metadata path')
}
if (!stripped.activeIds.has('f-window') || stripped.exposure.level !== 'elevated' || stripped.edges.length !== 7) {
  throw new Error('Metadata removal should leave the away window in place')
}

const delayed = resolveScenario(demo, ['delay-events'])
for (const id of ['src-event', 'c-fair', 'c-window', 'f-window']) {
  if (delayed.activeIds.has(id)) {
    throw new Error(`${id} should leave when the event post is delayed`)
  }
}
if (delayed.exposure.level !== 'narrowed' || delayed.edges.length !== 5) {
  throw new Error('Delaying the event should narrow exposure')
}

const both = resolveScenario(demo, ['strip-exif', 'delay-events'])
if (both.findings.length !== 1 || both.findings[0]?.id !== 'f-routine' || both.exposure.level !== 'residual') {
  throw new Error('Both mitigations should leave only the standing routine')
}
if (!both.activeIds.has('c-roommate') || !both.activeIds.has('src-photo') || both.edges.length !== 3) {
  throw new Error('Roommate clue and photo should remain after both mitigations')
}

console.log('demo scenario ok')
