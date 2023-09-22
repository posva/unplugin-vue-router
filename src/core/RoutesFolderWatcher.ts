import chokidar from 'chokidar'
import { resolve } from 'pathe'
import {
  ResolvedOptions,
  RoutesFolderOption,
  RoutesFolderOptionResolved,
  _OverridableOption,
} from '../options'
import { appendExtensionListToPattern, asRoutePath } from './utils'

// TODO: export an implementable interface to create a watcher and let users provide a different watcher than chokidar to improve performance on windows

export class RoutesFolderWatcher {
  src: string
  path: string | ((filepath: string) => string)
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

    this.watcher = chokidar.watch(folderOptions.pattern, {
      cwd: this.src,
      ignoreInitial: true,
      // disableGlobbing: true,
      ignorePermissionErrors: true,
      ignored: this.exclude,

      // useFsEvents: true,
      // TODO: allow user options
    })
  }

  on(
    event: 'add' | 'change' | 'unlink' | 'unlinkDir',
    handler: (context: HandlerContext) => void
  ) {
    this.watcher.on(event, (filePath: string) => {
      // skip other extensions
      if (this.extensions.every((extension) => !filePath.endsWith(extension))) {
        return
      }

      // ensure consistent absolute path for Windows and Unix
      filePath = resolve(this.src, filePath)

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
  const extensions = overrideOption(
    globalOptions.extensions,
    folderOptions.extensions
  )
  const filePatterns = overrideOption(
    globalOptions.filePatterns,
    folderOptions.filePatterns
  )

  return {
    src: folderOptions.src,
    pattern: appendExtensionListToPattern(
      filePatterns,
      // also override the extensions if the folder has a custom extensions
      extensions
    ),
    path: folderOptions.path || '',
    extensions,
    filePatterns,
    exclude: overrideOption(globalOptions.exclude, folderOptions.exclude).map(
      (p) => (p.startsWith('**') ? p : resolve(p))
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
