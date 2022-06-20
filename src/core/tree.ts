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
    value,
    toString: () => value,
  }
}

function createLeafValueParam(
  name: string,
  value: string,
  modifier: string | null
): TreeLeafValueParam {
  const isOptional = modifier === '?' || modifier === '*'
  const isRepeatable = modifier === '*' || modifier === '+'
  return {
    _type:
      TreeLeafType.param |
      (isOptional ? TreeLeafType.optional : 0) |
      (isRepeatable ? TreeLeafType.repeatable : 0),
    name,
    value,
    toString: () => `:${name}${modifier} (${value})`,
  }
}

export class TreeLeaf<Path extends string = string> {
  /**
   * value of the node
   */
  value: TreeLeafValue
  /**
   * full path of the node
   */
  path: Path
  /**
   * children of the node
   */
  children: Map<string, TreeLeaf> = new Map()

  /**
   * Does the node has a component at the given path. e.g having `routes/users/index.vue` and `routes/users.vue`
   */
  hasComponent = false
  filePath?: string

  constructor(value: string, path: Path) {
    this.value = createTreeLeafValue(value)
    this.path = path
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
      this.children.set(segment, new TreeLeaf(head, `${this.path}/${head}`))
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

  roRouteRecordString(indent = 0): string {
    // root
    if (this.path === '' && indent === 0) {
      return `[
${Array.from(this.children.values())
  .map((child) => child.roRouteRecordString(indent + 1))
  .join(',\n')}
]`
    }

    const startIndent = ' '.repeat(indent * 2)
    const indentStr = ' '.repeat((indent + 1) * 2)

    return `${startIndent}{
${indentStr}path: "${this.path}",
${indentStr}${
      this.hasComponent
        ? `component: () => import('${this.filePath}'),`
        : '/* no component */'
    }
${indentStr}${
      this.children.size > 0
        ? `children: [
${Array.from(this.children.values())
  .map((child) => child.roRouteRecordString(indent + 2))
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
const SEGMENT_PARAM_RE = /\[(.+?)\]([?+*]?)/

function createTreeLeafValue(segment: string): TreeLeafValue {
  // TODO: other extensions
  const trimmedSegment = trimExtension(segment)
  if (trimmedSegment === 'index') {
    return createLeafValueStatic('')
  }

  const paramMatch = SEGMENT_PARAM_RE.exec(segment)
  // console.log({ paramMatch, segment })
  if (paramMatch) {
    const [, paramName, modifier] = paramMatch
    return createLeafValueParam(paramName, trimmedSegment, modifier)
  }

  return createLeafValueStatic(trimmedSegment)
}
