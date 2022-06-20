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

  constructor(value: string, path: Path) {
    this.value = createTreeLeafValue(value)
    this.path = path
  }

  insert(path: string) {
    const slashIndex = path.indexOf('/')
    const head = slashIndex < 0 ? path : path.slice(0, slashIndex)
    const tail = slashIndex < 0 ? '' : path.slice(slashIndex + 1)

    const segment = trimExtension(head)
    const isComponent = segment !== head

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeLeaf(head, `${this.path}/${head}`))
    }
    const child = this.children.get(segment)!

    if (isComponent) {
      child.hasComponent = true
    }

    if (tail) {
      child.insert(tail)
    }
  }

  toString(): string {
    return `${this.value}${this.hasComponent ? ' 📄' : ''}`
    // return `[${this.value._type}|"${this.value.value}", [${Array.from(
    //   this.children.values()
    // ).join(', ')}] ]`
  }
}

export function createPrefixTree(paths: string[] = []) {
  const tree = new TreeLeaf('', '/')
  for (const path of paths) {
    tree.insert(path)
  }
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

function trimExtension(path: string) {
  const lastDot = path.lastIndexOf('.')
  return lastDot < 0 ? path : path.slice(0, lastDot)
}
