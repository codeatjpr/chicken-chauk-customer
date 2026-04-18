import { create } from 'zustand'

export type PanelTab = 'cart' | 'orders' | 'notifications' | 'favorites' | 'account'

type UiState = {
  panelOpen: boolean
  panelTab: PanelTab
  openPanel: (tab?: PanelTab) => void
  closePanel: () => void
  togglePanel: (tab: PanelTab) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  panelOpen: false,
  panelTab: 'cart',

  openPanel: (tab = 'cart') => set({ panelOpen: true, panelTab: tab }),

  closePanel: () => set({ panelOpen: false }),

  togglePanel: (tab) => {
    const { panelOpen, panelTab } = get()
    if (panelOpen && panelTab === tab) {
      set({ panelOpen: false })
    } else {
      set({ panelOpen: true, panelTab: tab })
    }
  },
}))
