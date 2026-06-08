import { create } from 'zustand'
import type { ViewType } from '@/types'

interface NavigationState {
  currentView: ViewType
  sidebarOpen: boolean
  setView: (view: ViewType) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'home',
  sidebarOpen: false,
  setView: (view) => set({ currentView: view, sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
