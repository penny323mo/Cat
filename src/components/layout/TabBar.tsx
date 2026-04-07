import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '首頁', icon: '🏠', exact: true },
  { to: '/feeding', label: '餵食', icon: '🍱' },
  { to: '/health', label: '健康', icon: '💊' },
  { to: '/photos', label: '相簿', icon: '📷' },
  { to: '/more', label: '我的', icon: '🐱' },
]

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#F4A9C0]/20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.exact}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors',
                isActive ? 'text-[#F4A9C0]' : 'text-[#4A4A4A]/40',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className={['text-xl transition-transform', isActive ? 'scale-110' : ''].join(' ')}>
                  {tab.icon}
                </span>
                <span className={isActive ? 'font-medium' : ''}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
