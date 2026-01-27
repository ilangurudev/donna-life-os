import { create } from 'zustand'

interface NotesNavState {
  // Note path to navigate to (set from anywhere, consumed by App)
  pendingNavigation: string | null
  // Request navigation to a note
  navigateToNote: (path: string) => void
  // Clear the pending navigation (called after handling)
  clearNavigation: () => void
}

export const useNotesNav = create<NotesNavState>((set) => ({
  pendingNavigation: null,

  navigateToNote: (path) => set({ pendingNavigation: path }),

  clearNavigation: () => set({ pendingNavigation: null }),
}))
