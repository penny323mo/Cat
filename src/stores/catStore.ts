import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CatProfile } from '../types'

interface CatStore {
  activeCatId: string | null
  cats: CatProfile[]
  setActiveCatId: (id: string | null) => void
  setCats: (cats: CatProfile[]) => void
  getActiveCat: () => CatProfile | undefined
}

export const useCatStore = create<CatStore>()(
  persist(
    (set, get) => ({
      activeCatId: null,
      cats: [],
      setActiveCatId: (id) => set({ activeCatId: id }),
      setCats: (cats) => {
        set({ cats })
        // Auto-select first cat if none selected
        const { activeCatId } = get()
        if (!activeCatId && cats.length > 0) {
          set({ activeCatId: cats[0].id })
        }
      },
      getActiveCat: () => {
        const { cats, activeCatId } = get()
        return cats.find((c) => c.id === activeCatId)
      },
    }),
    { name: 'cat-store' }
  )
)
