import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HybrixonApp from './HybrixonApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HybrixonApp />
  </StrictMode>,
)
