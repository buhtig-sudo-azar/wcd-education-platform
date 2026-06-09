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

// Плавная прокрутка с ease-in-out cubic
function smoothScrollTo(container: HTMLElement, targetY: number, duration: number) {
  const startY = container.scrollTop
  const distance = targetY - startY
  if (Math.abs(distance) < 2) return

  const startTime = performance.now()

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    container.scrollTop = startY + distance * eased

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

export function AppShell() {
  const currentView = useNavigationStore(s => s.currentView)
  const setSidebarOpen = useNavigationStore(s => s.setSidebarOpen)
  const mainRef = useRef<HTMLElement | null>(null)

  // Плавная прокрутка наверх при навигации + закрытие сайдбара
  useEffect(() => {
    if (mainRef.current) {
      smoothScrollTo(mainRef.current, 0, 500)
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [currentView, setSidebarOpen])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth scroll-pt-14">
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
