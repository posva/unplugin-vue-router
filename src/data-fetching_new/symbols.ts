/**
 * Retrieves the internal version of loaders.
 * @internal
 */
export const LOADER_SET_KEY = Symbol('loaders')

/**
 * Retrieves the internal version of loader entries.
 * @internal
 */
export const LOADER_ENTRIES_KEY = Symbol('loaderEntries')

/**
 * Allows to extract exported useData() within a component. These are the returned values from the `defineDataLoader`.
 * @internal
 */
export const IS_USE_DATA_LOADER_KEY = Symbol()

/**
 * Symbol used to save the pending location on the router.
 * @internal
 */
export const PENDING_LOCATION_KEY = Symbol()

/**
 * Symbol used to know there is no value staged for the loader and that commit should be skipped.
 * @internal
 */
export const STAGED_NO_VALUE = Symbol()

/**
 * Gives access to the current app and it's `runWithContext` method.
 * @internal
 */
export const APP_KEY = Symbol()
