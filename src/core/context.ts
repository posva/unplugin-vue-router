import { FSWatcher, watch as chokidar } from 'chokidar'
import { resolve } from 'path'
import { Options } from '../types'
import { createPrefixTree, TreeLeaf } from './tree'
import { logTree } from './utils'

export function createRoutesContext(options: Required<Options>) {
  const serverWatcher = chokidar(options.routesFolder, {
    // TODO: allow user options
    cwd: options.root,
  })

  const root = createPrefixTree()

  function setupWatcher() {
    serverWatcher
      .on('change', (path) => {
        // TODO: parse defineRoute macro?
        console.log('change', path)
      })
      .on('add', (path) => {
        root.insert(
          path.slice(options.routesFolder.length + 1),
          // './' + path
          resolve(options.root, path)
        )
      })
      .on('unlink', (path) => {
        console.log('remove', path)
      })
  }

  function start() {
    // TODO: only on dev mode
    setupWatcher()
  }

  function stop() {
    serverWatcher.close()
  }

  function generateRoutes() {
    return `export const routes = ${root.toRouteRecordString()}`
  }

  setupWatcher()

  return {
    start,
    stop,

    generateRoutes,
  }
}
