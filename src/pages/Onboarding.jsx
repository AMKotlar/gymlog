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

const FONT_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@700;800;900&display=swap'

const BRAND = {
  background: '#080808',
  surface: '#111111',
  elevated: '#1a1a1a',
  accent: '#CCFF00',
  accentDim: 'rgba(204,255,0,0.1)',
  accentBorder: 'rgba(204,255,0,0.3)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.25)',
  border: 'rgba(255,255,255,0.08)',
}

function formatMetricValue(value) {
  return value % 1 === 0 ? `${value}` : value.toFixed(1)
}

function baseButtonStyle(disabled, overrides = {}) {
  return {
    width: '100%',
    minHeight: '52px',
    border: 'none',
    borderRadius: '8px',
    background: BRAND.accent,
    color: '#000000',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity 0.2s ease',
    ...overrides,
  }
}

function titleStyle(fontSize) {
  return {
    margin: 0,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize,
    fontWeight: 900,
    textTransform: 'uppercase',
    color: BRAND.textPrimary,
    lineHeight: 1.02,
  }
}

function bodyTextStyle(overrides = {}) {
  return {
    fontFamily: "'Barlow', sans-serif",
    color: BRAND.textSecondary,
    ...overrides,
  }
}

function monoLabelStyle(overrides = {}) {
  return {
    fontFamily: "'IBM Plex Mono', monospace",
    color: BRAND.textMuted,
    fontSize: '12px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    ...overrides,
  }
}

function authInputStyle(isFocused) {
  return {
    background: BRAND.surface,
    border: isFocused ? '1px solid rgba(204,255,0,0.5)' : `1px solid ${BRAND.border}`,
    borderRadius: '8px',
    padding: '14px 16px',
    color: BRAND.textPrimary,
    fontFamily: "'Barlow', sans-serif",
    fontSize: '16px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
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
  const [focusedInput, setFocusedInput] = useState('')
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
    const hasRequestedPreconnect = Array.from(document.querySelectorAll('link[rel="preconnect"]')).some(
      (link) => link.href === 'https://fonts.googleapis.com/' || link.href === 'https://fonts.googleapis.com',
    )
    if (!hasRequestedPreconnect) {
      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = 'https://fonts.googleapis.com'
      preconnect.setAttribute('data-onboarding-fonts', 'preconnect')
      document.head.appendChild(preconnect)
    }

    const hasFontStylesheet = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(
      (link) => link.href.includes('IBM+Plex+Mono') && link.href.includes('Barlow+Condensed'),
    )
    if (!hasFontStylesheet) {
      const stylesheet = document.createElement('link')
      stylesheet.rel = 'stylesheet'
      stylesheet.href = FONT_STYLESHEET_HREF
      stylesheet.setAttribute('data-onboarding-fonts', 'stylesheet')
      document.head.appendChild(stylesheet)
    }
  }, [])

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
    background: BRAND.background,
    color: BRAND.textPrimary,
    '--bg-elevated': BRAND.surface,
    '--border': BRAND.border,
    '--text-primary': BRAND.textPrimary,
    '--text-secondary': BRAND.textSecondary,
    '--text-muted': BRAND.textMuted,
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
            background: BRAND.background,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '52px',
              fontWeight: '700',
              color: BRAND.accent,
              letterSpacing: '0.05em',
            }}
          >
            FAILR
          </div>
          <div style={{ width: '40px', height: '3px', background: BRAND.accent, borderRadius: '2px', marginTop: '12px' }} />
          <div
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: '13px',
              color: 'rgba(255,255,255,0.35)',
              marginTop: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Just Fail It
          </div>
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
            <div style={{ textAlign: 'center', fontSize: '64px', marginBottom: '28px' }}>{currentIntro.icon}</div>
            <h1 style={{ ...titleStyle('36px'), textAlign: 'center' }}>
              {currentIntro.headline}
            </h1>
            <p style={{ ...bodyTextStyle({ margin: '16px auto 0', maxWidth: '300px', textAlign: 'center', fontSize: '16px', lineHeight: 1.6 }) }}>
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
                    background: index === introIndex ? BRAND.accent : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={nextIntroScreen}
              style={baseButtonStyle(false, { padding: '16px', minHeight: 'unset', borderRadius: '8px' })}
            >
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
            <h1 style={titleStyle('32px')}>
              {authMode === 'signup' ? 'Create your account' : 'Sign in'}
            </h1>
            <p style={{ ...bodyTextStyle({ margin: '10px 0 28px', fontSize: '16px' }) }}>
              {authMode === 'signup' ? 'Start your journey' : 'Welcome back'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput('')}
                placeholder="Email"
                style={authInputStyle(focusedInput === 'email')}
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput('')}
                placeholder="Password"
                style={authInputStyle(focusedInput === 'password')}
              />
              {authMode === 'signup' ? (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput('')}
                  placeholder="Confirm password"
                  style={authInputStyle(focusedInput === 'confirmPassword')}
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
              <p style={{ ...bodyTextStyle({ margin: '12px 0 0', color: '#f87171', fontSize: '14px' }) }}>{authError}</p>
            ) : null}
            {authMessage ? (
              <p style={{ ...bodyTextStyle({ margin: '12px 0 0', color: BRAND.textSecondary, fontSize: '14px' }) }}>{authMessage}</p>
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
                  color: BRAND.accent,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '13px',
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
                color: BRAND.accent,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '13px',
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
          <h1 style={titleStyle('32px')}>What should we call you?</h1>
          <p style={{ ...bodyTextStyle({ margin: '10px 0 48px', fontSize: '16px' }) }}>
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
                borderBottom: `2px solid ${BRAND.accent}`,
                fontSize: '28px',
                textAlign: 'center',
                color: BRAND.textPrimary,
                fontFamily: "'Barlow', sans-serif",
                outline: 'none',
                width: '100%',
                padding: '8px 0',
              }}
            />
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ ...bodyTextStyle({ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }) }}>{stepError}</p> : null}
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
          <h1 style={titleStyle('32px')}>
            Hey {displayName}! Tell us about yourself
          </h1>
          <p style={{ ...bodyTextStyle({ margin: '10px 0 28px', fontSize: '16px' }) }}>
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
                    background: selected ? BRAND.accentDim : BRAND.surface,
                    border: selected ? `2px solid ${BRAND.accent}` : `1px solid ${BRAND.border}`,
                    borderRadius: '12px',
                    padding: '20px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: selected ? BRAND.accent : BRAND.textPrimary,
                  }}
                >
                  <div style={{ fontSize: '30px', marginBottom: '10px' }}>{option.emoji}</div>
                  <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '15px', fontWeight: 700 }}>{option.label}</div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ ...bodyTextStyle({ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }) }}>{stepError}</p> : null}
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
          <h1 style={titleStyle('32px')}>Your body stats</h1>
          <p style={{ ...bodyTextStyle({ margin: '10px 0 28px', fontSize: '16px' }) }}>
            Used to calculate your training metrics
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <p style={{ ...monoLabelStyle({ margin: '0 0 12px', textAlign: 'center' }) }}>Birth year</p>
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
              <p style={{ ...monoLabelStyle({ margin: '0 0 12px', textAlign: 'center' }) }}>Height (cm)</p>
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
            {stepError ? <p style={{ ...bodyTextStyle({ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }) }}>{stepError}</p> : null}
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
          <h1 style={titleStyle('32px')}>Your starting weight</h1>
          <p style={{ ...bodyTextStyle({ margin: '10px 0 28px', fontSize: '16px' }) }}>
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
            <p style={{ ...monoLabelStyle({ margin: '10px 0 0', textAlign: 'center', fontSize: '13px', color: BRAND.textSecondary }) }}>kg</p>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ ...bodyTextStyle({ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }) }}>{stepError}</p> : null}
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
          <h1 style={titleStyle('32px')}>What&apos;s your main goal?</h1>
          <p style={{ ...bodyTextStyle({ margin: '10px 0 24px', fontSize: '16px' }) }}>
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
                    borderRadius: '12px',
                    border: selected ? `2px solid ${BRAND.accent}` : `1px solid ${BRAND.border}`,
                    background: selected ? BRAND.accentDim : BRAND.surface,
                    color: selected ? BRAND.accent : BRAND.textPrimary,
                    cursor: 'pointer',
                    padding: '18px 16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '30px' }}>{option.emoji}</div>
                    <div>
                      <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: '17px', fontWeight: 700 }}>{option.title}</div>
                      <div style={{ ...bodyTextStyle({ marginTop: '4px', fontSize: '13px', color: selected ? BRAND.accent : BRAND.textSecondary }) }}>{option.subtitle}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            {stepError ? <p style={{ ...bodyTextStyle({ margin: '0 0 12px', color: '#f87171', fontSize: '14px' }) }}>{stepError}</p> : null}
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
        <h1 style={{ ...titleStyle('36px'), textAlign: 'center' }}>
          You&apos;re ready, {displayName}!
        </h1>
        <p style={{ ...bodyTextStyle({ margin: '12px 0 24px', fontSize: '16px', textAlign: 'center' }) }}>
          Time to go beyond your limits.
        </p>

        <div
          style={{
            width: '100%',
            borderRadius: '12px',
            border: `1px solid ${BRAND.border}`,
            background: BRAND.surface,
            padding: '20px',
            marginBottom: '28px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <span style={{ ...monoLabelStyle({ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }) }}>Name</span>
            <span style={{ fontFamily: "'Barlow', sans-serif", color: BRAND.textPrimary, fontSize: '16px' }}>{displayName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ ...monoLabelStyle({ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }) }}>Goal</span>
            <span style={{ fontFamily: "'Barlow', sans-serif", color: BRAND.textPrimary, fontSize: '16px' }}>{goalSummary}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={finishOnboarding}
          style={baseButtonStyle(false, { fontSize: '15px', padding: '18px', minHeight: 'unset' })}
        >
          LOG MY FIRST SET →
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
                color: 'rgba(255,255,255,0.5)',
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
                fontFamily: "'IBM Plex Mono', monospace",
                color: 'rgba(255,255,255,0.35)',
                fontSize: '12px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
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
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: '8px' }}>
            <div
              style={{
                width: `${(progress / 5) * 100}%`,
                height: '100%',
                background: BRAND.accent,
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
