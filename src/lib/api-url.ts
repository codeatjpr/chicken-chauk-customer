/** VITE_API_URL is the API host only, e.g. http://localhost:5000 — `/api/v1` is appended here. */
export function getApiRoot(): string {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
  return base ? `${base}/api/v1` : ''
}
