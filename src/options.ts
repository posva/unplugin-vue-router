import { isPackageExists } from 'local-pkg'
import { Awaitable, getFileBasedRouteName, isArray, warn } from './core/utils'
import type { TreeNode } from './core/tree'
import { resolve } from 'pathe'
import { EditableTreeNode } from './core/extendRoutes'

export interface RoutesFolderOption {
  /**
   * Path to the folder containing the components that should be used for routes.
   */
  src: string

  // TODO: allow a function to customize based on the filepath
  /**
   * Prefix to add to the route path. Defaults to `''`. Must **end with a slash** and **start without one**.
   */
  path?: string

  /**
   * Allows to override the global `filePattern` option for this folder.
   */
  filePatterns?: string | string[]

  /**
   * Allows to override the global `extensions` option for this folder.
   */
  extensions?: string[]
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
   * @default "src/pages"
   */
  routesFolder: RoutesFolderOption[]

  /**
   * Array of `picomatch` globs to ignore. Defaults to `[]`. Note the globs are relative to the `routesFolder`, so avoid
   * writing something like `['src/pages']` as **it won't match anything**.
   */
  exclude: string[]

  // NOTE: the comment below contains ZWJ characters to allow the sequence `**/*` to be displayed correctly
  /**
   * Pattern to match files in the `routesFolder`. Defaults to `**‍/*` plus a combination of all the possible extensions,
   * e.g. `**‍/*.{vue,md}` if `extensions` is set to `['.vue', '.md']`.
   * @default "**‍/*"
   */
  filePatterns: string | string[]

  /**
   * Method to generate the name of a route.
   */
  getRouteName: (node: TreeNode) => string

  /**
   * Allows to extend a route by modifying its node, adding children, or even deleting it. This will be invoked once for
   * each route.
   *
   * @experimental See https://github.com/posva/unplugin-vue-router/issues/43
   *
   * @param route - {@link EditableTreeNode} of the route to extend
   */
  extendRoute?: (route: EditableTreeNode) => Awaitable<void>

  /**
   * Allows to do some changes before writing the files. This will be invoked **every time** the files need to be written.
   *
   * @experimental See https://github.com/posva/unplugin-vue-router/issues/43
   *
   * @param rootRoute - {@link EditableTreeNode} of the root route
   */
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => Awaitable<void>

  /**
   * Enables EXPERIMENTAL data fetching. See https://github.com/posva/unplugin-vue-router/tree/main/src/data-fetching
   * @experimental
   */
  dataFetching: boolean

  /**
   * Defines how page components should be imported. Defaults to dynamic imports to enable lazy loading of pages.
   */
  importMode: _OptionsImportMode

  /**
   * Root of the project. All paths are resolved relatively to this one. Defaults to `process.cwd()`.
   */
  root: string

  /**
   * Language for `<route>` blocks in SFC files. Defaults to `'json5'`.
   */
  routeBlockLang: 'yaml' | 'yml' | 'json5' | 'json'

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

/**
 * @internal
 */
export type _OptionsImportMode =
  | 'sync'
  | 'async'
  | ((filepath: string) => 'sync' | 'async')

export interface Options
  extends Partial<Omit<ResolvedOptions, 'routesFolder'>> {
  routesFolder?: RoutesFolder
}

export const DEFAULT_OPTIONS: ResolvedOptions = {
  extensions: ['.vue'],
  exclude: [],
  routesFolder: [{ src: 'src/pages' }],
  filePatterns: '**/*',
  routeBlockLang: 'json5',
  getRouteName: getFileBasedRouteName,
  dataFetching: false,
  importMode: 'async',
  root: process.cwd(),
  dts: isPackageExists('typescript'),
  logs: false,
  _inspect: false,
}

export interface ServerContext {
  invalidate: (module: string) => void
  reload: () => void
}

function normalizeRoutesFolderOption(
  routesFolder: RoutesFolder
): RoutesFolderOption[] {
  return (isArray(routesFolder) ? routesFolder : [routesFolder]).map(
    (routeOption) =>
      typeof routeOption === 'string' ? { src: routeOption } : routeOption
  )
}

/**
 * Normalize user options with defaults and resolved paths.
 *
 * @param options - user provided options
 * @returns normalized options
 */
export function resolveOptions(options: Options): ResolvedOptions {
  const root = options.root || DEFAULT_OPTIONS.root

  // normalize the paths with the root
  const routesFolder = normalizeRoutesFolderOption(
    options.routesFolder || DEFAULT_OPTIONS.routesFolder
  ).map((routeOption) => ({
    ...routeOption,
    src: resolve(root, routeOption.src),
  }))

  if (options.extensions) {
    options.extensions = options.extensions
      // ensure that extensions start with a dot or warn the user
      // this is needed when filtering the files with the pattern .{vue,js,ts}
      // in src/index.ts
      .map((ext) => {
        if (!ext.startsWith('.')) {
          warn(`Invalid extension "${ext}". Extensions must start with a dot.`)
          return '.' + ext
        }
        return ext
      })
      // sort extensions by length to ensure that the longest one is used first
      // e.g. ['.vue', '.page.vue'] -> ['.page.vue', '.vue'] as both would match and order matters
      .sort((a, b) => b.length - a.length)
  }

  return {
    ...DEFAULT_OPTIONS,
    ...options,
    routesFolder,
  }
}
