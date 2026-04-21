import { useEffect, useMemo, useState } from 'react'

const DISMISS_KEY = 'failr_install_dismissed'

function InstallPrompt() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isStandalone = useMemo(() => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  }, [])

  if (dismissed || isStandalone || !isMobile) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '74px',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        zIndex: 60,
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1 }}>⚡</span>
        <div>
          <p style={{ margin: 0, color: '#ffffff', fontFamily: "'Barlow', sans-serif", fontWeight: 500, fontSize: '15px' }}>
            Add FAILR to your homescreen
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontFamily: "'Barlow', sans-serif", fontSize: '12px' }}>
            Tap Share {'\u2192'} Add to Home Screen
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontSize: '16px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: '4px',
        }}
      >
        {'\u2715'}
      </button>
    </div>
  )
}

export default InstallPrompt
