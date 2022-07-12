import { isPackageExists } from 'local-pkg'
import { getFileBasedRouteName, isArray } from './core/utils'
import type { TreeLeaf } from './core/tree'

export interface RoutesFolderOption {
  src: string
  path?: string
}

export type _RoutesFolder = string | RoutesFolderOption
export type RoutesFolder = _RoutesFolder[] | _RoutesFolder

export interface ResolvedOptions {
  /**
   * Extensions of files to be considered as pages. Defaults to `['.vue']`. Cannot be empty.
   */
  extensions: string[]

  /**
   * Folder containing the components that should be used for routes. Can also be an array if you want to add multiple
   * folders, or an object if you want to define a route prefix. Supports glob patterns but must be a folder, use
   * `extensions` and `exclude` to filter files.
   *
   * @default "src/routes"
   */
  routesFolder: RoutesFolder
  // TODO: add support for multiple routes folders and prepending a path segment

  /**
   * Method to generate the name of a route.
   */
  getRouteName: (node: TreeLeaf) => string

  // TODO:
  // importMode?:
  //   | 'sync'
  //   | 'async'
  //   | ((path: string, resolvedOptions: Options) => 'sync' | 'async')

  /**
   * Array of file globs to ignore. Defaults to `[]`.
   */
  exclude: string[]

  /**
   * Root of the project. All paths are resolved relatively to this one. Defaults to `process.cwd()`.
   */
  root: string

  /**
   * Language for `<route>` blocks in SFC files. Defaults to `'json5'`.
   */
  routeBlockLang: string

  /**
   * Should generate d.ts files. Defaults to `true` if `typescript` is installed.
   */
  dts: boolean | string

  /**
   * Allows inspection by vite-plugin-inspect by not adding the leading `\0` to the id of virtual modules.
   * @internal
   */
  _inspect: boolean

  /**
   * Activates debug logs.
   */
  logs: boolean
}

export type Options = Partial<ResolvedOptions>

export const DEFAULT_OPTIONS: ResolvedOptions = {
  extensions: ['.vue'],
  exclude: [],
  routesFolder: 'src/routes',
  routeBlockLang: 'json5',
  getRouteName: getFileBasedRouteName,
  root: process.cwd(),
  dts: isPackageExists('typescript'),
  logs: false,
  _inspect: false,
}

export interface ServerContext {
  invalidate: (module: string) => void
  reload: () => void
}

export function normalizeRoutesFolderOption(
  routesFolder: ResolvedOptions['routesFolder']
): RoutesFolderOption[] {
  return (isArray(routesFolder) ? routesFolder : [routesFolder]).map(
    (routeOption) =>
      typeof routeOption === 'string' ? { src: routeOption } : routeOption
  )
}
