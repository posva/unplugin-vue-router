/**
 * This file only contain types and is used for the generated d.ts to avoid polluting the global namespace.
 * https://github.com/posva/unplugin-vue-router/issues/136
 */

export type { Options } from './options'

export type {
  _RouteMapGeneric,
  RouteRecordInfo,
} from './codegen/generateRouteMap'
export type {
  // TODO: mark all of these as internals since the dynamically exposed versions are fully typed, these are just helpers
  // to generate the convenient types
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,
  RouteLocationAsString,
  RouteLocationTyped,
  RouteLocationTypedList,
  RouteLocationResolvedTyped,
  RouteLocationResolvedTypedList,
  RouteLocationNormalizedTyped,
  RouteLocationNormalizedTypedList,
  RouteLocationNormalizedLoadedTyped,
  RouteLocationNormalizedLoadedTypedList,
} from './typeExtensions/routeLocation'
export type { NavigationGuard } from './typeExtensions/navigationGuards'
export type { _RouterTyped } from './typeExtensions/router'
export type {
  RouterLinkTyped,
  UseLinkFnTyped,
  _UseLinkReturnTyped,
} from './typeExtensions/RouterLink'
export type {
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,
} from './codegen/generateRouteParams'

export type { TreeNode } from './core/tree'
export type {
  TreeNodeValueParam,
  TreeNodeValueStatic,
} from './core/treeNodeValue'

// expose for generated type extensions
export type {
  DefineLoaderOptions as _DefineLoaderOptions,
  DataLoader as _DataLoader,
} from './data-fetching/defineLoader'
