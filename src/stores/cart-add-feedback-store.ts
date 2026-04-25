import { create } from 'zustand'

export type CartAddChip = {
  /** Dedupe key — same listing updates quantity instead of stacking */
  vendorProductId: string
  productName: string
  quantity: number
  shopName?: string
}

type State = {
  chips: CartAddChip[]
  /** Replace existing chip for the same `vendorProductId` (no duplicate rows). */
  push: (chip: CartAddChip) => void
  dismiss: (vendorProductId: string) => void
  clearAll: () => void
}

const MAX = 3

export const useCartAddFeedbackStore = create<State>((set) => ({
  chips: [],
  push: (chip) =>
    set((s) => {
      const rest = s.chips.filter((c) => c.vendorProductId !== chip.vendorProductId)
      return { chips: [{ ...chip }, ...rest].slice(0, MAX) }
    }),
  dismiss: (vendorProductId) =>
    set((s) => ({
      chips: s.chips.filter((c) => c.vendorProductId !== vendorProductId),
    })),
  clearAll: () => set({ chips: [] }),
}))
