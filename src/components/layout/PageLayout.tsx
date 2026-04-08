import { type ReactNode } from 'react'
import { TabBar } from './TabBar'

interface PageLayoutProps {
  children: ReactNode
  hideTabBar?: boolean
}

export function PageLayout({ children, hideTabBar }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-svh bg-[var(--bg)]">
      <main className={['flex-1 max-w-lg mx-auto w-full', hideTabBar ? '' : 'pb-20'].join(' ')}>
        {children}
      </main>
      {!hideTabBar && <TabBar />}
    </div>
  )
}
