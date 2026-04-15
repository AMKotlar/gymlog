import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './supabase'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import History from './pages/History'
import Profile from './pages/Profile'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

function AppShell({ user }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] bg-[#0f0f1a] pb-20">
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/history" element={<History user={user} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-white">
        Loading...
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
            session ? <AppShell user={session.user} /> : <Navigate to="/signin" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
