import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    setMessage(error ? error.message : 'Check your email to confirm your account')
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center px-5 text-white" style={{ background: 'var(--bg-base)' }}>
      <div className="mb-6">
        <h1 style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '32px', fontWeight: 700, color: 'var(--accent)' }}>FAILR</h1>
        <p style={{ margin: '6px 0 0 0', fontFamily: "'Barlow', sans-serif", fontSize: '15px', color: 'var(--text-secondary)' }}>
          Just Fail It.
        </p>
      </div>
      <h1 className="mb-6 text-3xl">Create account</h1>
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="h-12 w-full rounded-lg px-3 outline-none"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="h-12 w-full rounded-lg px-3 outline-none"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
          className="h-12 w-full rounded-lg px-3 outline-none"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}
        />
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="h-12 w-full rounded-lg disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#000000', fontWeight: 600 }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
      <p className="mt-4 text-sm text-white/60">
        Have an account? <Link to="/signin" style={{ color: 'var(--accent)' }}>Sign in</Link>
      </p>
      {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
    </div>
  )
}

export default SignUp
