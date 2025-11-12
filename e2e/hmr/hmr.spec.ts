import { Page } from '@playwright/test'
import { test, expect } from './fixtures/vite-server'
import fs from 'node:fs'
import path from 'node:path'

test.describe('Vite + plugin HMR (e2e)', () => {
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

  test('applies HMR when the watched file changes', async ({
    page,
    baseURL,
    projectRoot,
  }) => {
    // 1) Load the app and wait for the initial derived value
    await page.goto(baseURL + '/')
    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('')

    await ensureHmrToken(page)

    // 2) Change the underlying file on disk
    fs.writeFileSync(
      path.join(projectRoot, 'src/pages/(home).vue'),
      fs.readFileSync(
        path.join(projectRoot, 'edits/(home)-with-route-block.vue'),
        'utf8'
      ),
      'utf8'
    )

    console.log(
      'AFTER',
      fs.readFileSync(path.join(projectRoot, 'src/pages/(home).vue'), 'utf8')
    )

    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('world')
  })
})
