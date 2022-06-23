import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteMeta,
  RouteParams,
  RouteParamsRaw,
  RouteParamValueRaw,
} from 'vue-router'
import type { TreeLeaf } from '../core/tree'

export function generateRouteNamedMap(node: TreeLeaf): string {
  // root
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${Array.from(node.children.values()).map(generateRouteNamedMap).join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.filePath
      ? `  '${node.value.routeName}': ${generateRouteRecordInfo(node)},\n`
      : '') +
    (node.children.size > 0
      ? Array.from(node.children.values()).map(generateRouteNamedMap).join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(node: TreeLeaf) {
  return `RouteRecordInfo<'${node.value.routeName}', '${
    node.value.path
  }', ${generateRouteParams(node, true)}, ${generateRouteParams(node, false)}>`
}

export function generateRouteParams(node: TreeLeaf, isRaw: boolean): string {
  return node.value.isParam()
    ? `{ ${node.value.params
        .map(
          (param) =>
            `${param.paramName}${param.optional ? '?' : ''}: ` +
            (param.modifier === '+'
              ? `_ParamValueOneOrMore<${isRaw}>`
              : param.modifier === '*'
              ? `_ParamValueZeroOrMore<${isRaw}>`
              : param.modifier === '?'
              ? `_ParamValueZeroOrOne<${isRaw}>`
              : `_ParamValue<${isRaw}>`)
        )
        .join(', ')} }`
    : // no params allowed
      'Record<any, never>'
}

export interface RouteRecordInfo<
  Name extends string = string,
  Path extends string = string,
  ParamsRaw extends RouteParamsRaw = RouteParamsRaw,
  Params extends RouteParams = RouteParams,
  Meta extends RouteMeta = RouteMeta
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  params: Params
  // TODO: implement meta with a defineRoute macro
  meta: Meta
}

export interface RouteLocationNormalizedTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = string
> extends RouteLocationNormalized {
  name: RouteMap[Name]['name']
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export interface RouteLocationNormalizedLoadedTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = string
> extends RouteLocationNormalizedLoaded {
  name: RouteMap[Name]['name']
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

/**
 * Utility type for raw and non raw params like :id+
 *
 * @internal
 */
export type _ParamValueOneOrMore<isRaw extends boolean> = true extends isRaw
  ? readonly [string | number, ...(string | number)[]]
  : readonly [string, ...string[]]

/**
 * Utility type for raw and non raw params like :id*
 *
 * @internal
 */
export type _ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? readonly (string | number)[] | undefined | null
  : readonly string[] | undefined | null

/**
 * Utility type for raw and non raw params like :id?
 *
 * @internal
 */
export type _ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? RouteParamValueRaw
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 * @internal
 */
export type _ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string
