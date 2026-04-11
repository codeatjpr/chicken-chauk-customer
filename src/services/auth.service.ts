import axios from 'axios'
import { axiosInstance } from '@/lib/axiosInstance'
import { getApiRoot } from '@/lib/api-url'
import type { ApiSuccess } from '@/types/api'
import type { AuthTokens, AuthUser, VerifyOtpResponse } from '@/types/auth'

export type SendOtpResult = {
  expiresIn: number
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  const { data } = await axiosInstance.post<ApiSuccess<SendOtpResult>>(
    '/auth/send-otp',
    { phone },
  )
  if (!data.success || data.data == null) {
    throw new Error(data.message ?? 'Failed to send OTP')
  }
  return data.data
}

export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  const { data } = await axiosInstance.post<ApiSuccess<VerifyOtpResponse>>(
    '/auth/verify-otp',
    { phone, otp },
  )
  if (!data.success || !data.data?.tokens || !data.data.user) {
    throw new Error(data.message ?? 'Verification failed')
  }
  return data.data
}

/** Used by axios interceptors — bypasses the instance to avoid refresh loops. */
export async function refreshTokensRaw(refreshToken: string): Promise<AuthTokens> {
  const root = getApiRoot()
  if (!root) throw new Error('API URL is not configured')
  const { data } = await axios.post<ApiSuccess<{ tokens: AuthTokens }>>(
    `${root}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 },
  )
  if (!data.success || !data.data?.tokens) {
    throw new Error(data.message ?? 'Session expired')
  }
  return data.data.tokens
}

export async function logout(): Promise<void> {
  await axiosInstance.post('/auth/logout')
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await axiosInstance.get<ApiSuccess<AuthUser>>('/auth/me')
  if (!data.success || !data.data) {
    throw new Error(data.message ?? 'Not authenticated')
  }
  return data.data
}
