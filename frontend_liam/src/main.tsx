import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { demo } from './data/demo.ts'
import { assertDemoIntegrity } from './model.ts'
import './index.css'

assertDemoIntegrity(demo)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
