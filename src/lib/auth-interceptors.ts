import axios, { type InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/lib/axiosInstance'
import { refreshTokensRaw } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'

const PUBLIC_AUTH_URL_PARTS = ['auth/send-otp', 'auth/verify-otp', 'auth/refresh']

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false
  const path = url.replace(/^\//, '')
  return PUBLIC_AUTH_URL_PARTS.some((p) => path.startsWith(p))
}

let refreshing = false
const waitQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }

    const original = error.config as InternalAxiosRequestConfig
    const status = error.response?.status

    if (status !== 401 || original._authRetry) {
      return Promise.reject(error)
    }

    if (isPublicAuthRequest(original.url)) {
      return Promise.reject(error)
    }

    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      useAuthStore.getState().clearSession()
      return Promise.reject(error)
    }

    if (refreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({
          resolve: (accessToken: string) => {
            original.headers.Authorization = `Bearer ${accessToken}`
            resolve(axiosInstance(original))
          },
          reject,
        })
      })
    }

    original._authRetry = true
    refreshing = true

    try {
      const tokens = await refreshTokensRaw(refreshToken)
      useAuthStore
        .getState()
        .setTokens(tokens.accessToken, tokens.refreshToken)

      waitQueue.forEach((p) => p.resolve(tokens.accessToken))
      waitQueue.length = 0

      original.headers.Authorization = `Bearer ${tokens.accessToken}`
      return axiosInstance(original)
    } catch (e) {
      waitQueue.forEach((p) => p.reject(e))
      waitQueue.length = 0
      useAuthStore.getState().clearSession()
      return Promise.reject(e)
    } finally {
      refreshing = false
    }
  },
)
