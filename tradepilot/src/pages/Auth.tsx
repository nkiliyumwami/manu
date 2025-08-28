import { useState } from 'react'
import { z } from 'zod'
import { supabase } from '../lib/supabaseClient'

const schema = z.object({ email: z.string().email(), password: z.string().min(6).optional() })

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) { setMessage('Invalid input'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: password || '' })
    setLoading(false)
    if (error) setMessage(error.message)
    else setMessage('Signed in')
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const parsed = schema.pick({ email: true }).safeParse({ email })
    if (!parsed.success) { setMessage('Invalid email'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (error) setMessage(error.message)
    else setMessage('Magic link sent. Check your email.')
  }

  return (
    <div className="container-app py-10">
      <div className="mx-auto max-w-sm card p-6">
        <h1 className="mb-4 text-[length:--text-xl] font-semibold">Sign in</h1>
        <form className="space-y-3" onSubmit={signInPassword}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="input-help">Or leave blank and use magic link.</div>
          </div>
          {message && <div className="text-[--color-warning] text-sm">{message}</div>}
          <div className="flex items-center gap-2">
            <button className="button-primary" disabled={loading} type="submit">Sign in</button>
            <button className="button-secondary" disabled={loading} onClick={sendMagicLink}>Send magic link</button>
          </div>
        </form>
      </div>
    </div>
  )
}