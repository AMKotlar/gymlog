import { useState } from 'react'
import { supabase } from '../supabase'

const screens = [
  {
    tag: 'WELCOME TO FAILR',
    headline: 'Most apps track\nwhat you did.',
    subheadline: 'FAILR tells you what\nyou need to do.',
    body: 'Every session starts with a mission. Every set has a target. Every rep counts toward failure — which is exactly the goal.',
    cta: 'SHOW ME HOW',
  },
  {
    tag: 'THE SCIENCE',
    headline: 'Not all reps\nare equal.',
    subheadline: 'Only the last few\nreps before failure\nactually build muscle.',
    body: 'FAILR tracks your Reps In Reserve (RIR) — how many more reps you could have done. This tells us your real growth stimulus, not just your volume.',
    cta: 'GOT IT',
  },
  {
    tag: 'YOUR CONTRACT',
    headline: 'Before every set,\naccept a contract.',
    subheadline: 'FAILR shows you what\nyou need to beat.\nThen you go beat it.',
    body: 'Based on your last session, FAILR sets you a target. More reps or more weight. You commit before you lift. That commitment is the difference.',
    cta: 'START TRAINING',
  },
]

function Onboarding({ userId, onComplete }) {
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  const current = screens[step]
  const isLast = step === screens.length - 1

  const handleNext = async () => {
    if (isLast) {
      setCompleting(true)
      await supabase
        .from('profiles')
        .upsert(
          { id: userId, onboarding_completed: true, updated_at: new Date().toISOString() },
          { onConflict: 'id' },
        )
      onComplete()
      return
    }
    setStep(step + 1)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 28px 40px',
        maxWidth: '430px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', marginBottom: '48px' }}>
        {screens.map((_, i) => (
          <div
            key={i}
            style={{
              height: '3px',
              flex: 1,
              borderRadius: '2px',
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '24px',
        }}
      >
        {current.tag}
      </p>

      <h1
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '36px',
          fontWeight: 700,
          color: 'white',
          lineHeight: 1.15,
          marginBottom: '16px',
          whiteSpace: 'pre-line',
        }}
      >
        {current.headline}
      </h1>

      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '18px',
          fontWeight: 400,
          color: 'var(--accent)',
          lineHeight: 1.4,
          marginBottom: '28px',
          whiteSpace: 'pre-line',
        }}
      >
        {current.subheadline}
      </p>

      <p
        style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: '16px',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {current.body}
      </p>

      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '12px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        {step + 1} / {screens.length}
      </p>

      <button
        onClick={handleNext}
        disabled={completing}
        style={{
          width: '100%',
          height: '56px',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: 'var(--accent)',
          color: '#000000',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          cursor: completing ? 'not-allowed' : 'pointer',
          opacity: completing ? 0.7 : 1,
        }}
      >
        {completing ? 'LOADING...' : current.cta}
      </button>

      {!isLast && (
        <button
          onClick={async () => {
            setCompleting(true)
            await supabase
              .from('profiles')
              .upsert(
                { id: userId, onboarding_completed: true, updated_at: new Date().toISOString() },
                { onConflict: 'id' },
              )
            onComplete()
          }}
          style={{
            marginTop: '14px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: "'Barlow', sans-serif",
            fontSize: '13px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          Skip intro
        </button>
      )}
    </div>
  )
}

export default Onboarding
