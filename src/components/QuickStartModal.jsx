function QuickStartModal({
  open,
  sessionType,
  sessionLabel,
  exercises,
  onClose,
  onSelect,
  onSearchAll,
}) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'var(--bg-base)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '26px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
          {sessionLabel} Day
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
          aria-label="Close quick start"
        >
          {'\u2715'}
        </button>
      </div>
      <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: "'Barlow', sans-serif" }}>
        Your last {sessionLabel} exercises - tap one to start logging
      </p>

      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: '10px' }}>
        {exercises.map((exercise) => (
          <button
            key={`${sessionType}-${exercise.name}`}
            type="button"
            onClick={() => onSelect(exercise)}
            style={{
              width: '100%',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-card)',
              padding: '14px',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: 'white', fontSize: '16px', fontFamily: "'Barlow', sans-serif", fontWeight: 500 }}>
              {exercise.name}
            </p>
            <span
              style={{
                display: 'inline-block',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '3px 9px',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontFamily: "'Barlow', sans-serif",
              }}
            >
              {exercise.category}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSearchAll}
        style={{
          width: '100%',
          marginTop: '14px',
          padding: '13px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontFamily: "'Barlow', sans-serif",
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Search all exercises
      </button>
    </div>
  )
}

export default QuickStartModal
