import { isPackageExists } from 'local-pkg'
import type { TreeLeaf } from './core/tree'
import { getRouteName, getFileBasedRouteName } from './core/utils'

export interface Options {
  extensions?: string[]
  /**
   * Folder containing the components that should be used for routes.
   *
   * @default "src/routes"
   */
  routesFolder?: string

  /**
   * Method to generate the name of a route.
   */
  getRouteName: (node: TreeLeaf) => string

  importMode?:
    | 'sync'
    | 'async'
    | ((path: string, resolvedOptions: Options) => 'sync' | 'async')

  exclude?: string[]

  root?: string

  /**
   * Should generate d.ts files. Defaults to `true` if `typescript` is installed.
   */
  dts?: boolean

  /**
   * Allows inspection by vite-plugin-inspect by not adding the leading `\0` to the id of virtual modules.
   * @internal
   */
  _inspect?: boolean
}

export const DEFAULT_OPTIONS: Required<Options> = {
  extensions: ['.vue', '.js', '.jsx', '.ts', '.tsx'],
  exclude: [],
  routesFolder: 'src/routes',
  getRouteName: getFileBasedRouteName,
  importMode: 'async',
  root: process.cwd(),
  dts: isPackageExists('typescript'),
  _inspect: false,
}
