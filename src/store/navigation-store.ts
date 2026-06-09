import { create } from 'zustand';
import type { ViewType } from '@/types';

interface NavigationState {
  currentView: ViewType;
  sidebarOpen: boolean;
  chatOpen: boolean;
  navigateTo: (view: ViewType) => void;
  navigateToHome: () => void;
  navigateToTheory: () => void;
  navigateToLab: () => void;
  navigateToAbout: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'home',
  sidebarOpen: false,
  chatOpen: false,
  navigateTo: (view) => set({ currentView: view }),
  navigateToHome: () => set({ currentView: 'home' }),
  navigateToTheory: () => set({ currentView: 'theory' }),
  navigateToLab: () => set({ currentView: 'lab' }),
  navigateToAbout: () => set({ currentView: 'about' }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
}));
