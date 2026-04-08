import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  showBack?: boolean
  right?: ReactNode
}

export function Header({ title, showBack, right }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--cp)]/20 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--cp-xl)]"
          >
            ←
          </button>
        )}
        <h1 className="text-lg font-semibold text-[#4A4A4A]">{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </header>
  )
}
