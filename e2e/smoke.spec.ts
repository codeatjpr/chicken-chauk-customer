import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * Session bootstrap may call `/auth/me` when tokens exist. Stub auth so E2E
 * passes without a running backend (same as CI / local API down).
 */
async function stubAuthApi(page: Page) {
  const unauthorized = {
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, message: 'Unauthorized' }),
  }
  const stub = (route: Route) => route.fulfill(unauthorized)
  // With VITE_API_URL set: …/api/v1/auth/me. Without it, axios may hit same-origin /auth/me.
  await page.route('**/api/v1/auth/me', stub)
  await page.route('**/api/v1/auth/refresh**', stub)
  await page.route('**/auth/me', stub)
  await page.route('**/auth/refresh**', stub)
}

test.describe('marketing shell', () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthApi(page)
    await page.addInitScript(() => {
      try {
        localStorage.clear()
      } catch {
        /* ignore */
      }
    })
  })

  test('landing shows browse and sign-in paths', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /browse menu/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /^sign in$/i }).first(),
    ).toBeVisible()
  })
})
