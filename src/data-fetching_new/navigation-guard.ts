import type { Router, NavigationGuard } from 'vue-router'
import { isNavigationFailure } from 'vue-router'
import { effectScope, type App, type EffectScope } from 'vue'
import {
  ABORT_CONTROLLER_KEY,
  APP_KEY,
  LOADER_ENTRIES_KEY,
  LOADER_SET_KEY,
  NAVIGATION_RESULTS_KEY,
  PENDING_LOCATION_KEY,
} from './meta-extensions'
import { IS_CLIENT, assign, isDataLoader, setCurrentContext } from './utils'
import type { _Awaitable } from '../core/utils'
import type { _RouteLocationNormalizedLoaded } from '../typeExtensions/routeLocation'
import type { _Router } from '../typeExtensions/router'

/**
 * TODO: export functions that allow preloading outside of a navigation guard
 */

/**
 * Setups the different Navigation Guards to collect the data loaders from the route records and then to execute them.
 * @internal used by the `DataLoaderPlugin`
 * @see {@link DataLoaderPlugin}
 *
 * @param router - the router instance
 * @returns
 */
export function setupLoaderGuard({
  router,
  app,
  effect,
  selectNavigationResult = (results) => results[0].value,
}: SetupLoaderGuardOptions) {
  // avoid creating the guards multiple times
  if (router[LOADER_ENTRIES_KEY] != null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[vue-router]: Data fetching was setup twice. Make sure to setup only once.'
      )
    }
    return () => {}
  }

  // explicit dev to avoid warnings in tests
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[vue-router]: Data fetching is experimental and subject to breaking changes in the future.'
    )
  }

  // Access to the entries map for convenience
  router[LOADER_ENTRIES_KEY] = new WeakMap()

  // Access to `app.runWithContext()`
  router[APP_KEY] = app

  // guard to add the loaders to the meta property
  const removeLoaderGuard = router.beforeEach((to) => {
    // Here we could check if there is a pending navigation and call abort:
    // if (router[PENDING_LOCATION_KEY]) {
    //   router[PENDING_LOCATION_KEY].meta[ABORT_CONTROLLER_KEY]!.abort()
    // }
    // but we don't need it because we already abort in afterEach and onError
    // and both are called if a new navigation happens

    // global pending location, used by nested loaders to know if they should load or not
    router[PENDING_LOCATION_KEY] = to
    // Differently from records, this one is reset on each navigation
    // so it must be built each time
    to.meta[LOADER_SET_KEY] = new Set()
    // adds an abort controller that can pass a signal to loaders
    to.meta[ABORT_CONTROLLER_KEY] = new AbortController()
    // allow loaders to add navigation results
    to.meta[NAVIGATION_RESULTS_KEY] = []

    // Collect all the lazy loaded components to await them in parallel
    const lazyLoadingPromises: Promise<unknown>[] = []

    for (const record of to.matched) {
      // we only need to do this once per record as these changes are preserved
      // by the router
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

    return Promise.all(lazyLoadingPromises).then(() => {
      // group all the loaders in a single set
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
    // if we reach this guard, all properties have been set
    const loaders = Array.from(to.meta[LOADER_SET_KEY]!)

    // TODO: could we benefit anywhere here from verifying the signal is aborted and not call the loaders at all
    // if (to.meta[ABORT_CONTROLLER_KEY]!.signal.aborted) {
    //   return
    // }

    // unset the context so all loaders are executed as root loaders
    setCurrentContext([])
    return Promise.all(
      loaders.map((loader) => {
        const { commit, server, lazy } = loader._.options
        // do not run on the server if specified
        // TODO: IS_CLIENT should only be true on SSR but it's simpler to just check for the browser environment. Maybe pass as an argument to the loader?
        if (!server && !IS_CLIENT) {
          return
        }
        // keep track of loaders that should be committed after all loaders are done
        const ret = effect
          .run(() =>
            app
              // allows inject and provide APIs
              .runWithContext(() =>
                loader._.load(
                  to as _RouteLocationNormalizedLoaded,
                  router as _Router
                )
              )
          )!
          .then(() => {
            // for immediate loaders, the load function handles this
            // NOTE: it would be nice to also have here the immediate commit
            // but running it here is too late for nested loaders as we are appending
            // to the pending promise that is actually awaited in nested loaders
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
            loader._.getEntry(router as _Router).commit(
              to as _RouteLocationNormalizedLoaded
            )
          }
        }
        // console.log(
        //   `✨ Navigation results "${to.fullPath}": [${to.meta[
        //     NAVIGATION_RESULTS_KEY
        //   ]!.map((r) => JSON.stringify(r.value)).join(', ')}]`
        // )
        if (to.meta[NAVIGATION_RESULTS_KEY]!.length) {
          return selectNavigationResult(to.meta[NAVIGATION_RESULTS_KEY]!)
        }
      })
    // no catch so errors are propagated to the router
  })

  // listen to duplicated navigation failures to reset the pendingTo and pendingLoad
  // since they won't trigger the beforeEach or beforeResolve defined above
  const removeAfterEach = router.afterEach((to, _from, failure) => {
    // console.log(
    //   `🔚 afterEach "${_from.fullPath}" -> "${to.fullPath}": ${failure?.message}`
    // )
    // abort the signal of a failed navigation
    // we need to check if it exists because the navigation guard that creates
    // the abort controller could not be triggered depending on the failure
    if (failure && to.meta[ABORT_CONTROLLER_KEY]) {
      to.meta[ABORT_CONTROLLER_KEY].abort(failure)
    }

    if (
      // NOTE: using a smaller version to cutoff some bytes
      isNavigationFailure(failure, 16 /* NavigationFailureType.duplicated */)
    ) {
      if (router[PENDING_LOCATION_KEY]) {
        // the PENDING_LOCATION_KEY is set at the same time the LOADER_SET_KEY is set
        // so we know it exists
        router[PENDING_LOCATION_KEY].meta[LOADER_SET_KEY]!.forEach((loader) => {
          const entry = loader._.getEntry(router as _Router)
          entry.pendingTo = null
          entry.pendingLoad = null
        })
        // avoid this navigation being considered valid by the loaders
        router[PENDING_LOCATION_KEY] = null
      }
    }
  })

  // TODO: allow throwing a NavigationResult to skip the selectNavigationResult

  // abort the signal on thrown errors
  const removeOnError = router.onError((error, to) => {
    // same as with afterEach, we check if it exists because the navigation guard
    // that creates the abort controller could not be triggered depending on the error
    if (to.meta[ABORT_CONTROLLER_KEY]) {
      to.meta[ABORT_CONTROLLER_KEY].abort(error)
    }
  })

  return () => {
    // @ts-expect-error: must be there in practice
    delete router[LOADER_ENTRIES_KEY]
    removeLoaderGuard()
    removeDataLoaderGuard()
    removeAfterEach()
    removeOnError()
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
 * Options to initialize the data loader guard.
 */
export interface SetupLoaderGuardOptions {
  /**
   * The Vue app instance. Used to access the `provide` and `inject` APIs.
   */
  app: App<unknown>

  /**
   * The effect scope to use for the data loaders.
   */
  effect: EffectScope

  /**
   * The router instance. Adds the guards to it
   */
  router: _Router

  /**
   * Called if any data loader returns a `NavigationResult` with an array of them. Should decide what is the outcome of
   * the data fetching guard. Note this isn't called if no data loaders return a `NavigationResult` or if an error is thrown.
   * @defaultValue `(results) => results[0].value`
   */
  selectNavigationResult?: (
    results: NavigationResult[]
  ) => _Awaitable<
    Exclude<ReturnType<NavigationGuard>, Function | Promise<unknown>>
  >
}

/**
 * Possible values to change the result of a navigation within a loader
 * @internal
 */
export type _DataLoaderRedirectResult = Exclude<
  ReturnType<NavigationGuard>,
  // only preserve values that cancel the navigation
  Promise<unknown> | Function | true | void | undefined
>

/**
 * Possible values to change the result of a navigation within a loader. Can be returned from a data loader and will
 * appear in `selectNavigationResult`. If thrown, it will immediately cancel the navigation.
 *
 * @example
 * ```ts
 * export const useUserData = defineLoader(async (to) => {
 *   const user = await fetchUser(to.params.id)
 *   if (!user) {
 *     return new NavigationResult('/404')
 *   }
 *   return user
 * })
 * ```
 */
export class NavigationResult {
  constructor(public readonly value: _DataLoaderRedirectResult) {}
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
export function DataLoaderPlugin(app: App, options: DataLoaderPluginOptions) {
  const effect = effectScope(true)
  const removeGuards = setupLoaderGuard(assign({ app, effect }, options))

  // TODO: use https://github.com/vuejs/core/pull/8801 if merged
  const { unmount } = app
  app.unmount = () => {
    effect.stop()
    removeGuards()
    unmount.call(app)
  }
}

/**
 * Options passed to the DataLoaderPlugin.
 */
export interface DataLoaderPluginOptions
  extends Omit<SetupLoaderGuardOptions, 'app' | 'effect'> {}
