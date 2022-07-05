import { RouteMeta } from 'vue-router'
import { joinPath } from './utils'

export const enum TreeLeafType {
  static,
  param,
}

export type SubSegment = string | TreeRouteParam

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
   * Array of sub segments. This is usually one single elements but can have more for paths like `prefix-[param]-end.vue`
   */
  subSegments: SubSegment[]

  /**
   * fullPath of the node based on parent nodes
   */
  path: string

  overrides: {
    path?: string
    /**
     * Overridden name for this route.
     */
    name?: string
    /**
     * Meta of the route
     */
    meta?: RouteMeta
  } = {}

  /**
   * Component path that maps to a view name, which is used for vue-router's named view feature.
   * Use `default` key for the default view.
   */
  filePaths: Map<string, string>

  constructor(
    rawSegment: string,
    parent: TreeLeafValue | undefined,
    pathSegment: string = rawSegment,
    subSegments: SubSegment[] = [rawSegment]
  ) {
    // type should be defined in child
    this._type = 0
    this.rawSegment = rawSegment
    this.pathSegment = pathSegment
    this.subSegments = subSegments
    this.path =
      !parent?.path && this.pathSegment === ''
        ? '/'
        : joinPath(parent?.path || '', this.pathSegment)
    this.filePaths = new Map()
  }

  toString(): string {
    return this.pathSegment || '<index>'
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

  constructor(
    rawSegment: string,
    parent: TreeLeafValue | undefined,
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

export class TreeLeafValueParam extends _TreeLeafValueBase {
  params: TreeRouteParam[]
  _type: TreeLeafType.param = TreeLeafType.param

  constructor(
    rawSegment: string,
    parent: TreeLeafValue | undefined,
    params: TreeRouteParam[],
    pathSegment: string,
    subSegments: SubSegment[]
  ) {
    super(rawSegment, parent, pathSegment, subSegments)
    this.params = params
  }
}

export type TreeLeafValue = TreeLeafValueStatic | TreeLeafValueParam

export function createTreeLeafValue(
  segment: string,
  parent?: TreeLeafValue
): TreeLeafValue {
  if (!segment || segment === 'index') {
    return new TreeLeafValueStatic('', parent)
  }

  const [pathSegment, params, subSegments] = parseSegment(segment)

  if (params.length) {
    return new TreeLeafValueParam(
      segment,
      parent,
      params,
      pathSegment,
      subSegments
    )
  }

  return new TreeLeafValueStatic(segment, parent, pathSegment)
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
