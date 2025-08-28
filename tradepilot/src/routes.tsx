import { Navigate, createBrowserRouter } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import App from './App'
import AuthPage from './pages/Auth'
import { supabase } from './lib/supabaseClient'
import { useEffect, useState } from 'react'

function useSession() {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setAuthed] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])
  return { loading, isAuthed }
}

export function ProtectedApp() {
  const { loading, isAuthed } = useSession()
  if (loading) return <div className="container-app py-10"><div className="skeleton h-8 w-40" /></div>
  return isAuthed ? <App /> : <Navigate to="/auth" replace />
}

export const routes: RouteObject[] = [
  { path: '/', element: <ProtectedApp /> },
  { path: '/auth', element: <AuthPage /> },
]

export const router = createBrowserRouter(routes)