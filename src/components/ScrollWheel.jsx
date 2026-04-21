import { useMemo, useRef } from 'react'

function normalize(value, step, min) {
  const adjusted = Math.max(min, value)
  const steps = Math.round((adjusted - min) / step)
  return Number((min + steps * step).toFixed(2))
}

function ScrollWheel({ value, onChange, step, min, format = (v) => `${v}` }) {
  const dragState = useRef({ active: false, y: 0 })

  const values = useMemo(() => {
    return [-2, -1, 0, 1, 2].map((offset) => normalize(value + offset * step, step, min))
  }, [value, step, min])

  const updateFromDelta = (deltaY) => {
    if (Math.abs(deltaY) < 16) return
    const stepsMoved = Math.trunc(deltaY / 16)
    const nextValue = normalize(value + stepsMoved * step, step, min)
    if (nextValue !== value) {
      onChange(nextValue)
    }
    dragState.current.y -= stepsMoved * 16
  }

  return (
    <div
      className="h-44 w-full touch-none select-none overflow-hidden rounded-xl"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
      onPointerDown={(event) => {
        dragState.current = { active: true, y: event.clientY }
      }}
      onPointerMove={(event) => {
        if (!dragState.current.active) return
        const delta = dragState.current.y - event.clientY
        updateFromDelta(delta)
      }}
      onPointerUp={() => {
        dragState.current.active = false
      }}
      onPointerLeave={() => {
        dragState.current.active = false
      }}
      onWheel={(event) => {
        updateFromDelta(event.deltaY)
      }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-2 py-3">
        {values.map((item, idx) => {
          const selected = idx === 2
          return (
            <div
              key={`${item}-${idx}`}
              className="transition-all"
              style={{
                color: selected ? 'var(--text-primary)' : idx === 1 || idx === 3 ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontSize: selected ? '30px' : '18px',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {format(item)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ScrollWheel
