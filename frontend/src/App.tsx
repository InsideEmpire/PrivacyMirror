import { useCallback, useState } from 'react'
import { Story } from './components/Story.tsx'
import { Workspace } from './components/Workspace.tsx'

export default function App() {
  const [started, setStarted] = useState(false)
  const open = useCallback(() => setStarted(true), [])
  return started ? <Workspace onReset={() => setStarted(false)} /> : <Story onOpen={open} />
}
