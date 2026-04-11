import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import * as authApi from '@/services/auth.service'
import type { AuthTokens, AuthUser } from '@/types/auth'

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  /** False until persist rehydration + `bootstrap()` finishes */
  sessionReady: boolean
  setTokens: (access: string | null, refresh: string | null) => void
  signIn: (tokens: AuthTokens, user: AuthUser) => void
  setUser: (user: AuthUser | null) => void
  clearSession: () => void
  bootstrap: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      sessionReady: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      signIn: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
          sessionReady: true,
        }),

      setUser: (user) => set({ user }),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          sessionReady: true,
        }),

      bootstrap: async () => {
        try {
          const { accessToken } = get()
          if (!accessToken) {
            return
          }
          try {
            const user = await withTimeout(
              authApi.getMe(),
              12_000,
              'Session check timed out',
            )
            set({ user })
          } catch {
            get().clearSession()
          }
        } finally {
          set({ sessionReady: true })
        }
      },

      signOut: async () => {
        const { accessToken } = get()
        if (accessToken) {
          try {
            await authApi.logout()
          } catch {
            /* session may already be invalid */
          }
        }
        get().clearSession()
      },
    }),
    {
      name: 'chicken-chauk-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ sessionReady: false })
      },
    },
  ),
)

export function selectIsAuthenticated(state: AuthState): boolean {
  return Boolean(state.accessToken && state.user)
}
