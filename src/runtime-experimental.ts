import { EXPERIMENTAL_RouteRecord_Matchable } from 'vue-router/dist/router-DpX2dUg6.mjs'

/**
 * Defines properties of the route for the current page component.
 *
 * @param route - route information to be added to this page
 * @deprecated - use `definePage` instead
 */
export const _definePage = (route: DefinePage) => route

/**
 * Defines properties of the route for the current page component.
 *
 * @param route - route information to be added to this page
 */
export const definePage = (route: DefinePage) => route

/**
 * Type to define a page. Can be augmented to add custom properties.
 */
export interface DefinePage
  extends Partial<
    Pick<EXPERIMENTAL_RouteRecord_Matchable, 'meta' | 'redirect'>
  > {
  /**
   * A route name. If not provided, the name will be generated based on the file path.
   * Can be set to `false` to remove the name from types.
   */
  name?: string | false

  // TODO: figure out a syntax that makes sense and is type safe:
  // - should allow to change the type of path params either to a src/params file or just write
  // the function inline (which means we need to extract the function type). The issue is that there might be a lot of edge cases about imports and local declarations of variables and types
  params?: {}
  // TODO: add a custom serialization based on the query object completely that
  // allows and extracts a function
  // query?: Record<string, QueryParamType | DefinePageQueryParamOptions>
}

/**
 * TODO:
 * - User should be able to define a lax object matcher with a validation library
 *   - should be easy to use if they throw inside the param
 */

export type QueryParamType = 'int' | 'bool'

/**
 * Configures how to extract a route param from a specific query parameter.
 */
export interface DefinePageQueryParamOptions {
  /**
   * The type of the query parameter. Allowed values are native param parsers
   * and any parser in the {@link https://uvr.esm.is/TODO | params folder }.
   */
  type: QueryParamType

  /**
   * Defines whether the query parameter can be omitted or not. If false, the
   * route won't match if the query parameter is not present.
   *
   * @default false
   */
  optional?: boolean

  /**
   * Can the query parameter be repeated? If true, it will always return an
   * array of values. If false, it will return the first value and ignore the
   * rest.
   *
   * @default false
   */
  repeatable?: boolean
}

/**
 * Merges route record objects for the experimental resolver format.
 * This function is specifically designed to work with objects that will be passed to normalizeRouteRecord().
 *
 * @internal
 *
 * @param main - main route record object
 * @param routeRecords - route records to merge (from definePage imports)
 * @returns merged route record object
 */
export function _mergeRouteRecord(
  // NOTE: we can't import from experimental because it changes the types of `children`
  // import type { EXPERIMENTAL_RouteRecordRaw } from 'vue-router/experimental'
  main: {
    [x: string]: unknown
    meta?: Record<string, unknown>
  },
  ...routeRecords: Partial<DefinePage>[]
) {
  return routeRecords.reduce((acc, routeRecord) => {
    Object.assign(acc, routeRecord)
    acc.meta = { ...acc.meta, ...routeRecord.meta }

    return acc
  }, main)
}

// FIXME: refactor and remove
export const _mergeRouteRecordExperimental = _mergeRouteRecord
