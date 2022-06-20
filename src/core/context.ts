import { FSWatcher, watch as chokidar } from 'chokidar'
import { resolve } from 'path'
import { createPrefixTree, TreeLeaf } from './tree'
import { logTree } from './utils'

export interface RoutesContextOptions {
  extensions?: string[]
  routesFolder?: string
  importMode?:
    | 'sync'
    | 'async'
    | ((path: string, resolvedOptions: any) => 'sync' | 'async')

  ignore?: string[]

  routeStyle?: 'nuxt' | 'remix'

  routesModuleId?: string

  root?: string
}

const DEFAULT_OPTIONS: Required<RoutesContextOptions> = {
  extensions: ['.vue', '.js', '.jsx', '.ts', '.tsx'],
  ignore: [],
  routesFolder: 'src/routes',
  importMode: 'async',
  routeStyle: 'nuxt',
  routesModuleId: '@routes',
  root: process.cwd(),
}

export function createRoutesContext(opt?: RoutesContextOptions) {
  const options: Required<RoutesContextOptions> = { ...DEFAULT_OPTIONS, ...opt }
  let serverWatcher: FSWatcher | null = null

  const root = createPrefixTree()

  function setupWatcher(watcher?: FSWatcher) {
    // already setup
    if (serverWatcher) return

    // create the watcher if necessary
    // console.log({ root: options.root, routesFolder: options.routesFolder })
    if (!watcher) {
      watcher = chokidar(options.routesFolder, {
        // TODO: allow user options
        cwd: options.root,
      })
    }

    serverWatcher = watcher

    watcher
      .on('change', (path) => {
        // TODO: parse defineRoute macro?
        console.log('change', path)
      })
      .on('add', (path) => {
        console.log('add', path)
        if (!root.children.size) {
          // TODO: parse
          root.insert('index.vue')
          root.insert('users/index.vue')
          root.insert('users/[id].vue')
          root.insert('articles/[id]+.vue')
          root.insert('articles/id-[id]-the-rest.vue')
          root.insert('users.vue')
          root.insert('very/deep/file/is/complicated.vue')
          root.insert('very/deep/other/file.vue')
          root.insert('very/deep/file.vue')
          root.insert('very/deep/file.vue')

          // console.log(root.toString())
          logTree(root)
        }
        root.insert(path.slice(options.routesFolder.length + 1))
        logTree(root)
      })
      .on('unlink', (path) => {
        console.log('remove', path)
      })
  }

  return {
    setupWatcher,
  }
}
