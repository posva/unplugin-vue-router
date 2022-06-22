import { resolve } from 'path'
import { trimExtension } from './utils'

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
   * fullpath of the node based on parent nodes
   */
  path: string

  /**
   * Does the node has a component at the given path. e.g having `routes/users/index.vue` and `routes/users.vue`
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
    // the root has an empty rawSegment and should have an empty name too so children do not start with an extra /
    this.routeName = rawSegment
      ? (parent?.routeName ?? '') + '/' + rawSegment
      : ''
    this.path =
      !parent?.path && this.pathSegment === ''
        ? '/'
        : joinPath(parent?.path || '', this.pathSegment)
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

class TreeLeafValueStatic extends _TreeLeafValueBase {
  _type: TreeLeafType.static = TreeLeafType.static

  constructor(rawSegment: string, parent: _TreeLeafValueBase | undefined) {
    super(rawSegment, parent)
    this.pathSegment = this.rawSegment = rawSegment
  }
}

const FORMAT_PARAM_RE = /\[(?:.+?)\]([?+*]?)/g

class TreeLeafValueParam extends _TreeLeafValueBase {
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

type TreeLeafValue = TreeLeafValueStatic | TreeLeafValueParam

export class TreeLeaf {
  /**
   * value of the node
   */
  value: TreeLeafValue
  /**
   * children of the node
   */
  children: Map<string, TreeLeaf> = new Map()

  constructor(value: string, parent?: TreeLeaf) {
    this.value = createTreeLeafValue(value, parent?.value)
  }

  /**
   * Adds a path to the tree
   *
   * @param path - route path of the file
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insert(path: string, filePath: string = path) {
    const slashPos = path.indexOf('/')
    const head = slashPos < 0 ? path : path.slice(0, slashPos)
    const tail = slashPos < 0 ? '' : path.slice(slashPos + 1)

    const segment = trimExtension(head)
    const isComponent = segment !== head

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeLeaf(head, this))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.value.filePath = filePath
    }

    if (tail) {
      child.insert(tail, filePath)
    }
  }

  remove(path: string) {
    const slashPos = path.indexOf('/')
    const head = slashPos < 0 ? path : path.slice(0, slashPos)
    const tail = slashPos < 0 ? '' : path.slice(slashPos + 1)

    const segment = trimExtension(head)
    const isComponent = segment !== head

    const child = this.children.get(segment)
    if (!child) {
      throw new Error(
        `Cannot Delete "${path}". "${head}" not found at "${this.value.path}".`
      )
    }
    if (tail) {
      child.remove(tail)
      // if the child doesn't create any route
      if (child.children.size === 0 && !child.value.filePath) {
        this.children.delete(segment)
      }
    } else {
      // it can only be component because we only listen for removed files, not folders
      if (isComponent) {
        child.value.filePath = undefined
      }
      // this is the file we wanted to remove
      if (child.children.size === 0) {
        this.children.delete(segment)
      }
    }
  }

  toString(): string {
    return `${this.value}${this.value.filePath ? ' 📄' : ''}`
    // return `[${this.value._type}|"${this.value.value}", [${Array.from(
    //   this.children.values()
    // ).join(', ')}] ]`
  }

  // TODO: move to a separate file
  toRouteRecordString(
    indent = 0,
    parent: TreeLeaf | null = null,
    parentName = ''
  ): string {
    // root
    if (this.value.path === '/' && indent === 0) {
      return `[
${Array.from(this.children.values())
  .map((child) => child.toRouteRecordString(indent + 1))
  .join(',\n')}
]`
    }

    const startIndent = ' '.repeat(indent * 2)
    const indentStr = ' '.repeat((indent + 1) * 2)

    // const name = parentName + '/' + this.value.rawSegment
    const name = this.value.routeName

    return `${startIndent}{
${indentStr}path: "${(parent ? '' : '/') + this.value.pathSegment}",
${indentStr}${this.value.filePath ? `name: "${name}",` : '/* no name */'}
${indentStr}${
      this.value.filePath
        ? `component: () => import('${this.value.filePath}'),`
        : '/* no component */'
    }
${indentStr}${
      this.children.size > 0
        ? `children: [
${Array.from(this.children.values())
  .map((child) => child.toRouteRecordString(indent + 2, this, name))
  .join(',\n')}
${indentStr}],`
        : '/* no children */'
    }
${startIndent}}`
  }
}

export function createPrefixTree() {
  const tree = new TreeLeaf('')
  return tree
}

// TODO: handle sub segments like sub-[param]-other-[param2]
// TODO: multiple params
// TODO: Nuxt syntax [[id]] -> [id]?
const SEGMENT_PARAM_RE = /\[(\.\.\.)?(.+?)\]([?+*]?)/

function createTreeLeafValue(
  segment: string,
  parent?: TreeLeafValue
): TreeLeafValue {
  // TODO: other extensions
  const trimmedSegment = trimExtension(segment)
  if (!trimmedSegment || trimmedSegment === 'index') {
    return new TreeLeafValueStatic('', parent)
  }

  const paramMatch = SEGMENT_PARAM_RE.exec(segment)
  // console.log({ paramMatch, segment })
  if (paramMatch) {
    const [, isSplat, paramName, modifier] = paramMatch
    return new TreeLeafValueParam(
      trimmedSegment,
      parent,
      paramName,
      modifier,
      !!isSplat
    )
  }

  return new TreeLeafValueStatic(trimmedSegment, parent)
}

const PATH_TO_NAME_SLASH = /\/([\w\d])/g
const LEADING_SLASH_RE = /^\//
const TRAILING_SLASH_RE = /\/$/

export function routePathToName(path: string): string {
  const noSlashes = path
    .replace(LEADING_SLASH_RE, '')
    .replace(TRAILING_SLASH_RE, '')

  // capitalize
  return noSlashes.length > 0
    ? (noSlashes[0].toUpperCase() + noSlashes.slice(1)).replace(
        // replace inner slashes
        PATH_TO_NAME_SLASH,
        (match, p1) => p1.toUpperCase()
      )
    : 'Index'
}

export function joinPath(...paths: string[]): string {
  let result = ''
  for (const path of paths) {
    result =
      result.replace(TRAILING_SLASH_RE, '') +
      '/' +
      path.replace(LEADING_SLASH_RE, '')
  }
  return result
}
