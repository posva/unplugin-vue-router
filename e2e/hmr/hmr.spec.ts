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
    applyEditFile(
      'src/pages/(home).vue',
      'edits/src/pages/(home)-route-block-with-meta.vue'
    )

    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('world')
  })

  test('applies name changes via definePage', async ({ page, baseURL }) => {
    await page.goto(baseURL + '/hmr-name')

    await expect(page.locator('[data-testid="route-name"]')).toHaveText(
      '/hmr-name'
    )

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-name.vue',
      'edits/src/pages/hmr-name-define-page-with-custom-name.vue'
    )

    await expect(page.locator('[data-testid="route-name"]')).toHaveText(
      'CustomName'
    )
  })

  test.skip('applies path changes via definePage', async ({
    page,
    baseURL,
  }) => {
    await page.goto(baseURL + '/hmr-path')

    await expect(page.locator('[data-testid="route-path"]')).toHaveText(
      '/hmr-path'
    )

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-path.vue',
      'edits/src/pages/hmr-path-define-page-with-custom-path.vue'
    )

    // Navigate to the new custom path
    await page.goto(baseURL + '/custom-path')

    await expect(page.locator('[data-testid="route-path"]')).toHaveText(
      '/custom-path'
    )
  })

  test.skip('applies params parsers via definePage', async ({
    page,
    baseURL,
  }) => {
    await page.goto(baseURL + '/hmr-params-123')

    // Initially params are strings
    await expect(page.locator('[data-testid="param-id"]')).toHaveText('123')
    await expect(page.locator('[data-testid="param-type"]')).toHaveText(
      'string'
    )

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-params-[id].vue',
      'edits/src/pages/hmr-params-[id]-define-page-with-int-parser.vue'
    )

    // After HMR, params should be parsed as numbers
    await expect(page.locator('[data-testid="param-id"]')).toHaveText('123')
    await expect(page.locator('[data-testid="param-type"]')).toHaveText(
      'number'
    )
  })

  test.skip('applies meta changes via definePage', async ({
    page,
    baseURL,
  }) => {
    await page.goto(baseURL + '/hmr-meta')

    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-meta.vue',
      'edits/src/pages/hmr-meta-define-page-with-meta.vue'
    )

    await expect(page.locator('[data-testid="meta-hello"]')).toHaveText('world')
  })

  test.skip('applies alias via definePage', async ({ page, baseURL }) => {
    await page.goto(baseURL + '/hmr-alias')

    await expect(page.locator('[data-testid="route-path"]')).toHaveText(
      '/hmr-alias'
    )

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-alias.vue',
      'edits/src/pages/hmr-alias-define-page-with-alias.vue'
    )

    // Navigate to the alias path
    await page.goto(baseURL + '/alias-path')

    await expect(page.locator('[data-testid="route-path"]')).toHaveText(
      '/alias-path'
    )
  })

  test.skip('updates definePage properties', async ({ page, baseURL }) => {
    await page.goto(baseURL + '/hmr-update')

    await expect(page.locator('[data-testid="meta-foo"]')).toHaveText('bar')

    await ensureHmrToken(page)
    applyEditFile(
      'src/pages/hmr-update.vue',
      'edits/src/pages/hmr-update-define-page-with-updated-meta.vue'
    )

    await expect(page.locator('[data-testid="meta-foo"]')).toHaveText('updated')
  })
})
