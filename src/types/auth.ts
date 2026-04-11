export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type AuthUser = {
  id: string
  phone: string
  name: string | null
  role: string
  isVerified: boolean
}

export type VerifyOtpResponse = {
  tokens: AuthTokens
  user: AuthUser
  isNewUser: boolean
}
