import type { RouteRecordRaw } from 'vue-router'
import { CustomRouteBlock } from './customBlock'
import { joinPath, mergeRouteRecordOverride, warn } from './utils'

export const enum TreeNodeType {
  static,
  group,
  param,
}

export interface RouteRecordOverride
  extends Partial<Pick<RouteRecordRaw, 'meta' | 'props' | 'alias' | 'path'>> {
  name?: string | undefined
}

export type SubSegment = string | TreeRouteParam

// internal name used for overrides done by the user at build time
export const EDITS_OVERRIDE_NAME = '@@edits'

class _TreeNodeValueBase {
  /**
   * flag based on the type of the segment
   */
  _type: TreeNodeType

  parent: TreeNodeValue | undefined

  /**
   * segment as defined by the file structure e.g. keeps the `index` name, `(group-name)`
   */
  rawSegment: string
  /**
   * transformed version of the segment into a vue-router path. e.g. `'index'` becomes `''` and `[param]` becomes
   * `:param`, `prefix-[param]-end` becomes `prefix-:param-end`.
   */
  pathSegment: string

  /**
   * Array of sub segments. This is usually one single elements but can have more for paths like `prefix-[param]-end.vue`
   */
  subSegments: SubSegment[]

  /**
   * Overrides defined by each file. The map is necessary to handle named views.
   */
  private _overrides = new Map<string, RouteRecordOverride>()
  // TODO: cache the overrides generation

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
    this.parent = parent
  }

  /**
   * fullPath of the node based on parent nodes
   */
  get path(): string {
    const parentPath = this.parent?.path
    // both the root record and the index record have a path of /
    const pathSegment = this.overrides.path ?? this.pathSegment
    return (!parentPath || parentPath === '/') && pathSegment === ''
      ? '/'
      : joinPath(parentPath || '', pathSegment)
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

  isGroup(): this is TreeNodeValueGroup {
    return this._type === TreeNodeType.group
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

  setOverride(filePath: string, routeBlock: CustomRouteBlock | undefined) {
    this._overrides.set(filePath, routeBlock || {})
  }

  /**
   * Remove all overrides for a given key.
   *
   * @param key - key to remove from the override, e.g. path, name, etc
   */
  removeOverride(key: keyof CustomRouteBlock) {
    for (const [_filePath, routeBlock] of this._overrides) {
      // @ts-expect-error
      delete routeBlock[key]
    }
  }

  /**
   * Add an override to the current node by merging with the existing values.
   *
   * @param filePath - The file path to add to the override
   * @param routeBlock - The route block to add to the override
   */
  mergeOverride(filePath: string, routeBlock: CustomRouteBlock) {
    const existing = this._overrides.get(filePath) || {}
    this._overrides.set(
      filePath,
      mergeRouteRecordOverride(existing, routeBlock)
    )
  }

  /**
   * Add an override to the current node using the special file path `@@edits` that makes this added at build time.
   *
   * @param routeBlock -  The route block to add to the override
   */
  addEditOverride(routeBlock: CustomRouteBlock) {
    return this.mergeOverride(EDITS_OVERRIDE_NAME, routeBlock)
  }

  /**
   * Set a specific value in the _edits_ override.
   *
   * @param key - key to set in the override, e.g. path, name, etc
   * @param value - value to set in the override
   */
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
  override _type: TreeNodeType.static = TreeNodeType.static

  constructor(
    rawSegment: string,
    parent: TreeNodeValue | undefined,
    pathSegment = rawSegment
  ) {
    super(rawSegment, parent, pathSegment)
  }
}

export class TreeNodeValueGroup extends _TreeNodeValueBase {
  override _type: TreeNodeType.group = TreeNodeType.group
  groupName: string

  constructor(
    rawSegment: string,
    parent: TreeNodeValue | undefined,
    pathSegment: string,
    groupName: string
  ) {
    super(rawSegment, parent, pathSegment)
    this.groupName = groupName
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
  override _type: TreeNodeType.param = TreeNodeType.param

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

export type TreeNodeValue =
  | TreeNodeValueStatic
  | TreeNodeValueParam
  | TreeNodeValueGroup

export interface TreeNodeValueOptions extends ParseSegmentOptions {
  /**
   * Format of the route path. Defaults to `file` which is the format used by unplugin-vue-router and matches the file
   * structure (e.g. `index`, ``, or `users/[id]`). In `path` format, routes are expected in the format of vue-router
   * (e.g. `/` or '/users/:id' ).
   *
   * @default `'file'`
   */
  format?: 'file' | 'path'
}

/**
 * Resolves the options for the TreeNodeValue.
 *
 * @param options - options to resolve
 * @returns resolved options
 */
function resolveTreeNodeValueOptions(
  options: TreeNodeValueOptions
): Required<TreeNodeValueOptions> {
  return {
    format: 'file',
    dotNesting: true,
    ...options,
  }
}

/**
 * Creates a new TreeNodeValue based on the segment. The result can be a static segment, group segment or a param segment.
 *
 * @param segment - path segment
 * @param parent - parent node
 * @param options - options
 */
export function createTreeNodeValue(
  segment: string,
  parent?: TreeNodeValue,
  opts: TreeNodeValueOptions = {}
): TreeNodeValue {
  if (!segment || segment === 'index') {
    return new TreeNodeValueStatic(segment, parent, '')
  }

  // ensure default options
  const options = resolveTreeNodeValueOptions(opts)

  // extract the group between parentheses
  const openingPar = segment.indexOf('(')

  // only apply to files, not to manually added routes
  if (options.format === 'file' && openingPar >= 0) {
    let groupName: string

    const closingPar = segment.lastIndexOf(')')
    if (closingPar < 0 || closingPar < openingPar) {
      warn(
        `Segment "${segment}" is missing the closing ")". It will be treated as a static segment.`
      )

      // avoid parsing errors
      return new TreeNodeValueStatic(segment, parent, segment)
    }

    groupName = segment.slice(openingPar + 1, closingPar)
    const before = segment.slice(0, openingPar)
    const after = segment.slice(closingPar + 1)

    if (!before && !after) {
      // pure group: no contribution to the path
      return new TreeNodeValueGroup(segment, parent, '', groupName)
    }
  }

  const [pathSegment, params, subSegments] =
    options.format === 'path'
      ? parseRawPathSegment(segment)
      : // by default, we use the file format
        parseFileSegment(segment, options)

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

const enum ParseFileSegmentState {
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
   * nesting. Note this only works for the `file` format.
   *
   * @default `true`
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
function parseFileSegment(
  segment: string,
  { dotNesting = true }: ParseSegmentOptions = {}
): [string, TreeRouteParam[], SubSegment[]] {
  let buffer = ''
  let state: ParseFileSegmentState = ParseFileSegmentState.static
  const params: TreeRouteParam[] = []
  let pathSegment = ''
  const subSegments: SubSegment[] = []
  let currentTreeRouteParam: TreeRouteParam = createEmptyRouteParam()

  // position in segment
  let pos = 0
  // current char
  let c: string

  function consumeBuffer() {
    if (state === ParseFileSegmentState.static) {
      // add the buffer to the path segment as is
      pathSegment += buffer
      subSegments.push(buffer)
    } else if (state === ParseFileSegmentState.modifier) {
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
            pos < segment.length - 1 &&
              IS_VARIABLE_CHAR_RE.test(segment[pos + 1]!)
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
    c = segment[pos]!

    if (state === ParseFileSegmentState.static) {
      if (c === '[') {
        consumeBuffer()
        // check if it's an optional param or not
        state = ParseFileSegmentState.paramOptional
      } else {
        // append the char to the buffer or if the dotNesting option
        // is enabled (by default it is), transform into a slash
        buffer += dotNesting && c === '.' ? '/' : c
      }
    } else if (state === ParseFileSegmentState.paramOptional) {
      if (c === '[') {
        currentTreeRouteParam.optional = true
      } else if (c === '.') {
        currentTreeRouteParam.isSplat = true
        pos += 2 // skip the other 2 dots
      } else {
        // keep it for the param
        buffer += c
      }
      state = ParseFileSegmentState.param
    } else if (state === ParseFileSegmentState.param) {
      if (c === ']') {
        if (currentTreeRouteParam.optional) {
          // skip the next ]
          pos++
        }
        state = ParseFileSegmentState.modifier
      } else if (c === '.') {
        currentTreeRouteParam.isSplat = true
        pos += 2 // skip the other 2 dots
      } else {
        buffer += c
      }
    } else if (state === ParseFileSegmentState.modifier) {
      if (c === '+') {
        currentTreeRouteParam.repeatable = true
      } else {
        // parse this character again
        pos--
      }
      consumeBuffer()
      // start again
      state = ParseFileSegmentState.static
    }
  }

  if (
    state === ParseFileSegmentState.param ||
    state === ParseFileSegmentState.paramOptional
  ) {
    throw new Error(`Invalid segment: "${segment}"`)
  }

  if (buffer) {
    consumeBuffer()
  }

  return [pathSegment, params, subSegments]
}

// TODO: this logic is flawed because it only handles segments. We should use the path parser from vue router that already has all this logic baked in.

const enum ParseRawPathSegmentState {
  static,
  param, // after :
  regexp, // after :id(
  modifier, // after :id(...)
}

const IS_MODIFIER_RE = /[+*?]/

/**
 * Parses a raw path segment like the `:id` in a route `/users/:id`.
 *
 * @param segment - segment to parse without the extension
 * @returns - the pathSegment and the params
 */
function parseRawPathSegment(
  segment: string
): [string, TreeRouteParam[], SubSegment[]] {
  let buffer = ''
  let state: ParseRawPathSegmentState = ParseRawPathSegmentState.static
  const params: TreeRouteParam[] = []
  const subSegments: SubSegment[] = []
  let currentTreeRouteParam: TreeRouteParam = createEmptyRouteParam()

  // position in segment
  let pos = 0
  // current char
  let c: string

  function consumeBuffer() {
    if (state === ParseRawPathSegmentState.static) {
      // add the buffer to the path segment as is
      subSegments.push(buffer)
    } else if (
      state === ParseRawPathSegmentState.param ||
      state === ParseRawPathSegmentState.regexp ||
      state === ParseRawPathSegmentState.modifier
    ) {
      // we consume the current param
      subSegments.push(currentTreeRouteParam)
      params.push(currentTreeRouteParam)
      currentTreeRouteParam = createEmptyRouteParam()
    }
    // no other cases

    buffer = ''
  }

  for (pos = 0; pos < segment.length; pos++) {
    c = segment[pos]!

    if (c === '\\') {
      // skip the next char
      pos++
      buffer += segment[pos]
      continue
    }

    if (state === ParseRawPathSegmentState.static) {
      if (c === ':') {
        consumeBuffer()
        // check if it's an optional param or not
        state = ParseRawPathSegmentState.param
      } else {
        buffer += c
      }
    } else if (state === ParseRawPathSegmentState.param) {
      if (c === '(') {
        // consume the param name and start the regexp
        currentTreeRouteParam.paramName = buffer
        buffer = ''
        state = ParseRawPathSegmentState.regexp
      } else if (IS_MODIFIER_RE.test(c)) {
        // add as modifier
        currentTreeRouteParam.modifier = c
        currentTreeRouteParam.optional = c === '?' || c === '*'
        currentTreeRouteParam.repeatable = c === '+' || c === '*'
        // consume the param
        consumeBuffer()
        // start again
        state = ParseRawPathSegmentState.static
      } else if (IS_VARIABLE_CHAR_RE.test(c)) {
        buffer += c
        // keep it as we could be at the end of the string
        currentTreeRouteParam.paramName = buffer
      } else {
        currentTreeRouteParam.paramName = buffer
        // we reached the end of the param
        consumeBuffer()
        // we need to parse this again
        pos--
        state = ParseRawPathSegmentState.static
      }
    } else if (state === ParseRawPathSegmentState.regexp) {
      if (c === ')') {
        // we don't actually care about the regexp as it already on the segment
        // currentTreeRouteParam.regexp = buffer
        if (buffer === '.*') {
          currentTreeRouteParam.isSplat = true
        }
        // we don't reset the buffer but it needs to be consumed
        // check if there is a modifier
        state = ParseRawPathSegmentState.modifier
      } else {
        buffer += c
      }
    } else if (state === ParseRawPathSegmentState.modifier) {
      if (IS_MODIFIER_RE.test(c)) {
        currentTreeRouteParam.modifier = c
        currentTreeRouteParam.optional = c === '?' || c === '*'
        currentTreeRouteParam.repeatable = c === '+' || c === '*'
      } else {
        // parse this character again
        pos--
      }
      // add the param to the segment list
      consumeBuffer()
      // start again
      state = ParseRawPathSegmentState.static
    }
  }

  // we cannot reach the end of the segment
  if (state === ParseRawPathSegmentState.regexp) {
    throw new Error(`Invalid segment: "${segment}"`)
  }

  if (
    buffer ||
    // an empty finished regexp enters this state but must also be consumed
    state === ParseRawPathSegmentState.modifier
  ) {
    consumeBuffer()
  }

  return [
    // here the segment is already a valid path segment
    segment,
    params,
    subSegments,
  ]
}

/**
 * Helper function to create an empty route param used by the parser.
 *
 * @returns an empty route param
 */
function createEmptyRouteParam(): TreeRouteParam {
  return {
    paramName: '',
    modifier: '',
    optional: false,
    repeatable: false,
    isSplat: false,
  }
}
