# Error Handling

By default, all errors thrown in a loader are considered _unexpected errors_: they will abort the navigation, just like in a navigation guard. Because they abort the navigation, they will not appear in the `error` property of the loader. Instead, they will be intercepted by Vue Router's error handling with `router.onError()`.

However, if the loader is **not navigation-aware**, the error cannot be intercepted by Vue Router and will be kept in the `error` property of the loader. This is the case for _lazy loaders_ and [_reloading data_](./reloading-data.md).

To be able to intercept errors in blocking loaders, we can specify a list of error classes that are considered _expected errors_. This allows blocking loader to **not abort the navigation** and instead keep the error in the `error` property of the loader and let the page locally display the error state.

```ts{3-10,14,18} twoslash
import 'unplugin-vue-router/client'
import './typed-router.d'
// @moduleResolution: bundler
// ---cut---
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'
// custom error class
class MyError extends Error {
  // override is only needed in TS
  override name = 'MyError' // Displays in logs instead of 'Error'
  // defining a constructor is optional
  constructor(message: string) {
    super(message)
  }
}

export const useUserData = defineBasicLoader(
  async (to) => {
    throw new MyError('Something went wrong')
    // ...
  },
  {
    errors: [MyError],
  }
)
```

You can also specify _expected errors_ globally for all loaders by providing the `errors` option to the `DataLoaderPlugin`.

```ts{4} twoslash
import 'unplugin-vue-router/client'
import './typed-router.d'
import { createApp } from 'vue'
import { DataLoaderPlugin } from 'unplugin-vue-router/data-loaders'
const app = createApp({})
const router = {} as any
class MyError extends Error {
  name = 'MyError'
  constructor(message: string) {
    super(message)
  }
}
// @moduleResolution: bundler
// ---cut---
app.use(DataLoaderPlugin, {
  router,
  // checks with `instanceof MyError`
  errors: [MyError],
})
```

It also accepts a function that returns a boolean to determine if the error is expected or not.

```ts{3-9} twoslash
import 'unplugin-vue-router/client'
import './typed-router.d'
import { createApp } from 'vue'
import { DataLoaderPlugin } from 'unplugin-vue-router/data-loaders'
const app = createApp({})
const router = {} as any
// @moduleResolution: bundler
// ---cut---
app.use(DataLoaderPlugin, {
  router,
  errors: (error) => {
    // Convention for custom errors
    if (error instanceof Error && error.name?.startsWith('My')) {
      return true
    }
    return false // unexpected error
  },
})
```
