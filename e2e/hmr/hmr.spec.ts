import { Page } from '@playwright/test'
import { test, expect, applyEditFile } from './fixtures/vite-server'

test.describe('Pages HMR', () => {
  let hmrToken: number = -1
  // reset hmr token before each test
  test.beforeEach(() => {
    hmrToken = -1
  })

  async function ensureHmrToken(page: Page) {
    hmrToken = await page.evaluate(
      () => ((window as any).__hmrToken ??= Math.random())
    )
  }

  // ensure hmr token is stable across tests
  test.afterEach(async ({ page }) => {
    if (hmrToken === -1) {
      throw new Error('hmrToken was not set in the test')
    }
    await expect
      .poll(async () => page.evaluate(() => (window as any).__hmrToken))
      .toBe(hmrToken)
  })

  test('applies meta changes in <route> block', async ({ page, baseURL }) => {
    await page.goto(baseURL + '/')

    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('')

    await ensureHmrToken(page)
    applyEditFile('src/pages/(home).vue', 'edits/(home)-with-route-block.vue')

    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('world')
  })
})
