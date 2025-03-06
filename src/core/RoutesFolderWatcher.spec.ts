import {
  describe,
  expect,
  it,
  vi,
  beforeAll,
  type Mock,
  afterAll,
} from 'vitest'
import {
  HandlerContext,
  RoutesFolderWatcher,
  resolveFolderOptions,
} from './RoutesFolderWatcher'
import { resolveOptions, RoutesFolderOption } from '../options'
import pathe from 'pathe'
import fs from 'node:fs'
import { tmpdir } from 'node:os'

const FIXTURES_ROOT = pathe.resolve(
  pathe.join(tmpdir(), 'chokidar-' + Date.now())
)

const TEST_TIMEOUT = 4000

describe('RoutesFolderWatcher', () => {
  beforeAll(() => {
    fs.mkdirSync(FIXTURES_ROOT, { recursive: true })
  })

  // keep track of all watchers to close them after the tests
  const watcherList: RoutesFolderWatcher[] = []
  let testId = 0
  function createWatcher(routesFolderOptions: RoutesFolderOption) {
    const rootDir = pathe.join(FIXTURES_ROOT, `test-${testId++}`)
    const srcDir = pathe.join(rootDir, routesFolderOptions.src)
    const options = resolveFolderOptions(
      resolveOptions({ root: rootDir }),
      routesFolderOptions
    )

    fs.mkdirSync(srcDir, { recursive: true })

    const watcher = new RoutesFolderWatcher(options)
    watcherList.push(watcher)

    return { watcher, options, rootDir, srcDir }
  }

  afterAll(async () => {
    await Promise.all(watcherList.map((watcher) => watcher.close()))
  })

  function waitForSpy(...spies: Mock[]) {
    if (spies.length < 1) {
      throw new Error('No spies provided')
    }

    return new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (spies.every((spy) => spy.mock.calls.length > 0)) {
          clearInterval(checkInterval)
          clearTimeout(checkTimeout)
          resolve()
        }
      }, 20)
      const checkTimeout = setTimeout(() => {
        clearInterval(checkInterval)
        clearTimeout(checkTimeout)
        reject(new Error('Spy was not called'))
      }, TEST_TIMEOUT)
    })
  }

  it('triggers when new pages are added', async () => {
    const { watcher, srcDir } = createWatcher({ src: 'src/pages' })

    const add = vi.fn<(ctx: HandlerContext) => void>()
    // watcher.on('add', add)
    // chokidar triggers change instead of add
    watcher.on('change', add)

    expect(add).toHaveBeenCalledTimes(0)

    fs.writeFileSync(pathe.join(srcDir, 'a.vue'), '', 'utf-8')

    await waitForSpy(add)
  })
})
