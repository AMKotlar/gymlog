import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './supabase'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import Home from './pages/Home'
import History from './pages/History'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Stats from './pages/Stats'

function AppShell({ user, onPRUpdate, prVersion }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] pb-20" style={{ background: 'var(--bg-base)' }}>
      <Routes>
        <Route path="/" element={<Home user={user} onPRUpdate={onPRUpdate} />} />
        <Route path="/history" element={<History user={user} onPRUpdate={onPRUpdate} />} />
        <Route path="/stats" element={<Stats user={user} prVersion={prVersion} />} />
        <Route path="/prs" element={<Navigate to="/stats" replace />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(null)
  const [prVersion, setPrVersion] = useState(0)
  const onPRUpdate = () => setPrVersion((v) => v + 1)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setOnboardingDone(data?.onboarding_completed ?? false)
      })
  }, [session?.user?.id])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-base)',
          gap: '16px',
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.1em',
          }}
        >
          FAILR
        </p>
        <div
          style={{
            width: '40px',
            height: '2px',
            background: 'var(--accent)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signin"
          element={session ? <Navigate to="/" replace /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={session ? <Navigate to="/" replace /> : <SignUp />}
        />
        <Route
          path="/*"
          element={
            session ? (
              onboardingDone === null ? null : onboardingDone === false ? (
                <Onboarding userId={session.user.id} onComplete={() => setOnboardingDone(true)} />
              ) : (
                <AppShell user={session.user} onPRUpdate={onPRUpdate} prVersion={prVersion} />
              )
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
