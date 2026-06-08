'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { Footer } from './footer'
import { FloatingDock } from './floating-dock'
import { AgentChatPopup } from '@/components/chat/agent-chat-popup'
import { useNavigationStore } from '@/store/navigation-store'
import { HomeView } from '@/components/home/home-view'
import { TheoryView } from '@/components/theory/theory-view'
import { LabView } from '@/components/lab/lab-view'
import { AboutView } from '@/components/about/about-view'
import { useEffect, useRef } from 'react'

export function AppShell() {
  const currentView = useNavigationStore(s => s.currentView)
  const setSidebarOpen = useNavigationStore(s => s.setSidebarOpen)
  const mainRef = useRef<HTMLElement | null>(null)

  // Автопрокрутка наверх при любой навигации + закрытие сайдбара на мобильных
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // Закрываем сайдбар при навигации на экранах < md
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [currentView, setSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth">
          {currentView === 'home' && <HomeView />}
          {currentView === 'theory' && <TheoryView />}
          {currentView === 'lab' && <LabView />}
          {currentView === 'about' && <AboutView />}
        </main>
        <Footer />
      </div>
      <FloatingDock />
      <AgentChatPopup />
    </div>
  )
}
