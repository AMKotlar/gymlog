import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './supabase'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'
import Home from './pages/Home'
import History from './pages/History'
import Onboarding from './pages/Onboarding'
import Profile from './pages/Profile'
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
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem('onboardingComplete') === 'true',
  )
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
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
    if (!session?.user?.id) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('name, gender, birth_year, height_cm, weight_kg, goal')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data ?? null)
        const savedStep = Number(localStorage.getItem('onboardingStep'))
        const hasSavedOnboardingStep = Number.isFinite(savedStep) && savedStep >= 6 && savedStep <= 11
        if (data?.name && data?.goal && !hasSavedOnboardingStep) {
          localStorage.setItem('onboardingComplete', 'true')
          localStorage.removeItem('onboardingStep')
          setOnboardingComplete(true)
        }
      })
      .finally(() => {
        setProfileLoading(false)
      })
  }, [session?.user?.id])

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingComplete', 'true')
    localStorage.removeItem('onboardingStep')
    setOnboardingComplete(true)
  }

  const savedOnboardingStep = Number(localStorage.getItem('onboardingStep'))
  const onboardingStep =
    Number.isFinite(savedOnboardingStep) && savedOnboardingStep >= 6 && savedOnboardingStep <= 11
      ? savedOnboardingStep
      : profile?.name
        ? 7
        : 6
  const hasCompletedProfile = Boolean(profile?.name && profile?.goal)

  if (loading || (session && profileLoading)) {
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
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <Onboarding
                initialStep={5}
                initialAuthMode="signin"
                signInOnly
                onComplete={handleOnboardingComplete}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/*"
          element={
            session ? (
              !profile?.name || (!onboardingComplete && !hasCompletedProfile) ? (
                <Onboarding
                  user={session.user}
                  profile={profile}
                  initialStep={onboardingStep}
                  onComplete={handleOnboardingComplete}
                />
              ) : (
                <AppShell user={session.user} onPRUpdate={onPRUpdate} prVersion={prVersion} />
              )
            ) : (
              onboardingComplete ? <Navigate to="/signin" replace /> : <Onboarding onComplete={handleOnboardingComplete} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
