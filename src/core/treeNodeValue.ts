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

// internal name used for overrides done by the user at build time
export const EDITS_OVERRIDE_NAME = '@@edits'

class _TreeNodeValueBase {
  /**
   * flag based on the type of the segment
   */
  _type: TreeNodeType
  /**
   * segment as defined by the file structure e.g. keeps the `index` name
   */
  rawSegment: string
  /**
   * transformed version of the segment into a vue-router path. e.g. `'index'` becomes `''` and `[param]` becomes
   * `:param`
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
   * Should we add the loader guard to the route record.
   */
  includeLoaderGuard: boolean = false

  /**
   * View name (Vue Router feature) mapped to their corresponding file. By default, the view name is `default` unless
   * specified with a `@` e.g. `index@aux.vue` will have a view name of `aux`.
   */
  components = new Map<string, string>()

  constructor(
    rawSegment: string,
    parent: TreeNodeValue | undefined,
    pathSegment: string = rawSegment,
    subSegments: SubSegment[] = [pathSegment]
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
        nameA === nameB
          ? 0
          : // EDITS_OVERRIDE_NAME should always be last
          nameA !== EDITS_OVERRIDE_NAME &&
            (nameA < nameB || nameB === EDITS_OVERRIDE_NAME)
          ? -1
          : 1
      )
      .reduce((acc, [_path, routeBlock]) => {
        return mergeRouteRecordOverride(acc, routeBlock)
      }, {} as RouteRecordOverride)
  }

  setOverride(path: string, routeBlock: CustomRouteBlock | undefined) {
    this._overrides.set(path, routeBlock || {})
  }

  /**
   * Remove all overrides for a given key.
   *
   * @param key - key to remove from the override
   */
  removeOverride(key: keyof CustomRouteBlock) {
    this._overrides.forEach((routeBlock) => {
      // @ts-expect-error
      delete routeBlock[key]
    })
  }

  mergeOverride(path: string, routeBlock: CustomRouteBlock) {
    const existing = this._overrides.get(path) || {}
    this._overrides.set(path, mergeRouteRecordOverride(existing, routeBlock))
  }

  addEditOverride(routeBlock: CustomRouteBlock) {
    return this.mergeOverride(EDITS_OVERRIDE_NAME, routeBlock)
  }

  setEditOverride<K extends keyof RouteRecordOverride>(
    key: K,
    value: RouteRecordOverride[K]
  ) {
    // return this.mergeOverride(EDITS_OVERRIDE_NAME, routeBlock)
    if (!this._overrides.has(EDITS_OVERRIDE_NAME)) {
      this._overrides.set(EDITS_OVERRIDE_NAME, {})
    }

    const existing = this._overrides.get(EDITS_OVERRIDE_NAME)!
    existing[key] = value
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
  parent?: TreeNodeValue,
  parseSegmentOptions?: ParseSegmentOptions
): TreeNodeValue {
  if (!segment || segment === 'index') {
    return new TreeNodeValueStatic(segment, parent, '')
  }

  const [pathSegment, params, subSegments] = parseSegment(
    segment,
    parseSegmentOptions
  )

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
 * Options passed to `parseSegment()`to control how a segment of a file path is parsed. e.g. in `/users/[id]`, `users`
 * and `[id]` are segments.
 */
export interface ParseSegmentOptions {
  /**
   * Should we allow dot nesting in the param name. e.g. `users.[id]` will be parsed as `users/[id]` if this is `true`,
   * nesting
   * @default true
   */
  dotNesting?: boolean
}

const IS_VARIABLE_CHAR_RE = /[0-9a-zA-Z_]/

/**
 * Parses a segment into the route path segment and the extracted params.
 *
 * @param segment - segment to parse without the extension
 * @returns - the pathSegment and the params
 */
function parseSegment(
  segment: string,
  { dotNesting = true }: ParseSegmentOptions = {}
): [string, TreeRouteParam[], SubSegment[]] {
  let buffer = ''
  let state: ParseSegmentState = ParseSegmentState.static
  const params: TreeRouteParam[] = []
  let pathSegment = ''
  const subSegments: SubSegment[] = []
  let currentTreeRouteParam: TreeRouteParam = createEmptyRouteParam()

  // position in segment
  let pos = 0
  // current char
  let c: string

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
        currentTreeRouteParam.isSplat
          ? '(.*)'
          : // Only append () if necessary
          pos < segment.length - 1 && IS_VARIABLE_CHAR_RE.test(segment[pos + 1])
          ? '()'
          : // allow routes like /[id]_suffix to make suffix static and not part of the param
            ''
      }${currentTreeRouteParam.modifier}`
      params.push(currentTreeRouteParam)
      subSegments.push(currentTreeRouteParam)
      currentTreeRouteParam = createEmptyRouteParam()
    }
    buffer = ''
  }

  for (pos = 0; pos < segment.length; pos++) {
    c = segment[pos]

    if (state === ParseSegmentState.static) {
      if (c === '[') {
        consumeBuffer()
        // check if it's an optional param or not
        state = ParseSegmentState.paramOptional
      } else {
        // append the char to the buffer or if the dotNesting option
        // is enabled (by default it is), transform into a slash
        buffer += dotNesting && c === '.' ? '/' : c
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
