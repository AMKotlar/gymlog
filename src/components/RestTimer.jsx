function formatClock(seconds) {
  const safe = Math.max(0, seconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function RestTimer({
  open,
  exerciseName,
  remaining,
  total,
  restOptions,
  selectedRest,
  onSelectRest,
  onSkip,
  completeMessage,
}) {
  if (!open) return null

  const progress = total > 0 ? (total - remaining) / total : 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: '#0f0f1a',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: '100%',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Rest timer</p>
          <p style={{ color: 'white', fontSize: '20px', margin: '6px 0 0 0' }}>{exerciseName}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              color: 'white',
              fontSize: '74px',
              margin: 0,
              fontFamily: 'monospace',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.03em',
            }}
          >
            {formatClock(remaining)}
          </p>
          {completeMessage ? (
            <p style={{ margin: '10px 0 0 0', color: '#86efac', fontSize: '15px' }}>Rest complete — go!</p>
          ) : null}
          <div
            style={{
              marginTop: '18px',
              width: '100%',
              height: '4px',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
                height: '100%',
                background: '#7c3aed',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
            {restOptions.map((item) => (
              <button
                key={item.seconds}
                type="button"
                onClick={() => onSelectRest(item.seconds)}
                style={{
                  minHeight: '44px',
                  borderRadius: '999px',
                  border: selectedRest === item.seconds ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.15)',
                  background: selectedRest === item.seconds ? '#7c3aed' : '#17172a',
                  color: selectedRest === item.seconds ? 'white' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onSkip}
            style={{
              width: '100%',
              minHeight: '44px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          >
            Skip rest
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestTimer
