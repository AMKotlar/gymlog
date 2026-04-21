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
        zIndex: 90,
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        cursor: 'pointer',
      }}
    >
      <div style={{ width: '100%', maxWidth: '430px', textAlign: 'center' }}>
        <div style={{ fontSize: '62px', marginBottom: '10px' }}>🏆</div>
        <h2 style={{ color: 'white', margin: '0 0 14px 0', fontSize: '30px' }}>New PR!</h2>
        {hasWeightPR ? (
          <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
            New best weight: {weight} kg on {exerciseName}
          </p>
        ) : null}
        {hasVolumePR ? (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
            New best set: {weight} kg × {reps} = {setVolume} kg
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default PRCelebration
