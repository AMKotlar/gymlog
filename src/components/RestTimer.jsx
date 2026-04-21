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
        background: 'var(--bg-base)',
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>Rest timer</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '20px', margin: '6px 0 0 0' }}>{exerciseName}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              color: 'var(--accent)',
              fontSize: '72px',
              margin: 0,
              fontFamily: "'IBM Plex Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.03em',
            }}
          >
            {formatClock(remaining)}
          </p>
          {completeMessage ? (
            <p style={{ margin: '10px 0 0 0', color: 'var(--accent)', fontSize: '15px', fontFamily: "'IBM Plex Mono', monospace" }}>Rest complete — go!</p>
          ) : null}
          <div
            style={{
              marginTop: '18px',
              width: '100%',
              height: '4px',
              background: 'var(--border)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
                height: '100%',
                background: 'var(--accent)',
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
                  border: selectedRest === item.seconds ? '1px solid var(--accent-border)' : '1px solid var(--border-strong)',
                  background: selectedRest === item.seconds ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: selectedRest === item.seconds ? '#000000' : 'var(--text-secondary)',
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
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
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
