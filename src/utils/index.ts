import { access, constants } from 'node:fs/promises'

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

/**
 * Pads a single-line string with spaces.
 * @param indent The number of spaces to pad with.
 * @param str The string to pad, none if omitted.
 * @returns The padded string.
 */
export function pad(indent: number, str = ''): string {
  return str.padStart(str.length + indent)
}

/**
 * Formats an array of union items as a multiline union type.
 * @param items The items to format.
 * @param indent The number of spaces to indent each line.
 * @returns The formatted multiline union type.
 */
export function formatMultilineUnion(items: string[], indent: number): string {
  return items.map((s) => `| ${s}`).join(`\n${pad(indent)}`)
}
