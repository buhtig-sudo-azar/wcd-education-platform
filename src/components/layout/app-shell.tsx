'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { Footer } from './footer'
import { FloatingDock } from './floating-dock'
import { AgentChatPopup } from '@/components/chat/agent-chat-popup'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Footer />
      </div>
      <FloatingDock />
      <AgentChatPopup />
    </div>
  )
}
