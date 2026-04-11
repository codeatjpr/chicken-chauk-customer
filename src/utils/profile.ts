import type { AuthUser } from '@/types/auth'

export function profileNeedsDisplayName(user: AuthUser | null): boolean {
  if (!user) return false
  return !user.name?.trim()
}
