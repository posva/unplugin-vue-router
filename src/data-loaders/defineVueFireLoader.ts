import {
  RouteLocationNormalizedLoaded,
  Router,
  useRoute,
  useRouter,
} from 'vue-router'
import type { DocumentData, DocumentReference } from 'firebase/firestore'
import { _RefFirestore, useDocument, UseDocumentOptions } from 'vuefire'
import {
  UseDataLoader,
  DefineDataLoaderOptionsBase,
  DataLoaderEntryBase,
  _DataMaybeLazy,
  UseDataLoaderResult,
  assign,
  getCurrentContext,
  setCurrentContext,
  APP_KEY,
  IS_USE_DATA_LOADER_KEY,
  LOADER_ENTRIES_KEY,
  STAGED_NO_VALUE,
} from 'unplugin-vue-router/runtime'
import { Ref, UnwrapRef, ref, shallowRef } from 'vue'

export function defineVueFireLoader<
  Doc extends DocumentReference<unknown, DocumentData>,
  isLazy extends boolean,
>(
  loader: (route: RouteLocationNormalizedLoaded) => Doc,
  opts?: DefineVueFireDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, _ExtractDocumentType<Doc>> {
  const options = assign(
    {} as DefineVueFireDataLoaderOptions<isLazy>,
    DEFAULT_DEFINE_LOADER_OPTIONS,
    opts
  )

  function load(
    to: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: VueFireDataLoaderEntry,
    initialRootData?: Record<string, unknown>
  ): Promise<void> {
    const entries = router[LOADER_ENTRIES_KEY]!
    if (!entries.has(loader)) {
      // NOTE: the important part becomes updating this doc variable to the correct doc that should be loaded. It's not always the last one being loaded, it's where we check the pending location and stuff
      const doc = shallowRef(loader(to))
      const ff = useDocument(doc, {
        ...options,
        target: options.key ? ref(initialRootData?.[options.key]) : undefined,
      })
      // pass ff.data and others to create the entry
      const { data, pending, error, promise, stop } = ff
      // TODO: what do to with stop

      entries.set(loader, {
        // NOTE: create entry
        // TODO: maybe a create entry base with only the common properties? but that would just be children?
        data,
        isLoading: isLoading,
        error,

        children: new Set(),
        get pendingLoad() {
          return promise.value.then(() => {})
        },
        pendingTo: null,
        staged: STAGED_NO_VALUE,
        commit,
      } satisfies VueFireDataLoaderEntry)
    }
    const entry: VueFireDataLoaderEntry = entries.get(loader)!

    // Nested loaders might get called before the navigation guard calls them, so we need to manually skip these calls
    if (entry.pendingTo === to && entry.pendingLoad) {
      // console.log(`🔁 already loading "${options.key}"`)
      return entry.pendingLoad
    }

    const { error, isLoading: isLoading } = entry

    error.value = null
    isLoading.value = true
    // save the current context to restore it later
    const currentContext = getCurrentContext()

    if (process.env.NODE_ENV === 'development') {
      if (parent !== currentContext[0]) {
        console.warn(
          `❌👶 "${options.key}" has a different parent than the current context. This shouldn't be happening. Please report a bug with a reproduction to https://github.com/posva/unplugin-vue-router/`
        )
      }
    }
    // set the current context before loading so nested loaders can use it
    setCurrentContext([entry, router, to])
    // console.log(
    //   `😎 Loading context to "${to.fullPath}" with current "${currentContext[2]?.fullPath}"`
    // )
    // Currently load for this loader
    entry.pendingTo = to
    // Promise.resolve() allows loaders to also be sync
    const currentLoad = Promise.resolve(loader(to))
      .then((d) => {
        // console.log(
        //   `✅ resolved ${options.key}`,
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad}; data: ${d}`
        // )
        if (entry.pendingLoad === currentLoad) {
          entry.staged = d
        }
      })
      .catch((e) => {
        // console.log(
        //   '‼️ rejected',
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad} =`,
        //   e
        // )
        if (entry.pendingLoad === currentLoad) {
          error.value = e
          // propagate error if non lazy or during SSR
          if (!options.lazy || isSSR) {
            return Promise.reject(e)
          }
        }
      })
      .finally(() => {
        setCurrentContext(currentContext)
        // console.log(
        //   `😩 restored context ${options.key}`,
        //   currentContext?.[2]?.fullPath
        // )
        if (entry.pendingLoad === currentLoad) {
          isLoading.value = false
          // we must run commit here so nested loaders are ready before used by their parents
          if (options.lazy || options.commit === 'immediate') {
            entry.commit(to)
          }
        }
      })

    // restore the context after the first tick to avoid lazy loaders to use their own context as parent
    setCurrentContext(currentContext)

    // this still runs before the promise resolves even if loader is sync
    // FIXME: cannot do anymore
    // entry.pendingLoad = currentLoad
    // console.log(`🔶 Promise set to pendingLoad "${options.key}"`)

    return currentLoad
  }

  function commit(
    this: VueFireDataLoaderEntry,
    to: RouteLocationNormalizedLoaded
  ) {
    if (this.pendingTo === to && !this.error.value) {
      // console.log('👉 commit', this.staged)
      if (process.env.NODE_ENV === 'development') {
        if (this.staged === STAGED_NO_VALUE) {
          console.warn(
            `Loader "${options.key}"'s "commit()" was called but there is no staged data.`
          )
        }
      }
      // if the entry is null, it means the loader never resolved, maybe there was an error
      if (this.staged !== STAGED_NO_VALUE) {
        this.data.value = this.staged
      }
      this.staged = STAGED_NO_VALUE
      this.pendingTo = null

      // children entries cannot be committed from the navigation guard, so the parent must tell them
      this.children.forEach((childEntry) => {
        childEntry.commit(to)
      })
    }
  }

  // @ts-expect-error: requires the internals and symbol that are added later
  const useDataLoader: // for ts
  UseDataLoader<isLazy, _ExtractDocumentType<Doc>> = () => {
    // work with nested data loaders
    let [parentEntry, _router, _route] = getCurrentContext()
    // fallback to the global router and routes for useDataLoaders used within components
    const router = _router || useRouter()
    const route = _route || useRoute()

    const entries = router[LOADER_ENTRIES_KEY]!
    let entry = entries.get(loader)

    // console.log(`-- useDataLoader called ${options.key} --`)
    // console.log(
    //   'router pending location',
    //   router[PENDING_LOCATION_KEY]?.fullPath
    // )
    // console.log('target route', route.fullPath)
    // console.log('has parent', !!parentEntry)
    // console.log('has entry', !!entry)
    // console.log('entryLatestLoad', entry?.pendingTo?.fullPath)
    // console.log('is same route', entry?.pendingTo === route)
    // console.log('-- END --')

    if (process.env.NODE_ENV === 'development') {
      if (!parentEntry && !entry) {
        console.error(
          `Some "useDataLoader()" was called outside of a component's setup or a data loader.`
        )
      }
    }

    // TODO: skip if route is not the router pending location
    if (
      // if the entry doesn't exist, create it with load and ensure it's loading
      !entry ||
      // the existing pending location isn't good, we need to load again
      (parentEntry && entry.pendingTo !== route)
    ) {
      // console.log(
      //   `🔁 loading from useData for "${options.key}": "${route.fullPath}"`
      // )
      router[APP_KEY].runWithContext(() => load(route, router, parentEntry))
    }

    entry = entries.get(loader)!

    // add ourselves to the parent entry children
    if (parentEntry) {
      if (parentEntry === entry) {
        console.warn(`👶❌ "${options.key}" has itself as parent`)
      }
      // console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      parentEntry.children.add(entry!)
    }

    const { data, error, isLoading: isLoading } = entry

    const useDataLoaderResult = {
      data,
      error,
      isLoading: isLoading,
      reload: (to: RouteLocationNormalizedLoaded = router.currentRoute.value) =>
        router[APP_KEY].runWithContext(() => load(to, router)).then(() =>
          entry!.commit(to)
        ),
    } satisfies UseDataLoaderResult

    // load ensures there is a pending load
    const promise = entry.pendingLoad!.then(() => {
      // nested loaders might wait for all loaders to be ready before setting data
      // so we need to return the staged value if it exists as it will be the latest one
      return entry!.staged === STAGED_NO_VALUE ? data.value : entry!.staged
    })

    return Object.assign(promise, useDataLoaderResult)
  }

  // mark it as a data loader
  useDataLoader[IS_USE_DATA_LOADER_KEY] = true

  // add the internals
  useDataLoader._ = {
    load,
    options,
    // @ts-expect-error: return type has the generics
    getEntry(router: Router) {
      return router[LOADER_ENTRIES_KEY]!.get(loader)!
    },
  }

  return useDataLoader
}

type _ExtractDocumentType<Doc> =
  Doc extends DocumentReference<infer D, any> ? D : unknown

export interface DefineVueFireDataLoaderOptions<isLazy extends boolean>
  extends DefineDataLoaderOptionsBase<isLazy>,
    UseDocumentOptions {
  /**
   * Key to use for SSR state.
   */
  key?: string
}

export interface VueFireDataLoaderEntry<
  isLazy extends boolean = boolean,
  Data = unknown,
> extends DataLoaderEntryBase<isLazy, Data> {
  children: Set<VueFireDataLoaderEntry>

  commit(
    this: VueFireDataLoaderEntry<isLazy, Data>,
    to: RouteLocationNormalizedLoaded
  ): void

  get pendingLoad(): Promise<void> | null
}

const DEFAULT_DEFINE_LOADER_OPTIONS = {
  lazy: false,
  server: true,
  commit: 'immediate',
} satisfies Required<DefineDataLoaderOptionsBase<boolean>>

function createDefineVueFireLoaderEntry<
  isLazy extends boolean = boolean,
  Data = unknown,
>(
  loader: (to: RouteLocationNormalizedLoaded) => _RefFirestore<Data>,
  options: Required<DefineVueFireDataLoaderOptions<isLazy>>,
  commit: (
    this: DataLoaderEntryBase<isLazy, Data>,
    to: RouteLocationNormalizedLoaded
  ) => void,
  initialData?: Data
): DataLoaderEntryBase<isLazy, Data> {
  return {
    // force the type to match
    data: ref(initialData) as Ref<_DataMaybeLazy<UnwrapRef<Data>, isLazy>>,
    isLoading: ref(false),
    error: shallowRef<any>(),

    children: new Set(),
    pendingLoad: null,
    pendingTo: null,
    staged: STAGED_NO_VALUE,
    commit,
  } satisfies VueFireDataLoaderEntry<isLazy, Data>
}
