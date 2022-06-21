import { resolve } from 'path'
import { trimExtension } from './utils'

export const enum TreeLeafType {
  static = 0,
  param = 0b1,
  repeatable = 0b10,
  optional = 0b100,
}

interface _TreeLeafValueBase {
  _type: TreeLeafType
  pathSegment: string
  toString(): string
}

interface TreeLeafValueStatic extends _TreeLeafValueBase {
  _type: TreeLeafType.static
  value: string
}

interface TreeLeafValueParam extends _TreeLeafValueBase {
  _type: number
  name: string
  value: string
}

type TreeLeafValue = TreeLeafValueStatic | TreeLeafValueParam

function createLeafValueStatic(value: string): TreeLeafValueStatic {
  return {
    _type: TreeLeafType.static,
    pathSegment: value,
    value,
    toString: () => value,
  }
}

const FORMAT_PARAM_RE = /\[(?:.+?)\]([?+*]?)/g
function createLeafValueParam(
  name: string,
  value: string,
  modifier: string | null,
  isSplat: boolean
): TreeLeafValueParam {
  const isOptional = modifier === '?' || modifier === '*'
  const isRepeatable = modifier === '*' || modifier === '+'
  const pathSegment = value.replace(
    FORMAT_PARAM_RE,
    `:${name}${isSplat ? '(.*)' : ''}$1`
  )
  return {
    _type:
      TreeLeafType.param |
      (isOptional ? TreeLeafType.optional : 0) |
      (isRepeatable ? TreeLeafType.repeatable : 0),
    name,
    pathSegment,
    value,
    toString: () => pathSegment,
  }
}

export class TreeLeaf {
  /**
   * value of the node
   */
  value: TreeLeafValue
  /**
   * full path of the node
   */
  path: string
  /**
   * children of the node
   */
  children: Map<string, TreeLeaf> = new Map()

  /**
   * Does the node has a component at the given path. e.g having `routes/users/index.vue` and `routes/users.vue`
   */
  hasComponent = false
  filePath?: string

  constructor(value: string, parentPath: string) {
    this.value = createTreeLeafValue(value)
    if (!parentPath && this.value.pathSegment === '') {
      this.path = '/'
    } else {
      this.path = joinPath(parentPath, this.value.pathSegment)
    }
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
      this.children.set(segment, new TreeLeaf(head, this.path))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.hasComponent = true
      child.filePath = filePath
    }

    if (tail) {
      child.insert(tail, filePath)
    }
  }

  toString(): string {
    return `${this.value}${this.hasComponent ? ' 📄' : ''}`
    // return `[${this.value._type}|"${this.value.value}", [${Array.from(
    //   this.children.values()
    // ).join(', ')}] ]`
  }

  toRouteRecordString(
    indent = 0,
    parent: TreeLeaf | null = null,
    parentName = ''
  ): string {
    // root
    if (this.path === '/' && indent === 0) {
      return `[
${Array.from(this.children.values())
  .map((child) => child.toRouteRecordString(indent + 1))
  .join(',\n')}
]`
    }

    const startIndent = ' '.repeat(indent * 2)
    const indentStr = ' '.repeat((indent + 1) * 2)

    const name = parentName + '/' + this.value.value

    return `${startIndent}{
${indentStr}path: "${(parent ? '' : '/') + this.value.pathSegment}",
${indentStr}${this.hasComponent ? `name: "${name}",` : '/* no name */'}
${indentStr}${
      this.hasComponent
        ? `component: () => import('${this.filePath}'),`
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
  const tree = new TreeLeaf('', '')
  return tree
}

// TODO: handle sub segments like sub-[param]-other-[param2]
// TODO: multiple params
// TODO: splat
// TODO: Nuxt syntax [[id]] -> [id]?
const SEGMENT_PARAM_RE = /\[(\.\.\.)?(.+?)\]([?+*]?)/

function createTreeLeafValue(segment: string): TreeLeafValue {
  // TODO: other extensions
  const trimmedSegment = trimExtension(segment)
  if (!trimmedSegment || trimmedSegment === 'index') {
    return createLeafValueStatic('')
  }

  const paramMatch = SEGMENT_PARAM_RE.exec(segment)
  // console.log({ paramMatch, segment })
  if (paramMatch) {
    const [, isSplat, paramName, modifier] = paramMatch
    return createLeafValueParam(paramName, trimmedSegment, modifier, !!isSplat)
  }

  return createLeafValueStatic(trimmedSegment)
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
