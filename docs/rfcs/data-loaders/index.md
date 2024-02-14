# Data Loaders

- Start Date: 2022-07-14
- Target Major Version: Vue 3, Vue Router 4
- Reference Issues: -
- [Discussion](https://github.com/vuejs/rfcs/discussions/460)
- [Implementation PR](https://github.com/posva/unplugin-vue-router/tree/main/src/data-fetching)

## Todo List

List of things that haven't been added to the document yet:

- [x] ~~Show how to use the data loader without `vue-router/auto`~~
- [x] ~~Explain what `vue-router/auto` brings~~
- [ ] Extendable API for data fetching libraries like vue-apollo, vuefire, vue-query, etc

## Summary

There is no silver bullet to data fetching because of the different data fetching strategies and how they can define the architecture of the application and its UX. However, I think it's possible to find a solution that is flexible enough to **promote good practices** and **reduce the complexity** of data fetching in applications.
That is the goal of this RFC, to standardize and improve data fetching with vue-router:

- Integrate data fetching to the navigation cycle
  - Blocks navigation while fetching or _defer_ less important data (known as _lazy_ in Nuxt)
- Deduplicate Requests
- Delay data updates until all data loaders are resolved
  - Avoids displaying partially up-to-data data and inconsistent state
  - Configurable through a `commit` option
- Optimal Data fetching
  - Defaults to parallel fetching
  - Semantic sequential fetching if needed
- Avoid `<Suspense>`
  - No cascading loading states
  - No double mounting
- Provide atomic and global access to loading/error states
- Establish a set of Interfaces that enable other libraries like [VueFire](https://vuefire.vuejs.org), [@pinia/colada][pinia-colada], [vue-apollo](https://apollo.vuejs.org/), [@tanstack/vue-query][vue-query], etc to implement their own data loaders

<!-- Extra Goals:

- Automatically rerun when used params/query params/hash changes (avoid unnecessary fetches)
- Basic client-side caching with time-based expiration to only fetch once per navigation while using it anywhere -->

This proposal concerns Vue Router 4 and is implemented under [unplugin-vue-router][uvr]. This enables types in data loaders but is not necessary. This feature is independent of the rest of the plugin and can be used without it, namely **without file-based routing**.

::: info
In this RFC, data loaders are often referred as _loaders_ for short. API names also use the word _loader_ instead of _data loader_ for brevity.
:::

## Basic example

We define data loaders anywhere and _attach them_ to **page components** (components associated to a route). They return a **composable that can be used in any component** (not only pages).

**A loader can be attached to a page in two ways**:

- Export the loader from the page component it is attached to
- Manually add the loader to the route definition

Exported from a non-setup `<script>` in a page component:

```vue
<script lang="ts">
import { getUserById } from '../api'
import { defineLoader } from 'vue-router'

// name the loader however you want **and export it**
export const useUserData = defineLoader(async (route) => {
  const user = await getUserById(route.params.id)
  // ...
  // return anything you want to expose
  return user
})

// Optional: define other component options
export default defineComponent({
  name: 'custom-name',
  inheritAttrs: false,
})
</script>

<script lang="ts" setup>
// find the user as `data` and some other properties
const { data: user, isLoading, error, reload } = useUserData()
// data is always present, isLoading changes when going from '/users/2' to '/users/3'
</script>
```

When a loader is exported by the page component, it is **automatically** picked up as long as the route is **lazy loaded** (which is a best practice). If the route isn't lazy loaded, the loader can be directly defined in an array of data loaders on `meta.loaders`:

```ts
import { createRouter } from 'vue-router'
import UserList from '~/pages/UserList.vue'
// could be anywhere
import { useUserList } from '~/loaders/users'

export const router = createRouter({
  // ...
  routes: [
    {
      path: '/users',
      component: UserList,
      meta: {
        // Required when the component is not lazy loaded
        loaders: [useUserList],
      },
    },
    {
      path: '/users/:id',
      // automatically picks up all exported loaders
      component: () => import('~/pages/UserDetails.vue'),
    },
  ],
})
```

Regarding the returned values from `useUserData()`:

- `data` (aliased to `user`), `isLoading`, and `error` are refs and therefore reactive.
- `reload` is a function that can be called to force a reload of the data without a new navigation.

Note `useUserData()` can be used in **any component**, not only in the page component. We import the function and call it within `<script setup>` like other composables

<!-- Advanced use case (cached):

- Loaders smartly know which params/query params/hash they depend on to force a reload when navigating:
  - Going from `/users/2` to `/users/3` will reload the data no matter how recent the other fetch was because `useUserData` depends on `route.params.id`
  - Going from `/users/2?name=fab` to `/users/2?name=fab#filters` will try to avoid fetching again as the `route.params.id` didn't change: it will check if the current client side cache expired and if it did, it will fetch again -->

By default, **data loaders block the navigation**, meaning they _just work_ with SSR and errors are propagated to the router level (`router.onError()`). On top of that, data loads are deduplicated, which means that no mather how many times you use the same data loader in different routes or components, **it will still load the data just once per navigation**.

The simplest of data loaders can be defined in just one line and types will be automatically inferred:

```ts twoslash
import { _defineBasicLoader as defineLoader } from 'unplugin-vue-router/runtime'
interface Book {
  title: string
  isbn: string
  description: string
}
function fetchBookCollection(): Promise<Book[]> {
  return {} as any
}
// ---cut---
export const useBookCollection = defineLoader(fetchBookCollection)
const { data } = useBookCollection()
```

Note that this syntax will intentionally be avoided in the RFC. Instead, we will often use slightly longer examples to make things easier to follow.

## Motivation

There are currently too many ways of handling data fetching with vue-router and all of them have problems:

- With navigation guards:
  - using `onBeforeRouteUpdate()`: missing data when entering tha page
  - using `beforeRouteEnter()`: non typed and non-ergonomic API with `next()`, requires a data store (pinia, vuex, apollo, etc), does not exist in script setup
  - using `meta`: complex to setup even for simple cases, too low level for such a common case
- using a watcher on `route.params...`: component renders without the data (doesn't work with SSR)
- [Using Suspense](#suspense) and _awaiting_ data within page components
  - Cascading (slow) async states
  - Only loads once
  - Double mounting
  - Does not wait for navigation
  - Requires handling UI loading state
  - [And more](#suspense)

People are left with a low level API (navigation guards) to handle data fetching themselves. This is often a difficult problem to solve because it requires an extensive knowledge of the Router concepts and in reality, very few people know them.

Thus, the goal of this proposal is to provide a simple yet extendable way of defining data loading in your application that is easy to understand and use. It should also be compatible with SSR and not limited to simple _fetch calls_, but rather any async state. It should be adoptable by frameworks like Nuxt.js to provide an augmented data fetching layer that integrates well with Vue.js Concepts and the future of Web APIs like the [Navigation API](https://github.com/WICG/navigation-api/).

<!-- TODO: remove this section

There are features that are out of scope for this proposal but should be implementable in user-land thanks to an _extendable API_:

- Implement a full-fledged cached API like vue-query
- Implement pagination
- Automatically refetch data when **outside of navigations** (e.g. there is no intention to implement advanced APIs such as `refetchInterval`, refetch on focus, etc) -->

TODO: this explains why blocking is good, move to the detailed design

This RFC also aims to integrate data fetching within navigations while still not forcing you to block navigation with data fetching. This pattern is useful for multiple reasons:

- Ensure data is present before mounting the component (blocks navigation)
- Flexibility to not wait for non critical data with lazy data loaders
- Enables the UX pattern of letting the browser handle loading state (aligns better with [future Navigation API](https://github.com/WICG/navigation-api))
- Makes scrolling work out of the box when navigating between pages (when data loaders are blocking)
- Ensure one single request per loader and navigation
- Extremely lightweight compared to more complex fetching solutions like @tastack/vue-query, apollo/graphql, etc

## Detailed design

The design of Data Loaders is split into two parts

- The set of [Interfaces (types)](#interfaces) that define a Data Loader
- [Implementation of two Data Loaders](#implementations)
  - A bare bones data loaders
  - A more advanced data loader with client side caching using [@pinia/colada][pinia-colada]

::: tip
You might only be interested in the actual final implementation of the Data Loaders. In that case, you can skip to the interfaces section and jump right into the [implementations](#implemenations).
:::

### Interfaces

Defining a minimal set of information and options for Data Loaders is what enables external libraries to implement their own data loaders. They are meant to extend these interfaces to add more features that are specific to them. You can see a practical example with the [Pinia Colada](#pinia-colada) implementation.

::: info
This section is still a work in progress, see the [implementations](#implementations) instead.
:::

### Implementations

::: tip
Throughout this section, we will import from `vue-router/auto`. This is added by [unplugin-vue-router][uvr] but you can also import from `unplugin-vue-router/runtime` if you don't want to use file-based routing.
:::

### Data Loader Setup

All data loaders are handled in a navigation guard that must be setup in the application:

```ts{1,8}
import { DataLoaderPlugin, createRouter } from 'vue-router/auto'

const router = createRouter({
  // ...
})

const app = createApp(App)
app.use(DataLoaderPlugin, { router })
```

### `setupLoaderGuard()`

`setupLoaderGuard()` setups a navigation guard that handles all the loaders. It has a few options

#### `app`

The Vue app instance created with `createApp()`

#### `router`

The Vue Router instance.

#### `selectNavigationResult`

Called wih an array of `NavigationResult` returned by loaders. It allows to decide the _fate_ of the navigation.

// TODO:

See [NavigationResult](#navigation-result)
Note this isn't called if no data loaders return a `NavigationResult` or if an error or `NavigationResult` is thrown. In that case, the first throw will take precedence.

By default, `selectNavigation` returns the first value of the array.

TODO: move this lower

This navigation guard picks up the loaders attached to page components that are lazy loaded:

```ts
// lazy loaded route
const routes = [
  {
    path: '/users/:id',
    // automatically picks up any loader exported
    component: () => import('~/pages/UserDetails.vue'),
  },
]
```

If the route isn't lazy loaded, the loader can be directly defined in an array of loaders on `meta.loaders`:

```ts
import { useUserDetails } from '~/loaders/users'
import UserDetails from '~/pages/UserDetails.vue'

const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    meta: {
      loaders: [useUserDetails],
    },
  },
]
```

When using vue router named views, each named view can have their own loaders but note any navigation to the route will trigger **all loaders from all page components**. This is because the router doesn't know which named views wil be used.

::: tip
Note: with [unplugin-vue-router][uvr], a named view can be declared by appending `@name` at the end of the file name:

```text
src/pages/
└── users/
    ├── index.vue
    └── index@aux.vue
```

This creates a `components: { default: ..., aux: ... }` entry in the route config.
:::

### Basic Data Loader

In its simplest form, the basic implementation for `defineLoader()` in [unplugin-vue-router][uvr] takes a function that returns a promise (of data) and returns a composable that **can be used in any component**, not only in the one that defines it. We call these _loaders_. They receive the target `route` from the current navigation and some other properties as function parameters and they must return a Promise. The resolved value will then be directly accessible as a `ref` when calling the composable.

TODO: move to the interface section when talking about the parameters of the loader function

Limiting the loader access to only the target route, ensures that the data can be fetched **when the user refreshes the page**. In enforces a good practice of correctly storing the necessary information in the route as params or query params to create sharable URLs.

Within loaders there is no access to the current component or page instance, but it's possible to access global injections created with `app.provide()`. This includes stores created with [Pinia](https://pinia.vuejs.org).

// TODO: remove or reduce. Duplication regarding the deduping

Loaders also have the advantage of behaving as singleton requests. This means that they are only fetched once per navigation no matter how many times the loader is attached or how many regular components use it. It also means that all the refs (`data`, `isLoading`, etc) are created only once and shared by all components, reducing memory usage.

In the rest of the code samples here, `defineLoader()` refers to the minimal implementation of `defineBasicLoader()`. It returns a composable with the following properties:

```ts
const useLoader = defineLoader(...)
const {
  data, // Ref<T> T being the awaited return type of the function passed to `defineLoader()`
  isLoading, // Ref<boolean>
  error, // Ref<any>
  reload, // () => Promise<void>
} = useLoader()
```

- `data` contains the resolved value returned by the loader
- `isLoading` is `true` while a request is isLoading and becomes `false` once the request is settled
- `error` becomes `null` each time a request starts and contains any error thrown by the loader
- `reload()` invokes the loader (an internal version that sets the `isLoading` and other flags)

In practice, rename `data` (or others) to something more meaningful:

```ts
import { getUserById } from '~/api/users'

const useUserData = defineLoader(async ({ params }) => {
  const user = await getUserById(params.id)
  return user // can be anything
})

const {
  // ... same as above
  data: user, // Ref<UserData>
} = useUserData()
```

`defineLoader()` can be passed some options to customize its behavior

#### `lazy`

#### `commit`

### Implementing a custom `defineLoader()`

The goal if this API is to also expose an implementable interface for external libraries to create more advanced _defineLoaders()_. For example, vue-query could be directly used to create a custom define loader that handles caching and other advanced features.

### Loaders

- Discard pending loaders with new navigations even within nested loaders and when discarded loaders resolve later

### Parallel Fetching

By default, loaders are executed as soon as possible, in parallel. This scenario works well for most use cases where data fetching only requires route params/query params or nothing at all.

### Sequential fetching

Sometimes, requests depend on other fetched data (e.g. fetching additional user information). For these scenarios, we can simply import the other loaders and use them **within a different loader**:

Call **and `await`** the loader inside the one that needs it, it will only be fetched once no matter how many times it is called:

```ts
// import the loader for user information
import { useUserData } from '~/loaders/users'

export const useUserCommonFriends = defineLoader(async (route) => {
  // loaders must be awaited inside other loaders
  // .        ⤵
  const user = await useUserData() // magically works

  // fetch other data
  const commonFriends = await getCommonFriends(user.value.id)
  return { ...user, commonFriends }
})
```

You will notice here that we have two different usages for `useUserData()`:

- One that returns all the necessary information we need _synchronously_ (not used here). This is the composable that we use in components
- A second version that **only returns a promise of the data**. This is the version used within data loaders

// TODO: only applicable to specific loaders and must be implemented
// this means there needs to be a way to refer to parent loaders

#### Nested invalidation

Since `useUserCommonFriends()` loader calls `useUserData()`, if `useUserData()`'s cache expires or gets manually invalidated, it will also automatically invalidate `useUserCommonFriends()`.

> ![]
> Two loaders cannot use each other as that would create a _dead lock_.

This can get complex with multiple pages exposing the same loader and other pages using some of their _already exported_ loaders within other loaders. But it's not an issue, **the user shouldn't need to handle anything differently**, loaders are still only called once:

```ts
import { getFriends, getUserById } from '~/api/users'

export const useUserData = defineLoader(async (route) => {
  const user = await getUserById(route.params.id)
  return user
})

export const useCurrentUserData(async route => {
  const me = await getCurrentUser()
  // imagine legacy APIs that cannot be grouped into one single fetch
  const friends = await getFriends(user.value.id)

  return { ...me, friends }
})

export const useUserCommonFriends = defineLoader(async (route) => {
  const user = await useUserData()
  const me = await useCurrentUserData()

  const friends = await getCommonFriends(user.id, me.id)
  return { ...me, commonFriends: { with: user, friends } }
})
```

In the example above we are exporting multiple loaders but we don't need to care about the order in which they are called nor try optimizing them because **they are only called once and share the data**.

::: danger
**Caveat**: must call **and await** all nested loaders at the top of the parent loader (see `useUserData()` and `useCurrentUserData()`). You cannot put a different regular `await` in between. If you really need to await **anything that isn't a loader** in between, wrap the promise with `withDataContext()` to ensure the loader context is properly restored:

```ts
export const useUserCommonFriends = defineLoader(async (route) => {
  const user = await useUserData()
  await withContext(functionThatReturnsAPromise())
  const me = await useCurrentUserData()

  // ...
})
```

This allows nested loaders to be aware of their _parent loader_. This could probably be linted with an eslint plugin. It is similar to the problem `<script setup>` had before introducing the automatic `withAsyncContext()`. The same feature could be introduced but will also have a performance cost. In the future, this _might_ be solved with the [async-context](https://github.com/tc39/proposal-async-context) proposal (stage 2).
:::

### Cache and loader reuse

Each loader has its own cache and it's **not shared** across multiple application instances **as long as they use a different `router` instance** (the `router` is internally used as the key of a `WeakMap()`). This aligns with the recommendation of using one router instance per request in the ecosystem and usually one won't even need to know about this.

The cache is a very simple time based expiration cache that defaults to 5 seconds. When a loader is called, it will wait 5s before calling the loader function again. This can be changed with the `cacheTime` option:

```ts
defineLoader(..., { cacheTime: 1000 * 60 * 5 }) // 5 minutes
defineLoader(..., { cacheTime: 0 }) // No cache (still avoids calling the loader twice in parallel)
defineLoader(..., { cacheTime: Infinity }) // Cache forever
```

### Refreshing the data

TODO: give the loaders the ability to know what was the last location? Maybe only internally but not expose it to the user. Although custom loaders could if they wanted to.

When navigating, the data is refreshed **automatically based on what params, query params, and hash** are used within the loader.

Given this loader in page `/users/:id`:

```ts
export const useUserData = defineLoader(async (route) => {
  const user = await getUserById(route.params.id)
  return user
})
```

Going from `/users/1` to `/users/2` will reload the data but going from `/users/2` to `/users/2#projects` will not unless the cache expires or is manually invalidated.

<!-- ### With navigation

TODO: maybe an option `reload`:

```ts
export const useUserData = defineLoader(
  async (route) => {
    const friends = await getFriends(user.value.id)
    return { user, friends }
  },
  {
    // force reload the data on navigation if /users/24?force=true
    reload: (route) => !!route.query.force
  }
)
```

This kind of option should be added by custom loaders because some loaders like vue-query or pinia colada can automatically handle this.

-->

#### Manually refreshing the data

Manually call the `reload()` function to execute the loader again. Depending on the implementation this will end up in a new request or not. For example, a basic loader could _always_ refetch, while a more advanced one, like [Pinia Colada][pinia-colada] will only refetch if the cached value is _stale_ or if any of the parameters change.

```vue
<script setup>
import { useInterval } from '@vueuse/core'
import { useUserData } from '~/pages/users/[id].vue'

const { data: user, reload } = useUserData()

// reload the data every 10s
useInterval(reload, 10000)
</script>

<template>
  <div>
    <h1>User: {{ user.name }}</h1>
  </div>
</template>
```

<!--

 ## Combining loaders

TBD: is this necessary? At the end, this is achievable with similar composables like [logicAnd](https://vueuse.org/math/logicAnd/).

It's possible to combine multiple loaders into one loader with `combineLoaders()` to not combine the results of multiple loaders into a single object but also merge `isLoading`, `error`, etc

```vue
<script>
import { useUserData } from '~/pages/users/[id].vue'
import { usePostData } from '~/pages/posts/[id].vue'

export const useCombinedLoader = combineLoaders(useUserData, usePostData)
</script>

<script setup>
const {
  data,
  // both are loading
  isLoading,
  // any error that happens
  error,
  // reload both
  reload
} = useCombinedLoader()
const { user, post } = toRefs(data.value)
</script>
```
 -->

### Usage outside of page components

Loaders can be attached to a page even if the page component doesn't use it (invoke the composable returned by `defineLoader()`). It can be used in any component by importing the _returned composable_, even outside of the scope of the page components, even by a parent.

On top of that, loaders can be **defined anywhere** and imported where using the data makes sense. This allows to define loaders in a separate `src/loaders` folder and reuse them across pages:

```ts
// src/loaders/user.ts
export const useUserData = defineLoader(...)
// ...
```

Then, in a page component, export it:

```vue
<!-- src/pages/users/[id].vue -->
<script>
export { useUserData } from '~/loaders/user.ts'
</script>
<script setup>
// ...
</script>
```

The page component might not even use `useUserData()` but we can still use it anywhere else:

```vue
<!-- src/components/NavBar.vue -->
<script setup>
import { useUserData } from '~/loaders/user.ts'

const { data: user } = useUserData()
</script>
```

::: tip
In such scenarios, moving the data loader to a separate file allows to better control code splitting.
:::

### TypeScript

Types are automatically generated for the routes by [unplugin-vue-router][uvr] and can be referenced with the name of each route to hint `defineLoader()` the possible values of the current types:

```vue
<script lang="ts">
import { getUserById } from '../api'
import { defineLoader } from 'vue-router'

export const useUserData = defineLoader('/users/[id]', async (route) => {
  //                                     ^ autocompleted by unplugin-vue-router ✨
  const user = await getUserById(route.params.id)
  //                                          ^ typed!
  // ...
  return user
})
</script>

<script lang="ts" setup>
const { data: user, isLoading, error } = useUserData()
</script>
```

The arguments can be removed during the compilation step in production mode since they are only used for types and are ignored at runtime.

// TODO: move to the inerface section when talking about lazy

### Non blocking data fetching (Lazy Loaders)

Also known as [lazy async data in Nuxt](https://v3.nuxtjs.org/api/composables/use-async-data), loaders can be marked as lazy to **not block the navigation**.

```vue
<script lang="ts">
import { getUserById } from '../api'

export const useUserData = defineLoader(
  async (route) => {
    const user = await getUserById(route.params.id)
    return user
  },
  { lazy: true } // 👈  marked as lazy
)
</script>

<script setup>
// Differently from the example above, `user.value` can and will be initially `undefined`
const { data: user, isLoading, error } = useUserData()
//      ^ Ref<User | undefined>
</script>
```

This patterns is useful to avoid blocking the navigation while _less important data_ is being fetched. It will display the page earlier while some of the parts of it are still loading and you are able to display loader indicators thanks to the `isLoading` property.

Note this still allows for having different behavior during SSR and client side navigation, e.g.: if we want to wait for the loader during SSR but not during client side navigation:

```ts
export const useUserData = defineLoader(
  async (route) => {
    // ...
  },
  {
    lazy: !import.env.SSR, // Vite
    lazy: process.client, // NuxtJS
  }
)
```

Existing questions:

- [~~Should it be possible to await all pending loaders with `await allPendingLoaders()`? Is it useful for SSR? Otherwise we could always ignore lazy loaders in SSR. Do we need both? Do we need to selectively await some of them?~~](https://github.com/vuejs/rfcs/discussions/460#discussioncomment-3532011)
- Should we be able to transform a loader into a lazy version of it: `const useUserDataLazy = asLazyLoader(useUserData)`

// TODO: move up to `selectNavigationResult()`
// note down that custom implementations might not take a function and therefore not expose a way to the user to control the navigation

### Controlling the navigation

Since the data fetching happens within a navigation guard, it's possible to control the navigation like in regular navigation guards:

- Thrown errors (or rejected Promises) cancel the navigation (same behavior as in a regular navigation guard) and are intercepted by [Vue Router's error handling](https://router.vuejs.org/api/interfaces/router.html#onerror)
- Redirection: `return new NavigationResult(targetLocation)` -> like `return targetLocation` in a regular navigation guard
- Cancelling the navigation: `return new NavigationResult(false)` like `return false` in a regular navigation guard

```ts
import { NavigationResult } from 'vue-router'

export const useUserData = defineLoader(
  async ({ params, path ,query, hash }) => {
    try {
      const user = await getUserById(params.id)

      return user
    } catch (error) {
      if (error.status === 404) {
        return new NavigationResult({ name: 'not-found', params: { pathMatch:  } }
        )
      } else {
        throw error // aborts the vue router navigation
      }
    }
  }
)
```

`new NavigationResult()` accepts as its only argument anything that [can be returned in a navigation guard](https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards).

Some alternatives:

- `createNavigationResult()`: too verbose
- `NavigationResult()` (no `new`): `NavigationResult` is not a primitive so it should use `new`
- Accept a second argument for extra custom context

The only difference between throwing an error and returning a `NavigationResult` of an error is that the latter will still trigger the [`selectNavigationResult()` mentioned right below](#handling-multiple-navigation-results) while a thrown error will always take the priority.

#### Handling multiple navigation results

Since navigation loaders can run in parallel, they can return different navigation results as well. In this case, you can decide which result should be used by providing a `selectNavigationResult()` method to `setupLoaderGuard()`:

```ts
setupLoaderGuard(router, {
  selectNavigationResult(results) {
    // results is an array of the unwrapped results passed to `new NavigationResult(result)`
    return results.find((result) => result.name === 'not-found')
  },
})
```

`selectNavigationResult()` will be called with an array of the values passed to `new NavigationResult(value)` **after all data loaders** have been resolved. **If any of them throws an error** or if none of them return a `NavigationResult`, `selectNavigationResult()` won't be called.

#### Eagerly changing the navigation

If a loader wants to eagerly change the navigation, it can `throw` the `NavigationResult` instead of returning it. This will skip the `selectNavigationResult()` and take precedence.

// TODO: use a different example

```ts
import { NavigationResult } from 'vue-router'

export const useUserData = defineLoader(
  async ({ params, path, query, hash }) => {
    try {
      const user = await getUserById(params.id)

      return user
    } catch (error) {
      throw new NavigationResult({
        name: 'not-found',
        params: { pathMatch: path.split('/') },
        query,
        hash,
      })
    }
  }
)
```

### AbortSignal

The loader receives in a second argument access to an [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that can be passed on to `fetch` and other Web APIs. If the navigation is cancelled because of errors or a new navigation, the signal aborts, causing any request using it to abort as well.

```ts
export const useBookCatalog = defineLoader(async (_route, { signal }) => {
  // assuming getBookCatalog() passes the `signal` to `fetch()`
  const books = markRaw(await getBookCatalog({ signal }))
  return books
})
```

This aligns with the future [Navigation API](https://github.com/WICG/navigation-api#navigation-monitoring-and-interception) and other web APIs that use the `AbortSignal` to cancel an ongoing invocation.

### SSR

Data Loaders are responsible for handling SSR.

// TODO: example using the basic loader and @pinia/colada

To support SSR we need to do two things:

- A way to serialize each data loaded on the server with a unique _key_. Note: Would an array work? I don't think the order of execution is guaranteed.
- On the client side, pass the initial state to `setupLoaderGuard()`. The initial state is used once and discarded afterwards.

Different implementations could have different kind of keys. The simplest form is a string:

```ts
export const useBookCollection = defineLoader(
  async () => {
    const books = await fetchBookCollection()
    return books
  },
  { key: 'bookCollection' }
)
```

The configuration of `setupLoaderGuard()` depends on the SSR configuration, here is an example with vite-ssg:

```ts
import { ViteSSG } from 'vite-ssg'
import { setupLoaderGuard } from 'vue-router'
import App from './App.vue'
import { routes } from './routes'

export const createApp = ViteSSG(
  App,
  { routes },
  async ({ router, isClient, initialState }) => {
    // fetchedData will be populated during navigation
    const fetchedData = setupLoaderGuard(router, {
      // FIXME: no longer like this
      initialData: isClient
        ? // on the client we pass the initial state
          initialState.vueRouter
        : // on server we want to generate the initial state
          undefined,
    })

    // on the server, we serialize the fetchedData
    if (!isClient) {
      initialState.vueRouter = fetchedData
    }
  }
)
```

Note that `setupLoaderGuard()` **should be called before `app.use(router)`** so it takes effect on the initial navigation. Otherwise a new navigation must be triggered after the navigation guard is added.

#### Avoiding double fetch on the client

One of the advantages of having an initial state is that we can avoid fetching on the client, in fact, loaders are **completely skipped** on the client if the initial state is provided. This means nested loaders **aren't executed either**. Since data loaders shouldn't contain side effects besides data fetching, this shouldn't be a problem. Note that any loader **without a key** won't be serialized and will always be executed on both client and server.

<!-- TBD: do we need to support this use case? We could allow it by having a `force` option on the loader and passing the initial state in the second argument of the loader. -->

// TODO: Move to additional notes

### Performance Tip

**When fetching large data sets** that is never modified, it's convenient to mark the fetched data as _raw_ before returning it:

```ts
export const useBookCatalog = defineLoader(async () => {
  const books = markRaw(await getBookCatalog())
  return books
})
```

[More in Vue docs](https://vuejs.org/api/reactivity-advanced.html#markraw)

An alternative would be to internally use `shallowRef()` instead of `ref()` inside `defineLoader()` but that would prevent users from modifying the returned value and overall less convenient. Having to use `markRaw()` seems like a good trade off in terms of API and performance.

<!-- ## Custom `defineLoader()` for libraries

It's possible to extend the `defineLoader()` function to add new features such as a more complex cache system. TODO:

ideas:

- Export an interface that must be implemented by a composable so external libraries can implement custom strategies (e.g. vue-query)
- allow global and local config (+ types)

TODO: investigate how integrating with vue-apollo would look like -->

### Global API

It's possible to access a global state of when data loaders are fetching (during navigation or when `reload()` is called) as well as when the data fetching navigation guard is running (only when navigating).

- `isFetchingData: Ref<boolean>`: is any loader currently fetching data? e.g. calling the `reload()` method of a loader
- `isNavigationFetching: Ref<boolean>`: is navigation being hold by a loader? (implies `isFetchingData.value === true`). Calling the `reload()` method of a loader doesn't change this state unless it happens in the context of navigation.

TBD: is this worth it? Are any other functions needed?

### Limitations

- ~~Injections (`inject`/`provide`) cannot be used within a loader~~ They can now
- Watchers and other composables shouldn't be used within data loaders:
  - if `await` is used before calling a composable e.g. `watch()`, the scope **is not guaranteed**
  - In practice, **this shouldn't be a problem** because there is **no need** to create composables within a loader

## Drawbacks

- At first, it looks less intuitive than just awaiting something inside `setup()` with `<Suspense>` [but it doesn't have its limitations](#suspense)
- Requires an extra `<script>` tag but only for page components. A macro `definePageLoader()`/`defineLoader()` could be error-prone as it's very tempting to use reactive state declared within the component's `<script setup>` but that's not possible as the loader must be created outside of its `setup()` function

## Alternatives

### Suspense

Using Suspense is probably the first alternative that comes to mind and it has been considered as a solution for data fetching by implementing proofs of concepts. It however suffer from major drawbacks that are tied to its current design and is not a viable solution for data fetching.

One could imagine being able to write something like:

```vue
<!-- src/pages/users.vue = /users -->
<!-- Displays a list of all users -->
<script setup>
const userList = shallowRef(await fetchUserList())

// manually expose a reload function to be called whenever needed
function reload() {
  userList.value = await fetchUserList()
}
</script>
```

Or when params are involved in the data fetching:

```vue
<!-- src/pages/users.[id].vue = /users/:id -->
<!-- Displays a list of all users -->
<script setup>
const route = useRoute()
const user = shallowRef(await fetchUserData(route.params.id))

// manually expose a reload function to be called whenever needed
function reload() {
  user.value = await fetchUserData(route.params.id)
}

// hook into navigation instead of a watcher because we want to block the navigation
onBeforeRouteUpdate(async (to) => {
  // note how we need to use `to` and not `route` here
  user.value = await fetchUserData(to.params.id)
})
</script>
```

// TODO: move when we talk about the blocking mechanism, remove the NOTE

::: info
One of the reasons to block the navigation while fetching is to align with the upcoming [Navigation API](https://github.com/WICG/navigation-api) which will show a spinning indicator (same as when entering a URL) on the browser UI while the navigation is blocked.
:::

This setup has many limitations:

- Nested routes will force **sequential data fetching**: it's not possible to ensure an **optimal parallel fetching**
- Manual data refreshing is necessary **unless you add a `key` attribute** to the `<RouterView>` which will force a remount of the component on navigation. This is not ideal because it will remount the component on every navigation, even when the data is the same. It's necessary if you want to do a `<transition>` but less flexible than the proposed solution which also works with a `key` if needed.
- By putting the fetching logic within the `setup()` of the component we face other issues:

  - No abstraction of the fetching logic => **code duplication** when fetching the same data in multiple components
  - No native way to deduplicate requests among multiple components using them: it requires using a store and extra logic to skip redundant fetches when multiple components are using the same data
  - Does not block the navigation
    - We can block it by mounting the upcoming page component (while the navigation is still blocked by the data loader navigation guard) which can be **expensive in terms of rendering and memory** as we still need to render the old page while we _**try** to mount the new page_.

- No native way of caching data, even for very simple cases (e.g. no refetching when fast traveling back and forward through browser UI)
- Not possible to precisely read (or write) the loading state (see [vuejs/core#1347](https://github.com/vuejs/core/issues/1347)])

On top of this it's important to note that this RFC doesn't limit you: you can still use Suspense for data fetching or even use both, **this API is completely tree shakable** and doesn't add any runtime overhead if you don't use it. Aligning with the progressive enhancement nature of Vue.js.

### Other alternatives

- Allowing blocking data loaders to return objects of properties:

  ```ts
  export const useUserData = defineLoader(async (route) => {
    const user = await getUserById(route.params.id)
    // instead of return user
    return { user }
  })
  // instead of const { data: user } = useUserData()
  const { user } = useUserData()
  ```

  This was the initial proposal but since this is not possible with lazy loaders it was more complex and less intuitive. Having one single version is overall easier to handle.

- Adding a new `<script loader>` similar to `<script setup>`:

  ```vue
  <script lang="ts" loader="useUserData">
  import { getUserById } from '~/api/users'
  import { useRoute } from 'vue-router' // could be automatically imported

  const route = useRoute()
  // any variable created here is available in useLoader()
  const user = await getUserById(route.params.id)
  </script>

  <script lang="ts" setup>
  const { user, isLoading, error } = useUserData()
  </script>
  ```

  Too magical without clear benefit.

- Pass route properties instead of the whole `route` object:

  ```ts
  import { getUserById } from '../api'

  export const useUserData = defineLoader(async ({ params, query, hash }) => {
    const user = await getUserById(params.id)
    return { user }
  })
  ```

  This has the problem of not being able to use the `route.name` to determine the correct typed params (with [unplugin-vue-router][uvr]):

  ```ts
  import { getUserById } from '../api'

  export const useUserData = defineLoader(async (route) => {
    if (route.name === 'user-details') {
      const user = await getUserById(params.id)
      //                                    ^ typed!
      return { user }
    }
  })
  ```

- Naming

  Variables could be named differently and proposals are welcome:

  - `isLoading` -> `isPending`, `pending` (same as Nuxt)
  - Rename `defineLoader()` to `defineDataFetching()` (or others)

- Nested/Sequential Loaders drawbacks

  - Allowing `await getUserById()` could make people think they should also await inside `<script setup>` and that would be a problem because it would force them to use `<Suspense>` when they don't need to.

  - Another alternative is to pass an array of loaders to the loader that needs them and let it retrieve them through an argument, but it feels _considerably_ less ergonomic:

    ```ts
    import { useUserData } from '~/pages/users/[id].vue'

    export const useUserFriends = defineLoader(
      async (route, { loaders: [userData] }) => {
        const friends = await getFriends(user.value.id)
        return { ...userData.value, friends }
      },
      {
        // explicit dependencies
        waitFor: [useUserData],
      }
    )
    ```

- Advanced `lazy`

  The `lazy` flag could be extended to also accept a number (timeout) or a function (dynamic value). I think this is too much and should therefore not be included.

  Passing a _number_ to `lazy` could block the navigation for that number of milliseconds, then let it be:

  ```vue
  <script lang="ts">
  import { getUserById } from '../api'

  export const useUserData = defineLoader(
    async (route) => {
      const user = await getUserById(route.params.id)
      return user
    },
    // block the navigation for 1 second and then let the navigation go through
    { lazy: 1000 }
  )
  </script>

  <script setup>
  const { data, isLoading, error } = useUserData()
  //      ^ Ref<User | undefined>
  </script>
  ```

  Note that lazy loaders can only control their own blocking mechanism. They can't control the blocking of other loaders. If multiple loaders are being used and one of them is blocking, the navigation will be blocked until all of the blocking loaders are resolved.

  A function could allow to conditionally block upon navigation:

  ```ts
  export const useUserData = defineLoader(
    loader,
    // ...
    {
      lazy: (route) => {
        // ...
        return true // or a number
      },
    }
  )
  ```

- One could argue being able to reuse the result of loaders across any component other than page components is a bad practice. Other frameworks expose a single _load_ function from page components (SvelteKit, Remix)

## Adoption strategy

Introduce this as part of [unplugin-vue-router][uvr] to test it first and make it part of the router later on.

## Unresolved questions

- Integration with Server specifics in Frameworks like Nuxt: cookies, headers, server only loaders (can create redirect codes)
- Should there by a `beforeLoad()` hook that is called and awaited before all data loaders
- Replace `selectNavigation()` by `afterLoad()` that is always called after all data loaders
- What else is needed besides the `route` inside loaders?
- ~~Add option for placeholder data?~~ Data loaders should implement this themselves
- What other operations might be necessary for users?

<!--

TODO: we could attach an effect scope it each loader, allowing creating reactive variables that are automatically cleaned up when the loader is no longer used by collecting whenever the `useLoader()` fn is called and removing them when the component is unmounted, if the loader is not used anymore, remove the effect scope as well. This requires a way to create the variables so the user can pass a custom composable.

 -->

[uvr]: https://github.com/posva/unplugin-vue-router 'unplugin-vue-router'
[pinia-colada]: https://github.com/posva/pinia-colada '@pinia/colada'
[vue-query]: https://tanstack.com/query/latest/docs/framework/vue/overview '@tanstack/vue-query'
