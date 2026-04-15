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
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center bg-[#0f0f1a] px-5 text-white">
      <h1 className="mb-6 text-3xl">Create account</h1>
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="h-12 w-full rounded-lg border border-white/15 bg-[#17172a] px-3 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="h-12 w-full rounded-lg border border-white/15 bg-[#17172a] px-3 outline-none"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
          className="h-12 w-full rounded-lg border border-white/15 bg-[#17172a] px-3 outline-none"
        />
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="h-12 w-full rounded-lg bg-[#7c3aed] disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </div>
      <p className="mt-4 text-sm text-white/60">
        Have an account? <Link to="/signin" className="text-[#7c3aed]">Sign in</Link>
      </p>
      {message ? <p className="mt-3 text-sm text-white/70">{message}</p> : null}
    </div>
  )
}

export default SignUp
