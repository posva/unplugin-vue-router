import chokidar from 'chokidar'
import { normalize } from 'pathe'
import { ResolvedOptions, RoutesFolderOption } from '../options'
import { asRoutePath } from './utils'

// TODO: export an implementable interface to create a watcher and let users provide a different watcher than chokidar to improve performance on windows

export class RoutesFolderWatcher {
  src: string
  pathPrefix: string

  watcher: chokidar.FSWatcher
  options: ResolvedOptions

  constructor(routesFolder: RoutesFolderOption, options: ResolvedOptions) {
    this.src = routesFolder.src
    this.pathPrefix = routesFolder.path || ''
    this.options = options

    this.watcher = chokidar.watch(this.src, {
      ignoreInitial: true,
      // disableGlobbing: true,
      ignorePermissionErrors: true,
      ignored: options.exclude,
      // useFsEvents: true,
      // TODO: allow user options
    })
  }

  on(
    event: 'add' | 'change' | 'unlink',
    handler: (context: HandlerContext) => void
  ) {
    this.watcher.on(event, (filePath: string) => {
      // ensure consistent path for Windows and Unix
      filePath = normalize(filePath)
      // skip other extensions
      if (
        this.options.extensions.every(
          (extension) => !filePath.endsWith(extension)
        )
      ) {
        return
      }
      handler({
        filePath,
        routePath: asRoutePath(
          { src: this.src, path: this.pathPrefix },
          filePath
        ),
      })
    })
    return this
  }

  close() {
    this.watcher.close()
  }
}

export interface HandlerContext {
  // resolved path
  filePath: string
  // routePath
  routePath: string
}
