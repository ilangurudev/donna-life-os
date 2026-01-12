import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DevModeState {
  devMode: boolean
  toggleDevMode: () => void
  setDevMode: (value: boolean) => void
}

export const useDevMode = create<DevModeState>()(
  persist(
    (set) => ({
      devMode: true, // Default to dev mode
      toggleDevMode: () => set((state) => ({ devMode: !state.devMode })),
      setDevMode: (value: boolean) => set({ devMode: value }),
    }),
    {
      name: 'donna-dev-mode',
    }
  )
)
