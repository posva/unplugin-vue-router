import { TreeLeaf } from '../core/tree'

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
      'Record<never, never>'
}

/**
 * Utility type for raw and non raw params like :id+
 *
 * @internal
 */
export type _ParamValueOneOrMore<isRaw extends boolean> = true extends isRaw
  ? [string | number, ...(string | number)[]]
  : [string, ...string[]]

/**
 * Utility type for raw and non raw params like :id*
 *
 * @internal
 */
export type _ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? (string | number)[] | undefined | null
  : string[] | undefined | null

/**
 * Utility type for raw and non raw params like :id?
 *
 * @internal
 */
export type _ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? string | number | null | undefined
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 * @internal
 */
export type _ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string
