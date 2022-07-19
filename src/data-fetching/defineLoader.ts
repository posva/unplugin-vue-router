import { RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
import { Ref, ToRefs } from 'vue'

export function defineLoader<P extends Promise<any>>(
  loader: (route: RouteLocationNormalizedLoaded) => P
): DataLoader<Awaited<P>> {
  const dataLoader: DataLoader<Awaited<P>> = (() => {
    const route = useRoute()

    return loader(route)
  }) as DataLoader<Awaited<P>>

  dataLoader.withError = <E>() => dataLoader as DataLoader<Awaited<P>, E>
  dataLoader._loader = loader

  return dataLoader
}

export interface DataLoader<T, E = unknown> {
  (): _DataLoaderResult<E> & ToRefs<T>

  withError: <E>() => DataLoader<T, E>

  // internal loader to call before
  _loader: (route: RouteLocationNormalizedLoaded) => Promise<T>
}

export interface _DataLoaderResult<E = unknown> {
  pending: Ref<boolean>
  error: Ref<E>
  refresh: () => Promise<void>
}
