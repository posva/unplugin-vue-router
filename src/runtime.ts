import { type RouteRecordRaw } from 'vue-router'

export type {
  UseDataLoader,
  UseDataLoaderInternals,
  UseDataLoaderResult,
  DataLoaderContextBase,
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase,
  DefineLoaderFn,
  _DataMaybeLazy,
} from './data-loaders/createDataLoader'

// new data fetching
export {
  DataLoaderPlugin,
  NavigationResult,
} from './data-loaders/navigation-guard'
export type {
  DataLoaderPluginOptions,
  SetupLoaderGuardOptions,
  _DataLoaderRedirectResult,
} from './data-loaders/navigation-guard'

// NOTE: for tests only
// export * from './data-loaders/defineQueryLoader'

/**
 * Defines properties of the route for the current page component.
 *
 * @param route - route information to be added to this page
 * @deprecated - use `definePage` instead
 */
export const _definePage = (route: DefinePage) => route
/**
 * Defines properties of the route for the current page component.
 *
 * @param route - route information to be added to this page
 */
export const definePage = (route: DefinePage) => route

/**
 * Merges route records.
 *
 * @internal
 *
 * @param main - main route record
 * @param routeRecords - route records to merge
 * @returns merged route record
 */
export function _mergeRouteRecord(
  main: RouteRecordRaw,
  ...routeRecords: Partial<RouteRecordRaw>[]
): RouteRecordRaw {
  // @ts-expect-error: complicated types
  return routeRecords.reduce((acc, routeRecord) => {
    const meta = Object.assign({}, acc.meta, routeRecord.meta)
    const alias: string[] = ([] as string[]).concat(
      acc.alias || [],
      routeRecord.alias || []
    )

    // TODO: other nested properties
    // const props = Object.assign({}, acc.props, routeRecord.props)

    Object.assign(acc, routeRecord)
    acc.meta = meta
    acc.alias = alias
    return acc
  }, main)
}

/**
 * Type to define a page. Can be augmented to add custom properties.
 */
export interface DefinePage
  extends Partial<
    Omit<RouteRecordRaw, 'children' | 'components' | 'component'>
  > {}
