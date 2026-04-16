import axios from 'axios'
import type { ApiErrorBody } from '@/types/api'

function messageFromBody(body: ApiErrorBody | Record<string, unknown> | undefined): string | null {
  if (!body || typeof body !== 'object') return null
  const msg = typeof body.message === 'string' ? body.message.trim() : ''
  if (msg) return msg
  const errs = (body as ApiErrorBody).errors
  if (Array.isArray(errs) && errs.length > 0) {
    const lines = errs.filter((e): e is string => typeof e === 'string')
    if (lines.length) return lines.join('; ')
  }
  return null
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | Record<string, unknown> | undefined
    const fromApi = messageFromBody(data)
    if (fromApi) return fromApi
    if (error.response?.statusText && error.response.status >= 400) {
      return error.response.statusText
    }
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
