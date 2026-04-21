function SetContract({
  open,
  exerciseName,
  lastSet,
  lastDateLabel,
  pathA,
  pathB,
  selectedPath,
  onSelectPath,
  onAccept,
  onSkip,
}) {
  if (!open || !lastSet) return null

  const formatRir = (rir) => (rir === 0 ? '0' : rir === 1 ? '1-2' : '3+')

  const cardStyle = (active) => ({
    borderRadius: 'var(--radius)',
    border: active ? '1px solid var(--accent-border)' : '1px solid var(--border)',
    background: active ? 'var(--accent-dim)' : 'var(--bg-card)',
    padding: '12px',
    cursor: 'pointer',
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'var(--bg-base)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
        }}
      >
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Set Contract
        </p>
        <h2 style={{ margin: '8px 0 14px 0', fontSize: '22px', color: 'var(--text-primary)', fontWeight: 700 }}>
          {exerciseName}
        </h2>

        <div style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-card)', padding: '12px' }}>
          <p style={{ margin: 0, marginBottom: '8px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Last session — {lastDateLabel}
          </p>
          <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-primary)', fontSize: '15px' }}>
            {lastSet.weight} kg × {lastSet.reps} · RIR {formatRir(lastSet.rir)}
          </p>
        </div>

        <div style={{ margin: '16px 0 12px 0', height: '1px', background: 'var(--border)' }} />

        <p style={{ margin: 0, marginBottom: '10px', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          To progress, beat one of:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button type="button" onClick={() => onSelectPath('A')} style={cardStyle(selectedPath === 'A')}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              More reps
            </p>
            <p style={{ margin: '8px 0 6px 0', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)', fontSize: '23px', fontWeight: 700 }}>
              {pathA.weight} × {pathA.reps}
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '11px' }}>same weight, +1 rep</p>
          </button>
          <button type="button" onClick={() => onSelectPath('B')} style={cardStyle(selectedPath === 'B')}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              More weight
            </p>
            <p style={{ margin: '8px 0 6px 0', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)', fontSize: '23px', fontWeight: 700 }}>
              {pathB.weight} × {pathB.reps}
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '11px' }}>next step, same reps</p>
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            type="button"
            onClick={onAccept}
            style={{
              width: '100%',
              minHeight: '48px',
              border: 'none',
              borderRadius: 'var(--radius)',
              background: 'var(--accent)',
              color: '#000000',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Accept contract
          </button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              width: '100%',
              marginTop: '8px',
              minHeight: '40px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

export default SetContract
