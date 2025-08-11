import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'

function applyStoredTheme() {
  const stored = localStorage.getItem('tp-theme') as 'light' | 'dark' | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = stored ?? (prefersDark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', theme)
}

applyStoredTheme()

window.addEventListener('storage', (e) => {
  if (e.key === 'tp-theme') applyStoredTheme()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
