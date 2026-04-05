import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/authStore'

export function MorePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const sections = [
    {
      title: '記錄',
      items: [
        { icon: '⚖️', label: '體重追蹤', to: '/weight' },
        { icon: '😸', label: '心情日記', to: '/mood' },
        { icon: '🏆', label: '里程碑', to: '/milestones' },
        { icon: '💰', label: '開支記錄', to: '/expenses' },
      ],
    },
    {
      title: '管理',
      items: [
        { icon: '🐱', label: '貓咪檔案', to: '/profile' },
        { icon: '📖', label: '新手指南', to: '/guide' },
      ],
    },
  ]

  return (
    <PageLayout>
      <Header title="更多" />

      <div className="px-4 py-4 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-medium text-[#4A4A4A]/40 mb-2 px-1">{section.title}</p>
            <Card padding={false}>
              {section.items.map((item, i) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF5E6] transition-colors',
                    i < section.items.length - 1 ? 'border-b border-[#F4A9C0]/10' : '',
                  ].join(' ')}
                >
                  <span className="text-xl w-8">{item.icon}</span>
                  <span className="text-[#4A4A4A] font-medium">{item.label}</span>
                  <span className="ml-auto text-[#4A4A4A]/30">›</span>
                </button>
              ))}
            </Card>
          </div>
        ))}

        {user && (
          <div className="pt-4">
            <p className="text-xs text-[#4A4A4A]/40 text-center mb-3">{user.email}</p>
            <Button
              variant="ghost"
              fullWidth
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/login')
              }}
            >
              登出
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
