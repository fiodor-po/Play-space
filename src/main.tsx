import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installClientSessionErrorBuffer } from './lib/clientSessionErrorBuffer'

installClientSessionErrorBuffer()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
