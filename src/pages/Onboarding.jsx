import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScrollWheel from '../components/ScrollWheel'
import { supabase } from '../supabase'

const INTRO_SCREENS = [
  {
    icon: '📊',
    headline: 'Track every set',
    subtitle: 'Log weight, reps and intensity for every exercise in seconds.',
    buttonLabel: 'Next',
  },
  {
    icon: '💪',
    headline: 'Know your limits',
    subtitle: 'RIR tracking shows exactly how hard you pushed each set.',
    buttonLabel: 'Next',
  },
  {
    icon: '🚀',
    headline: 'Go beyond them',
    subtitle: 'Watch your volume grow session by session.',
    buttonLabel: 'Get Started',
  },
]

const GENDER_OPTIONS = [
  { emoji: '👨', label: 'Male', value: 'male' },
  { emoji: '👩', label: 'Female', value: 'female' },
  { emoji: '🙋', label: 'Other', value: 'other' },
]

const GOAL_OPTIONS = [
  {
    emoji: '💪',
    title: 'Build muscle',
    subtitle: 'Progressive overload and volume tracking',
    value: 'muscle',
  },
  {
    emoji: '🔥',
    title: 'Lose fat',
    subtitle: 'Consistency and calorie-burning focus',
    value: 'fat',
  },
  {
    emoji: '⚡',
    title: 'Get stronger',
    subtitle: 'Heavier weights, better performance',
    value: 'strength',
  },
]

const GOAL_LABELS = {
  muscle: 'Build muscle',
  fat: 'Lose fat',
  strength: 'Get stronger',
}

const STEP_PROGRESS = {
  6: 1,
  7: 2,
  8: 3,
  9: 4,
  10: 5,
}

function formatMetricValue(value) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1)
}

function baseButtonStyle(disabled) {
  return {
    width: '100%',
    minHeight: '52px',
    border: 'none',
    borderRadius: '14px',
    background: '#7c3aed',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity 0.2s ease',
  }
}

function Onboarding({
  user = null,
  profile = null,
  initialStep = 1,
  initialAuthMode = 'signup',
  signInOnly = false,
  onComplete,
}) {
  const navigate = useNavigate()
  const [step, setStep] = useState(initialStep)
  const [transitionPhase, setTransitionPhase] = useState('entered')
  const [authMode, setAuthMode] = useState(initialAuthMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [firstName, setFirstName] = useState(profile?.name ?? '')
  const [selectedGender, setSelectedGender] = useState(profile?.gender ?? '')
  const [birthYear, setBirthYear] = useState(profile?.birth_year ?? 1990)
  const [heightCm, setHeightCm] = useState(profile?.height_cm ?? 170)
  const [startingWeight, setStartingWeight] = useState(profile?.weight_kg ?? 70)
  const [selectedGoal, setSelectedGoal] = useState(profile?.goal ?? '')
  const [stepLoading, setStepLoading] = useState(false)
  const [stepError, setStepError] = useState('')

  const transitionTimeoutRef = useRef(null)
  const enterFrameRef = useRef(null)
  const touchStartX = useRef(0)

  useEffect(() => {
    setAuthMode(initialAuthMode)
  }, [initialAuthMode])

  useEffect(() => {
    if (!user?.id) return
    setFirstName(profile?.name ?? '')
    setSelectedGender(profile?.gender ?? '')
    setBirthYear(profile?.birth_year ?? 1990)
    setHeightCm(profile?.height_cm ?? 170)
    setStartingWeight(profile?.weight_kg ?? 70)
    setSelectedGoal(profile?.goal ?? '')
  }, [profile, user?.id])

  useEffect(() => {
    if (!user?.id || step >= 6) return
    transitionToStep(initialStep >= 6 ? initialStep : 6)
  }, [initialStep, step, user?.id])

  useEffect(() => {
    if (step !== 1 || signInOnly) return
    const timeout = window.setTimeout(() => {
      transitionToStep(2)
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [step, signInOnly])

  useEffect(() => {
    if (!user?.id || step < 6 || step > 11) return
    localStorage.setItem('onboardingStep', String(step))
  }, [step, user?.id])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
      if (enterFrameRef.current) {
        window.cancelAnimationFrame(enterFrameRef.current)
      }
    }
  }, [])

  const transitionToStep = (nextStep) => {
    if (nextStep === step || transitionPhase === 'exiting') return
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current)
    }
    if (enterFrameRef.current) {
      window.cancelAnimationFrame(enterFrameRef.current)
    }

    setTransitionPhase('exiting')
    transitionTimeoutRef.current = window.setTimeout(() => {
      setStep(nextStep)
      setTransitionPhase('entering')
      enterFrameRef.current = window.requestAnimationFrame(() => {
        enterFrameRef.current = window.requestAnimationFrame(() => {
          setTransitionPhase('entered')
        })
      })
    }, 200)
  }

  const saveProfilePatch = async (patch) => {
    if (!user?.id) {
      return { error: { message: 'Create an account to continue.' } }
    }

    return supabase.from('profiles').upsert(
      {
        id: user.id,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
  }

  const nextIntroScreen = () => {
    if (step >= 2 && step < 4) {
      transitionToStep(step + 1)
      return
    }
    if (step === 4) {
      transitionToStep(5)
    }
  }

  const prevIntroScreen = () => {
    if (step > 2 && step <= 4) {
      transitionToStep(step - 1)
      return
    }
    if (step === 2) {
      transitionToStep(1)
    }
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX
  }

  const handleTouchEnd = (event) => {
    const diff = touchStartX.current - event.changedTouches[0].clientX
    if (diff > 50) nextIntroScreen()
    if (diff < -50) prevIntroScreen()
  }

  const handleBack = () => {
    if (signInOnly) {
      navigate('/', { replace: true })
      return
    }
    transitionToStep(Math.max(1, step - 1))
  }

  const handleSkip = () => {
    setStepError('')
    if (step === 7) transitionToStep(8)
    if (step === 8) transitionToStep(9)
    if (step === 9) transitionToStep(10)
  }

  const handleAuthSubmit = async () => {
    setAuthError('')
    setAuthMessage('')

    if (!email.trim() || !password) {
      setAuthError('Enter your email and password.')
      return
    }

    if (authMode === 'signup') {
      if (!confirmPassword) {
        setAuthError('Confirm your password.')
        return
      }
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match.')
        return
      }
    }

    setAuthLoading(true)

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      setAuthLoading(false)

      if (error) {
        setAuthError(error.message)
        return
      }

      if (data?.session) {
        setAuthMessage('Account created. Continuing...')
        return
      }

      setAuthMessage('Check your email to confirm your account.')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setAuthLoading(false)

    if (error) {
      setAuthError(error.message)
      return
    }

    navigate('/', { replace: true })
  }

  const handleForgotPassword = async () => {
    setAuthError('')
    setAuthMessage('')

    if (!email.trim()) {
      setAuthError('Enter your email first.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) {
      setAuthError(error.message)
      return
    }

    setAuthMessage('Password reset email sent.')
  }

  const continueWithName = async () => {
    setStepError('')
    if (!firstName.trim()) return

    setStepLoading(true)
    const { error } = await saveProfilePatch({ name: firstName.trim() })
    setStepLoading(false)

    if (error) {
      setStepError(error.message)
      return
    }

    transitionToStep(7)
  }

  const continueWithGender = async () => {
    setStepError('')
    if (!selectedGender) return

    setStepLoading(true)
    const { error } = await saveProfilePatch({ gender: selectedGender })
    setStepLoading(false)

    if (error) {
      setStepError(error.message)
      return
    }

    transitionToStep(8)
  }

  const continueWithStats = async () => {
    setStepError('')
    setStepLoading(true)

    const { error } = await saveProfilePatch({
      birth_year: Number(birthYear),
      height_cm: Number(heightCm),
    })

    setStepLoading(false)

    if (error) {
      setStepError(error.message)
      return
    }

    transitionToStep(9)
  }

  const continueWithWeight = async () => {
    setStepError('')
    setStepLoading(true)

    const numericWeight = Number(startingWeight)
    const { error: profileError } = await saveProfilePatch({ weight_kg: numericWeight })

    if (profileError) {
      setStepLoading(false)
      setStepError(profileError.message)
      return
    }

    const { error: logError } = await supabase.from('weight_logs').insert({
      user_id: user.id,
      weight_kg: numericWeight,
      logged_at: new Date().toISOString(),
    })

    if (logError) {
      await supabase.from('weight_history').upsert(
        {
          user_id: user.id,
          weight_kg: numericWeight,
          recorded_on: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'user_id,recorded_on' },
      )
    }

    setStepLoading(false)
    transitionToStep(10)
  }

  const continueWithGoal = async () => {
    setStepError('')
    if (!selectedGoal) return

    setStepLoading(true)
    const { error } = await saveProfilePatch({ goal: selectedGoal })
    setStepLoading(false)

    if (error) {
      setStepError(error.message)
      return
    }

    transitionToStep(11)
  }

  const finishOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true')
    localStorage.removeItem('onboardingStep')
    onComplete?.()
    navigate('/', { replace: true, state: { openExerciseSearch: true } })
  }

  const introIndex = step >= 2 && step <= 4 ? step - 2 : 0
  const currentIntro = INTRO_SCREENS[introIndex]
  const progress = STEP_PROGRESS[step] ?? 0
  const showProgress = step >= 6 && step <= 10
  const showBackButton = !signInOnly && step !== 1 && step !== 11
  const showSkipButton = step === 7 || step === 8 || step === 9
  const displayName = firstName.trim() || profile?.name || 'there'
  const goalSummary = useMemo(() => GOAL_LABELS[selectedGoal] ?? 'Your goal', [selectedGoal])

  const shellStyle = {
    minHeight: '100vh',
    background: '#0f0f1a',
    color: 'white',
  }

  const contentTransitionStyle = {
    opacity: transitionPhase === 'entered' ? 1 : 0,
    transform:
      transitionPhase === 'entered'
        ? 'translateY(0px)'
        : transitionPhase === 'exiting'
          ? 'translateY(12px)'
          : 'translateY(-12px)',
    transition: 'opacity 200ms ease, transform 200ms ease',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }

  if (step === 1 && !signInOnly) {
    return (
      <div style={shellStyle}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0f0f1a',
          }}
        >
          <div style={{ fontSize: '48px', fontWeight: '700', color: 'white', letterSpacing: '-2px' }}>FAILR</div>
          <div style={{ width: '40px', height: '3px', background: '#7c3aed', borderRadius: '2px', marginTop: '12px' }} />
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    if (step >= 2 && step <= 4) {
      return (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            ...contentTransitionStyle,
            justifyContent: 'space-between',
            paddingTop: '48px',
            paddingBottom: '16px',
          }}
        >
          <div>
            <div style={{ textAlign: 'center', fontSize: '72px', marginBottom: '28px' }}>{currentIntro.icon}</div>
            <h1
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: '34px',
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {currentIntro.headline}
            </h1>
            <p
              style={{
                margin: '16px auto 0',
                maxWidth: '300px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '16px',
                lineHeight: 1.6,
              }}
            >
              {currentIntro.subtitle}
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {INTRO_SCREENS.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: index === introIndex ? '22px' : '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: index === introIndex ? '#7c3aed' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
            <button type="button" onClick={nextIntroScreen} style={baseButtonStyle(false)}>
              {currentIntro.buttonLabel}
            </button>
          </div>
        </div>
      )
    }

    if (step === 5) {
      return (
        <div
          style={{
            ...contentTransitionStyle,
            justifyContent: 'center',
            paddingTop: signInOnly ? '60px' : '24px',
            paddingBottom: '16px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {authMode === 'signup' ? 'Create your account' : 'Sign in'}
            </h1>
            <p style={{ margin: '10px 0 28px', color: 'rgba(255,255,255,0.65)', fontSize: '16px' }}>
              {authMode === 'signup' ? 'Start your journey' : 'Welcome back'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                style={{
                  width: '100%',
                  minHeight: '52px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#17172a',
                  color: 'white',
                  fontSize: '15px',
                  padding: '0 16px',
                  outline: 'none',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  minHeight: '52px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: '#17172a',
                  color: 'white',
                  fontSize: '15px',
                  padding: '0 16px',
                  outline: 'none',
                }}
              />
              {authMode === 'signup' ? (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: '#17172a',
                    color: 'white',
                    fontSize: '15px',
                    padding: '0 16px',
                    outline: 'none',
                  }}
                />
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleAuthSubmit}
              disabled={authLoading}
              style={{ ...baseButtonStyle(authLoading), marginTop: '18px' }}
            >
              {authLoading
                ? authMode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : authMode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>

            {authError ? (
              <p style={{ margin: '12px 0 0', color: '#f87171', fontSize: '14px' }}>{authError}</p>
            ) : null}
            {authMessage ? (
              <p style={{ margin: '12px 0 0', color: 'rgba(255,255,255,0.68)', fontSize: '14px' }}>{authMessage}</p>
            ) : null}

            {authMode === 'signin' ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  marginTop: '16px',
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Forgot password?
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setAuthError('')
                setAuthMessage('')
                setAuthMode((current) => (current === 'signup' ? 'signin' : 'signup'))
              }}
              style={{
                marginTop: '20px',
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.72)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {authMode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      )
    }

    if (step === 6) {
      return (
        <div style={{ ...contentTransitionStyle, paddingTop: '72px', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>What should we call you?</h1>
          <p style={{ margin: '10px 0 48px', color: 'rgba(255,255,255,0.65)', fontSize: '16px' }}>
            We&apos;ll use this to personalize your experience
          </p>

          <div style={{ marginTop: '30px' }}>
            <input
              autoFocus
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Your first name"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid #7c3aed',
                fontSize: '28px',
                textAlign: 'center',
                color: 'white',
                outline: 'none',
                width: '100%',
                padding: '8px 0',
              }}
            />
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }}>{stepError}</p> : null}
            <button
              type="button"
              onClick={continueWithName}
              disabled={stepLoading || firstName.trim().length < 1}
              style={baseButtonStyle(stepLoading || firstName.trim().length < 1)}
            >
              {stepLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )
    }

    if (step === 7) {
      return (
        <div style={{ ...contentTransitionStyle, paddingTop: '48px', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Hey {displayName}! Tell us about yourself
          </h1>
          <p style={{ margin: '10px 0 28px', color: 'rgba(255,255,255,0.65)', fontSize: '16px' }}>
            This helps us personalize your experience
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {GENDER_OPTIONS.map((option) => {
              const selected = selectedGender === option.value
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setSelectedGender(option.value)}
                  style={{
                    background: selected ? 'rgba(124,58,237,0.2)' : '#17172a',
                    border: selected ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '20px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: 'white',
                  }}
                >
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>{option.emoji}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>{option.label}</div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }}>{stepError}</p> : null}
            <button
              type="button"
              onClick={continueWithGender}
              disabled={stepLoading || !selectedGender}
              style={baseButtonStyle(stepLoading || !selectedGender)}
            >
              {stepLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )
    }

    if (step === 8) {
      return (
        <div style={{ ...contentTransitionStyle, paddingTop: '48px', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>Your body stats</h1>
          <p style={{ margin: '10px 0 28px', color: 'rgba(255,255,255,0.65)', fontSize: '16px' }}>
            Used to calculate your training metrics
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Birth year</p>
              <ScrollWheel
                value={birthYear}
                onChange={setBirthYear}
                step={1}
                min={1940}
                max={2010}
                format={(value) => `${value}`}
              />
            </div>
            <div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>Height (cm)</p>
              <ScrollWheel
                value={heightCm}
                onChange={setHeightCm}
                step={1}
                min={100}
                max={250}
                format={(value) => `${value}`}
              />
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }}>{stepError}</p> : null}
            <button type="button" onClick={continueWithStats} disabled={stepLoading} style={baseButtonStyle(stepLoading)}>
              {stepLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )
    }

    if (step === 9) {
      return (
        <div style={{ ...contentTransitionStyle, paddingTop: '48px', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>Your starting weight</h1>
          <p style={{ margin: '10px 0 28px', color: 'rgba(255,255,255,0.65)', fontSize: '16px' }}>
            Used for bodyweight exercise volume
          </p>

          <div style={{ maxWidth: '220px', margin: '0 auto' }}>
            <ScrollWheel
              value={startingWeight}
              onChange={setStartingWeight}
              step={0.5}
              min={30}
              max={200}
              format={(value) => formatMetricValue(value)}
            />
            <p style={{ margin: '10px 0 0', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>kg</p>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }}>{stepError}</p> : null}
            <button type="button" onClick={continueWithWeight} disabled={stepLoading} style={baseButtonStyle(stepLoading)}>
              {stepLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )
    }

    if (step === 10) {
      return (
        <div style={{ ...contentTransitionStyle, paddingTop: '48px', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>What&apos;s your main goal?</h1>
          <p style={{ margin: '10px 0 24px', color: 'rgba(255,255,255,0.65)', fontSize: '16px' }}>
            This shapes your experience in FAILR
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {GOAL_OPTIONS.map((option) => {
              const selected = selectedGoal === option.value
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setSelectedGoal(option.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    borderRadius: '16px',
                    border: selected ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.1)',
                    background: selected ? 'rgba(124,58,237,0.2)' : '#17172a',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '18px 16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '30px' }}>{option.emoji}</div>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 600 }}>{option.title}</div>
                      <div style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{option.subtitle}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }}>{stepError}</p> : null}
            <button
              type="button"
              onClick={continueWithGoal}
              disabled={stepLoading || !selectedGoal}
              style={baseButtonStyle(stepLoading || !selectedGoal)}
            >
              {stepLoading ? 'Saving...' : "Let's go"}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        style={{
          ...contentTransitionStyle,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingTop: '40px',
          paddingBottom: '20px',
        }}
      >
        <div style={{ fontSize: '58px', marginBottom: '18px' }}>⚡</div>
        <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          You&apos;re ready, {displayName}!
        </h1>
        <p style={{ margin: '12px 0 24px', color: 'rgba(255,255,255,0.68)', fontSize: '16px' }}>
          Time to go beyond your limits.
        </p>

        <div
          style={{
            width: '100%',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#17172a',
            padding: '18px',
            marginBottom: '28px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</span>
            <span style={{ color: 'white', fontSize: '15px', fontWeight: 600 }}>{displayName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal</span>
            <span style={{ color: '#c4b5fd', fontSize: '15px', fontWeight: 600 }}>{goalSummary}</span>
          </div>
        </div>

        <button type="button" onClick={finishOnboarding} style={baseButtonStyle(false)}>
          Log my first set
        </button>
      </div>
    )
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          maxWidth: '430px',
          minHeight: '100vh',
          margin: '0 auto',
          padding: '18px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ minHeight: '34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {showBackButton ? (
            <button
              type="button"
              onClick={handleBack}
              style={{
                width: '36px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                color: 'white',
                fontSize: '26px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ←
            </button>
          ) : (
            <div style={{ width: '36px', height: '36px' }} />
          )}

          {showSkipButton ? (
            <button
              type="button"
              onClick={handleSkip}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Skip
            </button>
          ) : (
            <div style={{ width: '36px', height: '36px' }} />
          )}
        </div>

        {showProgress ? (
          <div style={{ height: '3px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: '8px' }}>
            <div
              style={{
                width: `${(progress / 5) * 100}%`,
                height: '100%',
                background: '#7c3aed',
                borderRadius: '999px',
                transition: 'width 0.25s ease',
              }}
            />
          </div>
        ) : (
          <div style={{ height: '11px' }} />
        )}

        {renderStepContent()}
      </div>
    </div>
  )
}

export default Onboarding
