import { isPackageExists } from 'local-pkg'
import { getFileBasedRouteName } from './core/utils'
import type { TreeLeaf } from './core/tree'

export interface Options {
  /**
   * Extensions of files to be considered as pages. Defaults to `['.vue']`. Cannot be empty.
   */
  extensions?: string[]
  /**
   * Folder containing the components that should be used for routes.
   *
   * @default "src/routes"
   */
  routesFolder?: string
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
  exclude?: string[]

  root?: string

  /**
   * Should generate d.ts files. Defaults to `true` if `typescript` is installed.
   */
  dts?: boolean | string

  /**
   * Allows inspection by vite-plugin-inspect by not adding the leading `\0` to the id of virtual modules.
   * @internal
   */
  _inspect?: boolean

  /**
   * Activates debug logs.
   */
  logs?: boolean
}

export const DEFAULT_OPTIONS: Required<Options> = {
  extensions: ['.vue'],
  exclude: [],
  routesFolder: 'src/routes',
  getRouteName: getFileBasedRouteName,
  root: process.cwd(),
  dts: isPackageExists('typescript'),
  logs: false,
  _inspect: false,
}
