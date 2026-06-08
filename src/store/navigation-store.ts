import { create } from 'zustand';

interface NavigationState {
  sidebarOpen: boolean
  chatOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleChat: () => void
  setChatOpen: (open: boolean) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  sidebarOpen: false,
  chatOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
}));
