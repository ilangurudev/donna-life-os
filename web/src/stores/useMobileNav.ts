import { create } from 'zustand'
import type { MobileView } from '../types'

interface MobileNavState {
  currentView: MobileView
  selectedNotePath: string | null
  setView: (view: MobileView) => void
  openNote: (path: string) => void
  closeNote: () => void
  goToChat: () => void
  goToNotes: () => void
}

export const useMobileNav = create<MobileNavState>((set) => ({
  currentView: 'chat',
  selectedNotePath: null,
  
  setView: (view) => set({ currentView: view }),
  
  openNote: (path) => set({ 
    currentView: 'note-detail', 
    selectedNotePath: path 
  }),
  
  closeNote: () => set({ 
    currentView: 'notes',
    selectedNotePath: null 
  }),
  
  goToChat: () => set({ currentView: 'chat' }),
  
  goToNotes: () => set({ currentView: 'notes' }),
}))
