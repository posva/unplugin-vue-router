import { RouteRecordRaw } from 'vue-router'
import { CustomRouteBlock } from './customBlock'
import { joinPath, mergeRouteRecordOverride } from './utils'

export const enum TreeNodeType {
  static,
  param,
}

export interface RouteRecordOverride
  extends Partial<Pick<RouteRecordRaw, 'meta' | 'props' | 'alias' | 'path'>> {
  name?: string
}

export type SubSegment = string | TreeRouteParam

class _TreeNodeValueBase {
  /**
   * flag based on the type of the segment
   */
  _type: TreeNodeType
  /**
   * segment as defined by the file structure
   */
  rawSegment: string
  /**
   * transformed version of the segment into a vue-router path
   */
  pathSegment: string

  /**
   * Array of sub segments. This is usually one single elements but can have more for paths like `prefix-[param]-end.vue`
   */
  subSegments: SubSegment[]

  /**
   * fullPath of the node based on parent nodes
   */
  path: string

  /**
   * Overrides defined by each file. The map is necessary to handle named views.
   */
  private _overrides = new Map<string, RouteRecordOverride>()

  /**
   * Should this add the loader guard in the route record.
   */
  includeLoaderGuard: boolean = false

  /**
   * Component path that maps to a view name, which is used for vue-router's named view feature.
   * Use `default` key for the default view.
   */
  filePaths: Map<string, string>

  constructor(
    rawSegment: string,
    parent: TreeNodeValue | undefined,
    pathSegment: string = rawSegment,
    subSegments: SubSegment[] = [rawSegment]
  ) {
    // type should be defined in child
    this._type = 0
    this.rawSegment = rawSegment
    this.pathSegment = pathSegment
    this.subSegments = subSegments
    const parentPath = parent?.path
    this.path =
      // both the root record and the index record have a path of /
      (!parentPath || parentPath === '/') && this.pathSegment === ''
        ? '/'
        : joinPath(parent?.path || '', this.pathSegment)
    this.filePaths = new Map()
  }

  toString(): string {
    return this.pathSegment || '<index>'
  }

  isParam(): this is TreeNodeValueParam {
    return !!(this._type & TreeNodeType.param)
  }

  isStatic(): this is TreeNodeValueStatic {
    return this._type === TreeNodeType.static
  }

  get overrides() {
    return [...this._overrides.entries()]
      .sort(([nameA], [nameB]) =>
        nameA === nameB ? 0 : nameA < nameB ? -1 : 1
      )
      .reduce((acc, [_path, routeBlock]) => {
        return mergeRouteRecordOverride(acc, routeBlock)
      }, {} as RouteRecordOverride)
  }

  setOverride(path: string, routeBlock: CustomRouteBlock | undefined) {
    this._overrides.set(path, routeBlock || {})
  }
}

export class TreeNodeValueStatic extends _TreeNodeValueBase {
  _type: TreeNodeType.static = TreeNodeType.static

  constructor(
    rawSegment: string,
    parent: TreeNodeValue | undefined,
    pathSegment = rawSegment
  ) {
    super(rawSegment, parent, pathSegment)
  }
}

export interface TreeRouteParam {
  paramName: string
  modifier: string
  optional: boolean
  repeatable: boolean
  isSplat: boolean
}

export class TreeNodeValueParam extends _TreeNodeValueBase {
  params: TreeRouteParam[]
  _type: TreeNodeType.param = TreeNodeType.param

  constructor(
    rawSegment: string,
    parent: TreeNodeValue | undefined,
    params: TreeRouteParam[],
    pathSegment: string,
    subSegments: SubSegment[]
  ) {
    super(rawSegment, parent, pathSegment, subSegments)
    this.params = params
  }
}

export type TreeNodeValue = TreeNodeValueStatic | TreeNodeValueParam

export function createTreeNodeValue(
  segment: string,
  parent?: TreeNodeValue
): TreeNodeValue {
  if (!segment || segment === 'index') {
    return new TreeNodeValueStatic('', parent)
  }

  const [pathSegment, params, subSegments] = parseSegment(segment)

  if (params.length) {
    return new TreeNodeValueParam(
      segment,
      parent,
      params,
      pathSegment,
      subSegments
    )
  }

  return new TreeNodeValueStatic(segment, parent, pathSegment)
}

const enum ParseSegmentState {
  static,
  paramOptional, // within [[]] or []
  param, // within []
  modifier, // after the ]
}

/**
 * Parses a segment into the route path segment and the extracted params.
 *
 * @param segment - segment to parse without the extension
 * @returns - the pathSegment and the params
 */
function parseSegment(
  segment: string
): [string, TreeRouteParam[], SubSegment[]] {
  let buffer = ''
  let state: ParseSegmentState = ParseSegmentState.static
  const params: TreeRouteParam[] = []
  let pathSegment = ''
  const subSegments: SubSegment[] = []
  let currentTreeRouteParam: TreeRouteParam = createEmptyRouteParam()

  function consumeBuffer() {
    if (state === ParseSegmentState.static) {
      // add the buffer to the path segment as is
      pathSegment += buffer
      subSegments.push(buffer)
    } else if (state === ParseSegmentState.modifier) {
      currentTreeRouteParam.paramName = buffer
      currentTreeRouteParam.modifier = currentTreeRouteParam.optional
        ? currentTreeRouteParam.repeatable
          ? '*'
          : '?'
        : currentTreeRouteParam.repeatable
        ? '+'
        : ''
      buffer = ''
      pathSegment += `:${currentTreeRouteParam.paramName}${
        currentTreeRouteParam.isSplat ? '(.*)' : ''
      }${currentTreeRouteParam.modifier}`
      params.push(currentTreeRouteParam)
      subSegments.push(currentTreeRouteParam)
      currentTreeRouteParam = createEmptyRouteParam()
    }
    buffer = ''
  }

  for (let pos = 0; pos < segment.length; pos++) {
    const c = segment[pos]

    if (state === ParseSegmentState.static) {
      if (c === '[') {
        consumeBuffer()
        // check if it's an optional param or not
        state = ParseSegmentState.paramOptional
      } else {
        // allows for nested paths without nesting the views
        buffer += c === '.' ? '/' : c
      }
    } else if (state === ParseSegmentState.paramOptional) {
      if (c === '[') {
        currentTreeRouteParam.optional = true
      } else if (c === '.') {
        currentTreeRouteParam.isSplat = true
        pos += 2 // skip the other 2 dots
      } else {
        // keep it for the param
        buffer += c
      }
      state = ParseSegmentState.param
    } else if (state === ParseSegmentState.param) {
      if (c === ']') {
        if (currentTreeRouteParam.optional) {
          // skip the next ]
          pos++
        }
        state = ParseSegmentState.modifier
      } else if (c === '.') {
        currentTreeRouteParam.isSplat = true
        pos += 2 // skip the other 2 dots
      } else {
        buffer += c
      }
    } else if (state === ParseSegmentState.modifier) {
      if (c === '+') {
        currentTreeRouteParam.repeatable = true
      } else {
        // parse this character again
        pos--
      }
      consumeBuffer()
      // start again
      state = ParseSegmentState.static
    }
  }

  if (
    state === ParseSegmentState.param ||
    state === ParseSegmentState.paramOptional
  ) {
    throw new Error(`Invalid segment: "${segment}"`)
  }

  if (buffer) {
    consumeBuffer()
  }

  return [pathSegment, params, subSegments]
}

function createEmptyRouteParam(): TreeRouteParam {
  return {
    paramName: '',
    modifier: '',
    optional: false,
    repeatable: false,
    isSplat: false,
  }
}
