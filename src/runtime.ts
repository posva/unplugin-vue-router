import type { RouteRecordRaw } from 'vue-router'

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
 * Merges route records.
 *
 * @internal
 *
 * @param main - main route record
 * @param routeRecords - route records to merge
 * @returns merged route record
 */
export function _mergeRouteRecord(
  main: RouteRecordRaw,
  ...routeRecords: Partial<RouteRecordRaw>[]
): RouteRecordRaw {
  // @ts-expect-error: complicated types
  return routeRecords.reduce((acc, routeRecord) => {
    const meta = Object.assign({}, acc.meta, routeRecord.meta)
    const alias: string[] = ([] as string[]).concat(
      acc.alias || [],
      routeRecord.alias || []
    )

    // TODO: other nested properties
    // const props = Object.assign({}, acc.props, routeRecord.props)

    Object.assign(acc, routeRecord)
    acc.meta = meta
    acc.alias = alias
    return acc
  }, main)
}

/**
 * Type to define a page. Can be augmented to add custom properties.
 */
export interface DefinePage
  extends Partial<
    Omit<RouteRecordRaw, 'children' | 'components' | 'component' | 'name'>
  > {
  /**
   * A route name. If not provided, the name will be generated based on the file path.
   * Can be set to `false` to remove the name from types.
   */
  name?: string | false

  // TODO: add a custom serialization based on the query object completely that
  // allows and extracts a function
  query?: Record<string, QueryParamType | DefinePageQueryParamOptions>
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
