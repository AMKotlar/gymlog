import { formatDateKey, localDateKeyFromISO } from '../utils/dateUtils'

function StrengthChart({ sets, exerciseName }) {
  const pointsByDate = {}
  for (const set of sets.filter((s) => s.exercise_name === exerciseName)) {
    const dateKey = localDateKeyFromISO(set.logged_at)
    if (!pointsByDate[dateKey] || Number(set.weight) > pointsByDate[dateKey]) {
      pointsByDate[dateKey] = Number(set.weight)
    }
  }

  const points = Object.entries(pointsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight]) => ({ date, weight }))

  if (points.length < 2) {
    return (
      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Barlow', sans-serif" }}>
        Log more sessions to see your progress chart
      </p>
    )
  }

  const chartWidth = 300
  const chartHeight = 120
  const padding = { left: 20, right: 10, top: 10, bottom: 20 }
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const minWeight = Math.min(...points.map((p) => p.weight)) - 5
  const maxWeight = Math.max(...points.map((p) => p.weight)) + 5
  const range = maxWeight - minWeight || 1

  const toX = (index) => padding.left + (index / (points.length - 1)) * plotWidth
  const toY = (weight) => padding.top + ((maxWeight - weight) / range) * plotHeight

  const polylinePoints = points.map((point, i) => `${toX(i)},${toY(point.weight)}`).join(' ')
  const prWeight = Math.max(...points.map((p) => p.weight))
  const prY = toY(prWeight)
  const xAxisChartWidth = 260
  const showMiddle = points.length >= 5
  const formatXAxisLabel = (dateValue) => formatDateKey(dateValue).replace(/\w+,\s*/, '').replace(/\w+ /, '')

  const yTicks = [0, 1, 2].map((i) => {
    const value = maxWeight - (range / 2) * i
    return { value: Math.round(value), y: padding.top + (plotHeight / 2) * i }
  })

  let xLabels = [
    { index: 0, label: formatXAxisLabel(points[0].date) },
    ...(showMiddle
      ? [
          {
            index: Math.floor(points.length / 2),
            label: formatXAxisLabel(points[Math.floor(points.length / 2)].date),
          },
        ]
      : []),
    { index: points.length - 1, label: formatXAxisLabel(points[points.length - 1].date) },
  ]

  if (xLabels.length === 3) {
    const firstX = (xLabels[0].index / (points.length - 1)) * xAxisChartWidth
    const middleX = (xLabels[1].index / (points.length - 1)) * xAxisChartWidth
    const lastX = (xLabels[2].index / (points.length - 1)) * xAxisChartWidth
    if (middleX - firstX < 60 || lastX - middleX < 60) {
      xLabels = [xLabels[0], xLabels[2]]
    }
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <svg viewBox="0 0 300 120" width="100%" height="120" style={{ display: 'block', overflow: 'visible' }}>
        {yTicks.map((tick) => (
          <g key={`tick-${tick.y}`}>
            <line x1={padding.left} y1={tick.y} x2={chartWidth - padding.right} y2={tick.y} stroke="var(--border)" strokeWidth="1" />
            <text x={2} y={tick.y + 3} fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="var(--text-muted)">
              {tick.value}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          y1={prY}
          x2={chartWidth - padding.right}
          y2={prY}
          stroke="rgba(204,255,0,0.3)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text
          x={chartWidth - padding.right - 2}
          y={prY - 3}
          textAnchor="end"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="8"
          fill="var(--accent)"
        >
          PR
        </text>

        <polyline fill="none" stroke="#CCFF00" strokeWidth="2" points={polylinePoints} />

        {points.map((point, i) => {
          const isLast = i === points.length - 1
          return (
            <circle
              key={`${point.date}-${point.weight}`}
              cx={toX(i)}
              cy={toY(point.weight)}
              r={isLast ? 4 : 3}
              fill="#CCFF00"
              style={isLast ? { filter: 'drop-shadow(0 0 4px #CCFF00)' } : undefined}
            />
          )
        })}

        {xLabels.map((item, i) => (
          <text
            key={`${item.index}-${item.label}`}
            x={toX(item.index)}
            y={chartHeight - 4}
            textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
            fontFamily="'Barlow', sans-serif"
            fontSize="8"
            fill="var(--text-muted)"
          >
            {item.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default StrengthChart
