import { join } from 'path'
import { expect, it } from 'vitest'
import { createRoutesContext } from '../src/core/context'
import { DEFAULT_OPTIONS } from '../src/options'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

/**
 * This is a simple full test to check that all filenames are valid in different environment (windows, mac, linux).
 */

it('generates the routes', async () => {
  const context = createRoutesContext({
    ...DEFAULT_OPTIONS,
    // dts: join(__dirname, './__types.d.ts'),
    dts: false,
    logs: false,
    routesFolder: join(__dirname, './fixtures/filenames/routes'),
  })

  await context.scanPages()
  expect(
    context
      .generateRoutes()
      .replace(/(import\(["'])(?:.+?)fixtures\/filenames/gi, '$1')
  ).toMatchSnapshot()
})
