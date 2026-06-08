'use client'

import { useNavigationStore } from '@/store/navigation-store'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  FlaskConical,
  Info,
  X,
  ShieldAlert,
} from 'lucide-react'

const navItems: { view: 'home' | 'theory' | 'lab' | 'about'; label: string; icon: React.ReactNode }[] = [
  { view: 'home', label: 'Главная', icon: <Home className="h-5 w-5" /> },
  { view: 'theory', label: 'Теория', icon: <BookOpen className="h-5 w-5" /> },
  { view: 'lab', label: 'Лаборатория', icon: <FlaskConical className="h-5 w-5" /> },
  { view: 'about', label: 'О проекте', icon: <Info className="h-5 w-5" /> },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, currentView, navigateTo } = useNavigationStore()

  const handleNav = (view: 'home' | 'theory' | 'lab' | 'about') => {
    navigateTo(view)
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 sm:w-72 border-r border-border bg-card transition-transform duration-300 md:translate-x-0 md:static md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <ShieldAlert className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-foreground">WCD Education</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Платформа обучения</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-2.5 sm:p-3">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={cn(
                'flex items-center gap-2.5 sm:gap-3 rounded-lg px-2.5 sm:px-3 py-2.5 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 w-full text-left min-h-[44px]',
                currentView === item.view
                  ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-border">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-2.5 sm:p-3 border border-emerald-500/20">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Основано на материалах
            </p>
            <p className="text-[10px] sm:text-xs font-medium text-foreground mt-0.5 sm:mt-1">
              PortSwigger Web Security Academy
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
