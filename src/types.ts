import { isPackageExists } from 'local-pkg'

export interface Options {
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
  ignore: [],
  routesFolder: 'src/routes',
  importMode: 'async',
  routeStyle: 'nuxt',
  routesModuleId: '@routes',
  root: process.cwd(),
  dts: isPackageExists('typescript'),
  _inspect: false,
}
