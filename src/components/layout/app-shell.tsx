'use client'

import { useNavigationStore } from '@/store/navigation-store'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Footer } from './footer'
import { HomeView } from '@/components/home/home-view'
import { TheoryView } from '@/components/theory/theory-view'
import { LabView } from '@/components/lab/lab-view'
import { AboutView } from '@/components/about/about-view'
import { FloatingDock } from './floating-dock'
import { AgentChatPopup } from '@/components/chat/agent-chat-popup'

export function AppShell() {
  const { currentView } = useNavigationStore()

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />
      case 'theory':
        return <TheoryView />
      case 'lab':
        return <LabView />
      case 'about':
        return <AboutView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
        <Footer />
      </div>
      <FloatingDock />
      <AgentChatPopup />
    </div>
  )
}
