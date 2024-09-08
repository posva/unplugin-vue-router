export type {
  UseDataLoader,
  UseDataLoaderInternals,
  UseDataLoaderResult,
  DataLoaderContextBase,
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase,
  DefineLoaderFn,
} from './createDataLoader'

// new data fetching
export { DataLoaderPlugin, NavigationResult } from './navigation-guard'
export type {
  DataLoaderPluginOptions,
  SetupLoaderGuardOptions,
  _DataLoaderRedirectResult,
} from './navigation-guard'

export {
  getCurrentContext,
  setCurrentContext,
  type _PromiseMerged,
  assign,
  isSubsetOf,
  trackRoute,
  withLoaderContext,
  currentContext,
} from './utils'

// NOTE: for tests only
// export * from './defineQueryLoader'

// expose all symbols that could be use by loaders
export * from './meta-extensions'
