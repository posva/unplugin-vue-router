import chokidar from 'chokidar'
import { ResolvedOptions, RoutesFolderOption } from '../options'

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

  asRoutePath(path: string) {
    return this.pathPrefix + path.slice(this.src.length + 1)
  }

  on(
    event: 'add' | 'change' | 'unlink',
    handler: (context: HandlerContext) => void
  ) {
    this.watcher.on(event, (filePath) => {
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
        routePath: this.asRoutePath(filePath),
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
