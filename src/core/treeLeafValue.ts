import type { Options } from '../options'
import { joinPath, trimExtension } from './utils'

export const enum TreeLeafType {
  static,
  param,
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
    parent: TreeLeafValue | undefined,
    options: Options,
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
    this.routeName = options.getRouteName(this as TreeLeafValue, parent)
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
    options: Options
  ) {
    super(rawSegment, parent, options)
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
    options: Options
  ) {
    super(rawSegment, parent, options, pathSegment)
    this.params = params
  }
}

export type TreeLeafValue = TreeLeafValueStatic | TreeLeafValueParam

export function createTreeLeafValue(
  options: Options,
  segment: string,
  parent?: TreeLeafValue
): TreeLeafValue {
  const trimmedSegment = trimExtension(segment)
  if (!trimmedSegment || trimmedSegment === 'index') {
    return new TreeLeafValueStatic('', parent, options)
  }

  const [pathSegment, params] = parseSegment(trimmedSegment)

  if (params.length) {
    return new TreeLeafValueParam(
      trimmedSegment,
      parent,
      params,
      pathSegment,
      options
    )
  }

  return new TreeLeafValueStatic(trimmedSegment, parent, options)
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
function parseSegment(segment: string): [string, TreeRouteParam[]] {
  let buffer = ''
  let state: ParseSegmentState = ParseSegmentState.static
  const params: TreeRouteParam[] = []
  let pathSegment = ''
  let currentTreeRouteParam: TreeRouteParam = createEmptyRouteParam()

  function consumeBuffer() {
    if (state === ParseSegmentState.static) {
      // add the buffer to the path segment as is
      pathSegment += buffer
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
        buffer += c
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

  return [pathSegment, params]
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
