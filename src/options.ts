import { isPackageExists as isPackageInstalled } from 'local-pkg'
import { getFileBasedRouteName, isArray, warn } from './core/utils'
import type { TreeNode } from './core/tree'
import { resolve } from 'pathe'
import { EditableTreeNode } from './core/extendRoutes'
import { type ParseSegmentOptions } from './core/treeNodeValue'
import { type _Awaitable } from './utils'

// TODO: remove from exports and move export to src/index?

/**
 * Options for a routes folder.
 */
export interface RoutesFolderOption {
  /**
   * Folder to scan files that should be used for routes. **Cannot be a glob**, use the `path`, `filePatterns`, and
   * `exclude` options to filter out files. This section will **be removed** from the resulting path.
   */
  src: string

  /**
   * Prefix to add to the route path **as is**. Defaults to `''`. Can also be a function
   * to reuse parts of the filepath, in that case you should return a **modified version of the filepath**.
   *
   * @example
   * ```js
   * {
   *   src: 'src/pages',
   *   // this is equivalent to the default behavior
   *   path: (file) => file.slice(file.lastIndexOf('src/pages') + 'src/pages'.length
   * },
   * {
   *   src: 'src/features',
   *   // match all files (note the \ is not needed in real code)
   *   filePatterns: '*‍/pages/**\/',
   *   path: (file) => {
   *     const prefix = 'src/features'
   *     // remove the everything before src/features and removes /pages
   *     // /src/features/feature1/pages/index.vue -> feature1/index.vue
   *     return file.slice(file.lastIndexOf(prefix) + prefix.length + 1).replace('/pages', '')
   *   },
   * },
   * {
   *   src: 'src/docs',
   *   // adds a prefix with a param
   *   path: 'docs/[lang]/',
   * },
   * ```
   */
  path?: string | ((filepath: string) => string)

  /**
   * Allows to override the global `filePattern` option for this folder. It can also extend the global values by passing
   * a function that returns an array.
   */
  filePatterns?: _OverridableOption<string[]> | string

  /**
   * Allows to override the global `exclude` option for this folder. It can also extend the global values by passing a
   * function that returns an array.
   */
  exclude?: _OverridableOption<string[]>

  /**
   * Allows to override the global `extensions` option for this folder. It can also extend the global values by passing
   * a function that returns an array.
   */
  extensions?: _OverridableOption<string[]>
}

/**
 * Normalized options for a routes folder.
 */
export interface RoutesFolderOptionResolved extends RoutesFolderOption {
  path: string | ((filepath: string) => string)
  /**
   * Final glob pattern to match files in the folder.
   */
  pattern: string[]
  filePatterns: string[]
  exclude: string[]
  extensions: string[]
}

export type _OverridableOption<T> = T | ((existing: T) => T)

export type _RoutesFolder = string | RoutesFolderOption
export type RoutesFolder = _RoutesFolder[] | _RoutesFolder

export interface ResolvedOptions {
  /**
   * Extensions of files to be considered as pages. Cannot be empty. This allows to strip a
   * bigger part of the filename e.g. `index.page.vue` -> `index` if an extension of `.page.vue` is provided.
   * @default `['.vue']`
   */
  extensions: string[]

  routesFolder: RoutesFolderOption[]

  /**
   * Array of `picomatch` globs to ignore. Note the globs are relative to the cwd, so avoid writing
   * something like `['ignored']` to match folders named that way, instead provide a path similar to the `routesFolder`:
   * `['src/pages/ignored/**']` or use `['**​/ignored']` to match every folder named `ignored`.
   * @default `[]`
   */
  exclude: string[]

  // NOTE: the comment below contains ZWJ characters to allow the sequence `**/*` to be displayed correctly
  /**
   * Pattern to match files in the `routesFolder`. Defaults to `**‍/*` plus a combination of all the possible extensions,
   * e.g. `**‍/*.{vue,md}` if `extensions` is set to `['.vue', '.md']`.
   * @default `'**‍/*'`
   */
  filePatterns: string | string[]

  /**
   * Method to generate the name of a route. It's recommended to keep the default value to guarantee a consistent,
   * unique, and predictable naming.
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
  extendRoute?: (route: EditableTreeNode) => _Awaitable<void>

  /**
   * Allows to do some changes before writing the files. This will be invoked **every time** the files need to be written.
   *
   * @experimental See https://github.com/posva/unplugin-vue-router/issues/43
   *
   * @param rootRoute - {@link EditableTreeNode} of the root route
   */
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => _Awaitable<void>

  /**
   * Defines how page components should be imported. Defaults to dynamic imports to enable lazy loading of pages.
   * @default `'async'`
   */
  importMode: 'sync' | 'async' | ((filepath: string) => 'sync' | 'async')

  /**
   * Root of the project. All paths are resolved relatively to this one.
   * @default `process.cwd()`
   */
  root: string

  /**
   * Language for `<route>` blocks in SFC files.
   * @default `'json5'`
   */
  routeBlockLang: 'yaml' | 'yml' | 'json5' | 'json'

  /**
   * Should we generate d.ts files or ont. Defaults to `true` if `typescript` is installed. Can be set to a string of
   * the filepath to write the d.ts files to. By default it will generate a file named `typed-router.d.ts`.
   * @default `true`
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

  /**
   * @inheritDoc ParseSegmentOptions
   */
  pathParser: ParseSegmentOptions
}

/**
 * unplugin-vue-router plugin options.
 */
export interface Options
  extends Partial<Omit<ResolvedOptions, 'routesFolder'>> {
  /**
   * Folder(s) to scan for files and generate routes. Can also be an array if you want to add multiple
   * folders, or an object if you want to define a route prefix. Supports glob patterns but must be a folder, use
   * `extensions` and `exclude` to filter files.
   *
   * @default `"src/pages"`
   */
  routesFolder?: RoutesFolder
}

export const DEFAULT_OPTIONS: ResolvedOptions = {
  extensions: ['.vue'],
  exclude: [],
  routesFolder: [{ src: 'src/pages' }],
  filePatterns: '**/*',
  routeBlockLang: 'json5',
  getRouteName: getFileBasedRouteName,
  importMode: 'async',
  root: process.cwd(),
  dts: isPackageInstalled('typescript'),
  logs: false,
  _inspect: false,
  pathParser: {
    dotNesting: true,
  },
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
