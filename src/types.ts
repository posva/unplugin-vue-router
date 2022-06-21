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
  _inspect: false,
}
