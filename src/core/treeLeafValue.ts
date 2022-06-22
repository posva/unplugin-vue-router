import { joinPath } from './utils'

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

export class TreeLeafValueParam extends _TreeLeafValueBase {
  paramName: string

  constructor(
    rawSegment: string,
    parent: _TreeLeafValueBase | undefined,
    paramName: string,
    modifier: string | null,
    isSplat: boolean
  ) {
    const pathSegment = rawSegment.replace(
      FORMAT_PARAM_RE,
      `:${paramName}${isSplat ? '(.*)' : ''}$1`
    )
    super(rawSegment, parent, pathSegment)
    const isOptional = modifier === '?' || modifier === '*'
    const isRepeatable = modifier === '*' || modifier === '+'
    this._type =
      TreeLeafType.param |
      (isOptional ? TreeLeafType.optional : 0) |
      (isRepeatable ? TreeLeafType.repeatable : 0)
    this.paramName = paramName
  }
}

export type TreeLeafValue = TreeLeafValueStatic | TreeLeafValueParam
