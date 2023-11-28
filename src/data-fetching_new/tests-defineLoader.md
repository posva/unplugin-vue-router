```ts
/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck

import { DataLoaderEntryBase, createDataLoader } from './createDataLoader'

export const defineVueFireLoader = createDataLoader({
  createEntry: (context) => {
    useCollection(...)
  },
  before: (context) => {
    // is this the first time?
    if (!context.entries.has) {
    }
    // isDirty: our loader depends on other loaders and one of them is dirty so we also are
    if (context.isDirty) {
    }
  },
})

const dl = createDataLoader<ExpectedArgs, Options = Base, ContextType = Base>({
  createEntry: (context, ...ExpectedArgs) => {
  },
  load: async (entry, context, ...ExpectedArgs) => {
    // called during navigation
    // should have access to the data entry created
    // can decide whether to call the loader or not
    if (entry.isDirty) {
      // can call an argument
      await loader({
        ...context,
        // add other stuff to context maybe
      })
    }

    // can collect dependencies by passing a proxy as the context
  )
})

dl(...ExpectedArgs, options)
// this allows to accept different kind of values
// e.g. vuefire wants just the function to generate an object or collection
// appollo wants a gql query and then maybe a function to pass variables, etc
// vue query


// version with a whole collection, no dependency, no need to reexucute useCollection ever
// but the loader could force refresh the data from time to time. Unlikely with Firebase though as they already handle the cache
defineVueFireLoader('/documents', () => useCollection(...))
// needs to be reexecuted when the id changes?
defineVueFireLoader('/documents/[id]', (route) => {
  return useDocument(doc(collections('documents'), route.params.id))
})
// probably better to stick to vuefire api that accepts a computed:
defineVueFireLoader('/documents/[id]', (route) => {
  return useDocument(computed(() => doc(collections('documents'), route.params.id)))
})
// or maybe we could have a way to pass a computed to the loader?
defineVueFireLoader('/documents/[id]', ((route) => doc(collections('documents'), route.params.id)))


// this means createLoader returns a function that:

function _defineVueFireLoader(path: string, docOrCollectionOrQuery: () => unknown, options?: any) {

  // one time
  // 1. create the initial entry
  if (isDocument(docOrCollectionOrQuery)) {
    useDocument(docOrCollectionOrQuery)
  } else if (isCollection(docOrCollectionOrQuery)) {
    // collection
  } else {
    // query
  }

  // -> creates the resulting entry that should be a generic for createDataLoader
  useDocument() // creates data, pending, error, promise

  // then we have the entry
  // each entry will have a way to access the pending location based on the current navigation
  // should that be a weakmap with `to` as the key?
}

export interface VueFireLoaderEntry<isLazy extends boolean, Data> extends DataLoaderEntryBase<isLazy, Data> {


}

// vue query

defineQueryLoader('/documents', () => useQuery(...))
defineQueryLoader('/documents', optionsPassedToUseQuery)
defineQueryLoader('/documents', to => optionsPassedToUseQuery)
```
