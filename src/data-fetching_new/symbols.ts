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
