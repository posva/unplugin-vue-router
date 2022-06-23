import { joinPath, trimExtension } from './utils'

export const enum TreeLeafType {
  static = 0,
  param = 0b1,
  repeatable = 0b10,
  optional = 0b100,
}

class _TreeLeafValueBase {
  /**
   * flag based on the type of the segment
   */
  _type: TreeLeafType
  /**
   * segment as defined by the file structure
   */
  rawSegment: string
  /**
   * transformed version of the segment into a vue-router path
   */
  pathSegment: string
  /**
   * name of the route
   */
  routeName: string
  /**
   * fullPath of the node based on parent nodes
   */
  path: string

  /**
   * Does the node has a component at the given path. e.g having `routes/users/index.vue` and `routes/users.vue`.
   */
  filePath?: string

  constructor(
    rawSegment: string,
    parent: _TreeLeafValueBase | undefined,
    pathSegment: string = rawSegment
  ) {
    // type should be defined in child
    this._type = 0
    this.rawSegment = rawSegment
    this.pathSegment = pathSegment
    this.path =
      !parent?.path && this.pathSegment === ''
        ? '/'
        : joinPath(parent?.path || '', this.pathSegment)
    // the root has an empty rawSegment and should have an empty name too so children do not start with an extra /
    this.routeName = parent ? parent.routeName + '/' + rawSegment : ''
  }

  toString(): string {
    return this.pathSegment
  }

  isParam(): this is TreeLeafValueParam {
    return !!(this._type & TreeLeafType.param)
  }

  isStatic(): this is TreeLeafValueStatic {
    return this._type === TreeLeafType.static
  }
}

export class TreeLeafValueStatic extends _TreeLeafValueBase {
  _type: TreeLeafType.static = TreeLeafType.static

  constructor(rawSegment: string, parent: _TreeLeafValueBase | undefined) {
    super(rawSegment, parent)
    this.pathSegment = this.rawSegment = rawSegment
  }
}

const FORMAT_PARAM_RE = /\[(?:.+?)\]([?+*]?)/g

export interface TreeRouteParam {
  paramName: string
  modifier: string | null
  optional: boolean
  repeatable: boolean
  isSplat: boolean
}

export class TreeLeafValueParam extends _TreeLeafValueBase {
  params: TreeRouteParam[]
  _type: TreeLeafType.param = TreeLeafType.param

  constructor(
    rawSegment: string,
    parent: _TreeLeafValueBase | undefined,
    params: TreeRouteParam[]
  ) {
    let pathSegment = rawSegment
    for (const param of params) {
      pathSegment = pathSegment.replace(
        new RegExp(`\\[${param.paramName}\\][?+*]?`),
        `:${param.paramName}${param.isSplat ? '(.*)' : ''}${
          param.modifier || ''
        }`
      )
    }

    super(rawSegment, parent, pathSegment)
    // this._type = TreeLeafType.param

    this.params = params
  }
}

export type TreeLeafValue = TreeLeafValueStatic | TreeLeafValueParam

// TODO: Nuxt syntax [[id]] -> [id]?
const SEGMENT_PARAM_RE = /\[(\.\.\.)?(.+?)\]([?+*]?)/g

export function createTreeLeafValue(
  segment: string,
  parent?: TreeLeafValue
): TreeLeafValue {
  const trimmedSegment = trimExtension(segment)
  if (!trimmedSegment || trimmedSegment === 'index') {
    return new TreeLeafValueStatic('', parent)
  }

  const params: TreeRouteParam[] = Array.from(
    segment.matchAll(SEGMENT_PARAM_RE)
  ).map(([, isSplat, paramName, modifier]) => ({
    modifier,
    paramName,
    optional: modifier === '?' || modifier === '*',
    repeatable: modifier === '*' || modifier === '+',
    isSplat: !!isSplat,
  }))
  if (params.length) {
    return new TreeLeafValueParam(trimmedSegment, parent, params)
  }

  return new TreeLeafValueStatic(trimmedSegment, parent)
}
