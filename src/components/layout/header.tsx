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
  const { toggleSidebar, currentView } = useNavigationStore()

  return (
    <header className="sticky top-0 z-30 flex h-12 sm:h-14 items-center gap-3 sm:gap-4 border-b border-border bg-background/80 backdrop-blur-md px-3 sm:px-4 md:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-1.5 sm:p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
        <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
        <span className="text-xs sm:text-sm font-bold">WCD</span>
      </div>

      <div className="hidden md:block">
        <h2 className="text-sm font-semibold text-foreground">
          {viewTitles[currentView] || 'Главная'}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <ModelSelector />
        <div className="hidden md:flex h-7 sm:h-8 items-center rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-2.5 sm:px-3 border border-emerald-500/20">
          <span className="text-[10px] sm:text-xs font-medium text-emerald-400">Web Cache Deception</span>
        </div>
      </div>
    </header>
  )
}
