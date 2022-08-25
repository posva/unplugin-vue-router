import type { RouteRecordRaw } from 'vue-router'

export { defineLoader as _defineLoader } from './data-fetching/defineLoader'
export type {
  DefineLoaderOptions,
  DataLoader,
} from './data-fetching/defineLoader'
export {
  setupDataFetchingGuard as _setupDataFetchingGuard,
  LoaderSymbol as _LoaderSymbol,
} from './data-fetching/dataFetchingGuard'
export { stopScope as _stopDataFetchingScope } from './data-fetching/dataCache'

/**
 * Defines properties of the route for the current page component.
 *
 * @param route - route information to be added to this page
 */
export function _definePage(
  route: Partial<Omit<RouteRecordRaw, 'children' | 'components' | 'component'>>
) {}
