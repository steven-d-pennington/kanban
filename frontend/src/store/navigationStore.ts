import { create } from 'zustand';

export type Page = 'board' | 'monitoring' | 'analytics' | 'memory';

interface NavigationState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'board',
  setCurrentPage: (page) => set({ currentPage: page }),
}));
