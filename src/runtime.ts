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
export { stopScope as _stopScope } from './data-fetching/dataCache'

export function _definePage(
  route: Partial<Omit<RouteRecordRaw, 'children' | 'components' | 'component'>>
) {}
