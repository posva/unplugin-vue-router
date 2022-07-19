import { RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
import { ref, Ref, ToRefs } from 'vue'

export function defineLoader<P extends Promise<any>>(
  loader: (route: RouteLocationNormalizedLoaded) => P
): DataLoader<Awaited<P>> {
  const dataLoader: DataLoader<Awaited<P>> = (() => {
    const route = useRoute()

    const data = loader(route)
    const pending = ref(false)
    const error = ref<unknown>()

    function refresh() {}

    return {
      ...data,
      pending,
      error,
      refresh,
    }
  }) as DataLoader<Awaited<P>>

  dataLoader._loader = loader

  return dataLoader
}

export interface DataLoader<T> {
  (): _DataLoaderResult & ToRefs<T>

  // internal loader to call before
  _loader: (route: RouteLocationNormalizedLoaded) => Promise<T>
}

export interface _DataLoaderResult {
  pending: Ref<boolean>
  error: Ref<any> // any is simply more convenient for errors
  refresh: () => Promise<void>
}

// new WeakMap<Function, any>()
