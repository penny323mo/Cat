import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

interface AuthPageProps {
  mode: 'login' | 'signup'
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '出現錯誤，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#FFFAF5] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🐱</div>
          <h1 className="text-2xl font-bold text-[#4A4A4A]">貓咪日記</h1>
          <p className="text-[#4A4A4A]/50 text-sm mt-1">記錄每一個可愛時刻</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="電郵"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="密碼"
            type="password"
            required
            placeholder="至少 6 個字元"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-[#E57373] bg-[#E57373]/10 px-3 py-2 rounded-2xl">{error}</p>}
          <Button type="submit" fullWidth loading={loading} size="lg">
            {mode === 'login' ? '登入' : '註冊'}
          </Button>
        </form>

        <p className="text-center text-sm text-[#4A4A4A]/50 mt-6">
          {mode === 'login' ? (
            <>沒有帳號？<Link to="/signup" className="text-[#F4A9C0] font-medium">立即註冊</Link></>
          ) : (
            <>已有帳號？<Link to="/login" className="text-[#F4A9C0] font-medium">登入</Link></>
          )}
        </p>
      </div>
    </div>
  )
}
