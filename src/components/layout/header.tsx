'use client'

import { useNavigationStore } from '@/store/navigation-store'
import { Menu, ShieldAlert } from 'lucide-react'
import { ModelSelector } from '@/components/settings/model-selector'

const viewTitles: Record<string, string> = {
  home: 'Главная',
  theory: 'Теория',
  lab: 'Лаборатория',
  about: 'О проекте',
}

export function Header() {
  const { currentView, toggleSidebar } = useNavigationStore()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 lg:hidden">
        <ShieldAlert className="h-5 w-5 text-emerald-500" />
        <span className="text-sm font-bold">WCD</span>
      </div>

      <div className="hidden lg:block">
        <h2 className="text-sm font-semibold text-foreground">
          {viewTitles[currentView] || 'Главная'}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ModelSelector />
        <div className="hidden sm:flex h-8 items-center rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-3 border border-emerald-500/20">
          <span className="text-xs font-medium text-emerald-400">Web Cache Deception</span>
        </div>
      </div>
    </header>
  )
}
