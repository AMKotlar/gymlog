import { useEffect } from 'react'

function PRCelebration({ open, exerciseName, weight, reps, prTypes, onDismiss }) {
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => onDismiss(), 2500)
    return () => clearTimeout(timer)
  }, [open, onDismiss])

  if (!open) return null

  const hasWeightPR = prTypes.includes('weight')
  const hasVolumePR = prTypes.includes('volume')
  const setVolume = Number((Number(weight) * Number(reps)).toFixed(2))

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        cursor: 'pointer',
      }}
    >
      <div style={{ width: '100%', maxWidth: '430px', textAlign: 'center' }}>
        <div style={{ fontSize: '62px', marginBottom: '10px' }}>🏆</div>
        <h2 style={{ color: 'var(--accent)', margin: '0 0 14px 0', fontSize: '30px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>New PR!</h2>
        {hasWeightPR ? (
          <p style={{ margin: '0 0 8px 0', color: 'white', fontSize: '17px', fontFamily: "'Barlow', sans-serif" }}>
            New best weight: {weight} kg on {exerciseName}
          </p>
        ) : null}
        {hasVolumePR ? (
          <p style={{ margin: 0, color: 'white', fontSize: '17px', fontFamily: "'Barlow', sans-serif" }}>
            New best set: {weight} kg × {reps} = {setVolume} kg
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default PRCelebration
