function Skeleton({ width = '100%', height = '16px', borderRadius = '8px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-elevated)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export default Skeleton
