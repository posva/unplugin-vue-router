import chokidar from 'chokidar'
import { normalize } from 'pathe'
import {
  ResolvedOptions,
  RoutesFolderOption,
  RoutesFolderOptionResolved,
  _OverridableOption,
} from '../options'
import { asRoutePath } from './utils'

// TODO: export an implementable interface to create a watcher and let users provide a different watcher than chokidar to improve performance on windows

export class RoutesFolderWatcher implements RoutesFolderOptionResolved {
  src: string
  path: string
  extensions: string[]
  filePatterns: string[]
  exclude: string[]

  watcher: chokidar.FSWatcher

  constructor(folderOptions: RoutesFolderOptionResolved) {
    this.src = folderOptions.src
    this.path = folderOptions.path
    this.exclude = folderOptions.exclude
    this.extensions = folderOptions.extensions
    this.filePatterns = folderOptions.filePatterns

    this.watcher = chokidar.watch(this.src, {
      ignoreInitial: true,
      // disableGlobbing: true,
      ignorePermissionErrors: true,
      ignored: this.exclude,
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
      if (this.extensions.every((extension) => !filePath.endsWith(extension))) {
        return
      }
      handler({
        filePath,
        routePath: asRoutePath({ src: this.src, path: this.path }, filePath),
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

export function resolveFolderOptions(
  globalOptions: ResolvedOptions,
  folderOptions: RoutesFolderOption
): RoutesFolderOptionResolved {
  return {
    src: folderOptions.src,
    path: folderOptions.path || '',
    extensions: overrideOption(
      globalOptions.extensions,
      folderOptions.extensions
    ),
    exclude: overrideOption(globalOptions.exclude, folderOptions.exclude),
    filePatterns: overrideOption(
      globalOptions.filePatterns,
      folderOptions.filePatterns
    ),
  }
}

function overrideOption(
  existing: string[] | string,
  newValue: undefined | string[] | string | ((existing: string[]) => string[])
): string[] {
  const asArray = typeof existing === 'string' ? [existing] : existing
  // allow extending when a function is passed
  if (typeof newValue === 'function') {
    return newValue(asArray)
  }
  // override if passed
  if (typeof newValue !== 'undefined') {
    return typeof newValue === 'string' ? [newValue] : newValue
  }
  // fallback to existing
  return asArray
}
