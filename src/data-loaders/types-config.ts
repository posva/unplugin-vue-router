/**
 * Allows you to extend the default types of the library.
 *
 * @example
 * ```ts
 * // types-extension.d.ts
 * import 'unplugin-vue-router/data-loaders'
 * export {}
 * declare module 'unplugin-vue-router/data-loaders' {
 *   interface TypesConfig {
 *     Error: MyCustomError
 *   }
 * }
 * ```
 */
export interface TypesConfig {
  // Error: Error
}

/**
 * The default error type used.
 * @internal
 */
export type ErrorDefault =
  TypesConfig extends Record<'Error', infer E> ? E : Error
