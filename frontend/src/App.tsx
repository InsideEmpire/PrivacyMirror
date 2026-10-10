import { useCallback, useState } from 'react'
import { demo } from './data/demo.ts'
import { Story } from './components/Story.tsx'
import { Workspace } from './components/Workspace.tsx'

export interface AuthorizedSubject {
  name: string
  birthDate: string
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [subject, setSubject] = useState<AuthorizedSubject>({ name: demo.persona, birthDate: demo.birthDate })
  const openWithSubject = useCallback((authorizedSubject: AuthorizedSubject) => {
    setSubject(authorizedSubject)
    setStarted(true)
  }, [])
  return started ? <Workspace subject={subject} onReset={() => setStarted(false)} /> : <Story onOpen={openWithSubject} />
}
