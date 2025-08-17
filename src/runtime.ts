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
}

// TODO: remove as it's in runtime-experimental
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
export function _mergeRouteRecordExperimental(
  // NOTE: we can't import from experimental because it changes the types of `children`
  // import type { EXPERIMENTAL_RouteRecordRaw } from 'vue-router/experimental'
  main: {
    [x: string]: unknown
    meta?: Record<string, unknown>
  },
  ...routeRecords: Partial<DefinePage>[]
) {
  for (const record of routeRecords) {
    main.meta = { ...main.meta, ...record.meta }
  }
  return main
}
