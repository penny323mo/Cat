import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { DashboardPage } from './pages/DashboardPage'
import { FeedingPage } from './pages/FeedingPage'
import { WeightPage } from './pages/WeightPage'
import { HealthPage } from './pages/HealthPage'
import { MoodPage } from './pages/MoodPage'
import { MilestonePage } from './pages/MilestonePage'
import { PhotoPage } from './pages/PhotoPage'
import { ExpensePage } from './pages/ExpensePage'
import { ProfilePage, NewProfilePage } from './pages/ProfilePage'
import { GuidePage } from './pages/GuidePage'
import { MorePage } from './pages/MorePage'
import { AuthPage } from './pages/AuthPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user === undefined) return null // loading
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/feeding" element={<AuthGuard><FeedingPage /></AuthGuard>} />
          <Route path="/weight" element={<AuthGuard><WeightPage /></AuthGuard>} />
          <Route path="/health" element={<AuthGuard><HealthPage /></AuthGuard>} />
          <Route path="/mood" element={<AuthGuard><MoodPage /></AuthGuard>} />
          <Route path="/milestones" element={<AuthGuard><MilestonePage /></AuthGuard>} />
          <Route path="/photos" element={<AuthGuard><PhotoPage /></AuthGuard>} />
          <Route path="/expenses" element={<AuthGuard><ExpensePage /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="/profile/new" element={<AuthGuard><NewProfilePage /></AuthGuard>} />
          <Route path="/guide" element={<AuthGuard><GuidePage /></AuthGuard>} />
          <Route path="/more" element={<AuthGuard><MorePage /></AuthGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
