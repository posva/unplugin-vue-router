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

  // Types that exist in Vue Router but are augmented to be typed if _TypesConfig is provided
  // with the RouteNamedMap
  _RouteLocationNormalized as RouteLocationNormalized,
  _RouteRecordName as RouteRecordName,
  _RouteLocationNormalizedLoaded as RouteLocationNormalizedLoaded,
  _RouteLocation as RouteLocation,
  _RouteLocationAsRelativePath as RouteLocationAsRelativePath,
  _RouteLocationRaw as RouteLocationRaw,
  _RouteLocationResolved as RouteLocationResolved,
  _RouteParams as RouteParams,
  _RouteParamsRaw as RouteParamsRaw,
} from './typeExtensions/routeLocation'
export type {
  NavigationGuard,
  NavigationGuardWithThis,
} from './typeExtensions/navigationGuards'
export type {
  // TODO: deprecate and remove
  _RouterTyped,
  _Router as Router,
} from './typeExtensions/router'
export type {
  RouterLinkTyped,
  UseLinkFnTyped,
  _UseLinkReturnTyped,
  RouterLinkPropsTyped,
} from './typeExtensions/RouterLink'
export type { _TypesConfig } from './typeExtensions/types-config'
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
  DefineLoaderFn as _DefineLoaderFn,
  UseDataLoader as _UseDataLoader,
} from './data-fetching_new/createDataLoader'
export type {
  // ...
  NavigationResult,
} from './data-fetching_new/navigation-guard'
export type {
  DefineDataLoaderOptions as _DefineDataLoaderOptions,
  DataLoaderContext as _DataLoaderContext,
} from './data-fetching_new/defineLoader'
