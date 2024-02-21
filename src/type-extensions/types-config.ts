import { type RouteRecordInfo } from '../types'

/**
 * Allows using types that are generated at build. **ONLY FOR INTERNAL USAGE**.
 *
 * @internal
 */
export interface _TypesConfig {}

/**
 * Convenience type to get the typed RouteMap or a generic one if not provided.
 */
export type RouteNamedMap =
  _TypesConfig extends Record<'RouteNamedMap', infer RouteNamedMap>
    ? RouteNamedMap
    : Record<string, RouteRecordInfo>
