import { type LocationQuery } from 'vue-router'

/**
 * Returns true if `inner` is a subset of `outer`
 *
 * @param outer - the bigger params
 * @param inner - the smaller params
 */
export function includesParams(
  outer: LocationQuery,
  inner: Partial<LocationQuery>
): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outerValue = outer[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outerValue) return false
    } else if (!innerValue || !outerValue) {
      // if one of them is undefined, we need to check if the other is undefined too
      if (innerValue !== outerValue) return false
    } else {
      if (
        !Array.isArray(outerValue) ||
        outerValue.length !== innerValue.length ||
        innerValue.some((value, i) => value !== outerValue[i])
      )
        return false
    }
  }

  return true
}
