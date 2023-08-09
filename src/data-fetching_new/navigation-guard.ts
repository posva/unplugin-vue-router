import type { Router } from 'vue-router'
import { effectScope, type App, type EffectScope } from 'vue'
import {
  APP_KEY,
  LOADER_ENTRIES_KEY,
  LOADER_SET_KEY,
  PENDING_LOCATION_KEY,
} from './symbols'
import { IS_CLIENT, isDataLoader, setCurrentContext } from './utils'
import { isNavigationFailure } from 'vue-router'

/**
 * Setups the different Navigation Guards to collect the data loaders from the route records and then to execute them.
 *
 * @param router - the router instance
 * @returns
 */
export function setupLoaderGuard(
  router: Router,
  app: App,
  effect: EffectScope
) {
  // avoid creating the guards multiple times
  if (router[LOADER_ENTRIES_KEY] != null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[vue-router]: Data fetching was setup twice. Make sure to setup only once.'
      )
    }
    return () => {}
  }

  // Access to the entries map for convenience
  router[LOADER_ENTRIES_KEY] = new WeakMap()

  // Access to `app.runWithContext()`
  router[APP_KEY] = app

  // guard to add the loaders to the meta property
  const removeLoaderGuard = router.beforeEach((to) => {
    // global pending location, used by nested loaders to know if they should load or not
    router[PENDING_LOCATION_KEY] = to
    // Differently from records, this one is reset on each navigation
    // so it must be built each time
    to.meta[LOADER_SET_KEY] = new Set()
    // reference the loader entries map for convenience
    to.meta[LOADER_ENTRIES_KEY] = router[LOADER_ENTRIES_KEY]

    // Collect all the lazy loaded components to await them in parallel
    const lazyLoadingPromises = []

    for (const record of to.matched) {
      if (!record.meta[LOADER_SET_KEY]) {
        // setup an empty array to skip the check next time
        record.meta[LOADER_SET_KEY] = new Set(record.meta.loaders || [])

        // add all the loaders from the components to the set
        for (const componentName in record.components) {
          const component: unknown = record.components[componentName]

          // we only add async modules because otherwise the component doesn't have any loaders and the user should add
          // them with the `loaders` array
          if (isAsyncModule(component)) {
            const promise = component().then(
              (viewModule: Record<string, unknown>) => {
                for (const exportName in viewModule) {
                  const exportValue = viewModule[exportName]

                  if (isDataLoader(exportValue)) {
                    record.meta[LOADER_SET_KEY]!.add(exportValue)
                  }
                }
              }
            )

            lazyLoadingPromises.push(promise)
          }
        }
      }
    }

    // TODO: not use record to store loaders, or maybe cleanup here

    return Promise.all(lazyLoadingPromises).then(() => {
      for (const record of to.matched) {
        // merge the whole set of loaders
        for (const loader of record.meta[LOADER_SET_KEY]!) {
          to.meta[LOADER_SET_KEY]!.add(loader)
        }
      }
      // we return nothing to remove the value to allow the navigation
      // same as return true
    })
  })

  const removeDataLoaderGuard = router.beforeResolve((to) => {
    const loaders = Array.from(to.meta[LOADER_SET_KEY] || [])
    /**
     * - ~~Map the loaders to an array of promises~~
     * - ~~Await all the promises (parallel)~~
     * - Collect NavigationResults and call `selectNavigationResult` to select the one to use
     */

    // unset the context so all loaders are executed as root loaders
    setCurrentContext([])
    return Promise.all(
      loaders.map((loader) => {
        const { commit, server, lazy } = loader._.options
        // do not run on the server if specified
        if (!server && !IS_CLIENT) {
          return
        }
        // keep track of loaders that should be committed after all loaders are done
        const ret = app
          // allows inject and provide APIs
          .runWithContext(() => loader._.load(to, router))
          .then(() => {
            // for immediate loaders, the load function handles this
            // NOTE: it would be nice to also have here the immediate commit
            // but running it here is too late for nested loaders
            if (commit === 'after-load') {
              return loader
            }
          })
        // on client-side, lazy loaders are not awaited, but on server they are
        return IS_CLIENT && lazy
          ? undefined
          : // return the non-lazy loader to commit changes after all loaders are done
            ret
      })
    ) // let the navigation go through by returning true or void
      .then((loaders) => {
        for (const loader of loaders) {
          if (loader) {
            // console.log(`⬇️ Committing ${loader.name}`)
            loader._.getEntry(router).commit(to)
          }
        }
        // TODO:
        // reset the initial state as it can only be used once
        // initialData = undefined
        // NOTE: could this be dev only?
        // isFetched = true
      })
    // no catch so errors are propagated to the router
    // TODO: handle navigation failures?
  })

  // listen to duplicated navigation failures to reset the pendingTo and pendingLoad
  // since they won't trigger the beforeEach or beforeResolve defined above
  router.afterEach((_to, _from, failure) => {
    if (
      isNavigationFailure(failure, 16 /* NavigationFailureType.duplicated */)
    ) {
      if (router[PENDING_LOCATION_KEY]) {
        router[PENDING_LOCATION_KEY].meta[LOADER_SET_KEY]!.forEach((loader) => {
          const entry = loader._.getEntry(router)
          entry.pendingTo = null
          entry.pendingLoad = null
        })
        router[PENDING_LOCATION_KEY] = null
      }
    }
  })

  return () => {
    // @ts-expect-error: must be there in practice
    delete router[LOADER_ENTRIES_KEY]
    removeLoaderGuard()
    removeDataLoaderGuard()
  }
}

/**
 * Allows differentiating lazy components from functional components and vue-class-component
 * @internal
 *
 * @param component
 */
export function isAsyncModule(
  asyncMod: unknown
): asyncMod is () => Promise<Record<string, unknown>> {
  return (
    typeof asyncMod === 'function' &&
    // vue functional components
    !('displayName' in asyncMod) &&
    !('props' in asyncMod) &&
    !('emits' in asyncMod) &&
    !('__vccOpts' in asyncMod)
  )
}

/**
 * Data Loader plugin to add data loading support to Vue Router.
 *
 * @example
 * ```ts
 * import { createApp } from 'vue'
 * import {
 *   createRouter,
 *   DataLoaderPlugin,
 *   createWebHistory,
 * } from 'vue-router/auto'
 *
 * const router = createRouter({
 *   history: createWebHistory(),
 * })
 *
 * const app = createApp({})
 * app.use(DataLoaderPlugin, { router })
 * app.use(router)
 * ```
 */
export function DataLoaderPlugin(
  app: App,
  { router }: DataLoaderPluginOptions
) {
  const effect = effectScope(true)
  const removeGuards = setupLoaderGuard(router, app, effect)

  // TODO: use https://github.com/vuejs/core/pull/8801 if merged
  const { unmount } = app
  app.unmount = () => {
    effect.stop()
    removeGuards()
    unmount.call(app)
  }
}

export interface DataLoaderPluginOptions {
  router: Router
}
