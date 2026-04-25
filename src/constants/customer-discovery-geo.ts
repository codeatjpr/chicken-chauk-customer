/**
 * Fallback before `GET /discovery/home` runs; must match
 * `chicken-chauk-backend/src/constants/customer-discovery-geo.ts`.
 * After home loads, the app uses `discoveryRadiusKm` from the API (see `discovery-config-store`).
 */
export const CUSTOMER_DISCOVERY_RADIUS_KM = 2
