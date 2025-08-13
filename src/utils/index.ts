import { access, constants } from 'fs/promises'

/**
 * Maybe a promise maybe not
 * @internal
 */
export type _Awaitable<T> = T | PromiseLike<T>

/**
 * Creates a union type that still allows autocompletion for strings.
 *@internal
 */
export type LiteralStringUnion<LiteralType, BaseType extends string = string> =
  | LiteralType
  | (BaseType & Record<never, never>)

// for highlighting
export const ts = String.raw

export async function fileExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}
