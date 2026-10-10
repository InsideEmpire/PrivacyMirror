import { useState } from 'react'
import { Landing } from './components/Landing.tsx'
import { Workspace } from './components/Workspace.tsx'

export default function App() {
  const [started, setStarted] = useState(false)
  return started ? <Workspace onReset={() => setStarted(false)} /> : <Landing onStart={() => setStarted(true)} />
}
