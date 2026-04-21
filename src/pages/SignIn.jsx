import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    navigate('/')
  }

  const forgotPassword = async () => {
    if (!email) {
      setMessage('Enter your email first.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setMessage(error ? error.message : 'Password reset email sent.')
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center px-5 text-white" style={{ background: 'var(--bg-base)' }}>
      <h1 className="mb-6 text-3xl">Sign in</h1>
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
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="h-12 w-full rounded-lg disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#000000', fontWeight: 600 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={forgotPassword}
          className="h-11 w-full text-left text-sm text-white/60 underline"
        >
          Forgot password
        </button>
      </div>
      <p className="mt-4 text-sm text-white/60">
        No account? <Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up</Link>
      </p>
      {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
    </div>
  )
}

export default SignIn
