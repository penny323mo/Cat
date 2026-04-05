import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '首頁', icon: '🏠', exact: true },
  { to: '/feeding', label: '餵食', icon: '🍱' },
  { to: '/health', label: '健康', icon: '💊' },
  { to: '/photos', label: '相簿', icon: '📷' },
  { to: '/more', label: '更多', icon: '⋯' },
]

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#F4A9C0]/30 safe-area-pb">
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.exact}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
                isActive ? 'text-[#F4A9C0]' : 'text-[#4A4A4A]/50',
              ].join(' ')
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
