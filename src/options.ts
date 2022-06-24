import { isPackageExists } from 'local-pkg'

export interface Options {
  extensions?: string[]
  /**
   * Folder containing the components that should be used for routes.
   *
   * @default "src/routes"
   */
  routesFolder?: string
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
  importMode: 'async',
  root: process.cwd(),
  dts: isPackageExists('typescript'),
  _inspect: false,
}
