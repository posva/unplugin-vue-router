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
 * @param spaces The number of spaces to pad with.
 * @param str The string to pad, none if omitted.
 * @returns The padded string.
 */
export function indent(spaces: number, str = ''): string {
  return `${' '.repeat(spaces)}${str}`
}

/**
 * Formats an array of union items as a multiline union type.
 * @param items The items to format.
 * @param spaces The number of spaces to indent each line.
 * @returns The formatted multiline union type.
 */
export function formatMultilineUnion(items: string[], spaces: number): string {
  return (items.length ? items : ['never'])
    .map((s) => `| ${s}`)
    .join(`\n${indent(spaces)}`)
}

/**
 * Converts a string value to a TS string literal type.
 * @param str the string to convert to a string type
 * @returns The string wrapped in single quotes.
 * @example
 * stringToStringType('hello') // returns "'hello'"
 */
export function stringToStringType(str: string): string {
  return `'${str}'`
}
