import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  {
    label: 'Home',
    path: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    label: 'History',
    path: '/history',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    label: 'PRs',
    path: '/prs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
        <path d="M6 6H4a3 3 0 0 0 3 3M18 6h2a3 3 0 0 1-3 3" />
        <path d="M12 11v4M9 19h6M10 15h4" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
]

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 flex h-16 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#0f0f1a]">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 ${
              active ? 'text-[#7c3aed]' : 'text-white/50'
            }`}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
