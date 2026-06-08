'use client'

import { useNavigationStore } from '@/store/navigation-store'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  FlaskConical,
  Bot,
  Info,
  X,
  ShieldAlert,
} from 'lucide-react'
import type { ViewType } from '@/types'

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'home', label: 'Главная', icon: <Home className="h-5 w-5" /> },
  { view: 'theory', label: 'Теория', icon: <BookOpen className="h-5 w-5" /> },
  { view: 'lab', label: 'Лаборатория', icon: <FlaskConical className="h-5 w-5" /> },
  { view: 'ai', label: 'AI Ассистент', icon: <Bot className="h-5 w-5" /> },
  { view: 'about', label: 'О проекте', icon: <Info className="h-5 w-5" /> },
]

export function Sidebar() {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useNavigationStore()

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 border-r border-border bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">WCD Education</h1>
              <p className="text-xs text-muted-foreground">Платформа обучения</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                currentView === item.view
                  ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-3 border border-emerald-500/20">
            <p className="text-xs text-muted-foreground">
              Основано на материалах
            </p>
            <p className="text-xs font-medium text-foreground mt-1">
              PortSwigger Web Security Academy
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
