import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeColors {
  cp: string
  cpL: string
  cpXl: string
  ca: string
  bg: string
  name: string
}

export const THEMES: Record<string, ThemeColors> = {
  pink:   { cp: '#F4A9C0', cpL: '#FDDDE6', cpXl: '#FFF5E6', ca: '#7EC8C8', bg: '#FFFAF5', name: '粉紅' },
  purple: { cp: '#B39DDB', cpL: '#EDE7F6', cpXl: '#F3EEFF', ca: '#80CBC4', bg: '#FAF8FF', name: '薰衣草' },
  blue:   { cp: '#81C8E8', cpL: '#DAEEF8', cpXl: '#EBF7FD', ca: '#FFB74D', bg: '#F5FAFF', name: '天藍' },
  green:  { cp: '#81C784', cpL: '#DCEDC8', cpXl: '#F1F8E9', ca: '#FF8A65', bg: '#F5FFF5', name: '薄荷' },
  orange: { cp: '#FFAB76', cpL: '#FFE0B2', cpXl: '#FFF8F0', ca: '#64B5F6', bg: '#FFFBF5', name: '橙杏' },
}

export function applyTheme(key: string) {
  const t = THEMES[key] ?? THEMES.pink
  const r = document.documentElement.style
  r.setProperty('--cp', t.cp)
  r.setProperty('--cp-l', t.cpL)
  r.setProperty('--cp-xl', t.cpXl)
  r.setProperty('--ca', t.ca)
  r.setProperty('--bg', t.bg)
}

interface ThemeStore {
  theme: string
  setTheme: (key: string) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'pink',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    { name: 'theme-store' }
  )
)
