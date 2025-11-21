// NOTE: should be imported from vue-router
const invalid = (...args: ConstructorParameters<typeof Error>) =>
  new Error(...args)

export const parse = (value: string): number => {
  const asNumber = Number(value)
  if (Number.isFinite(asNumber)) {
    return asNumber
  }
  throw invalid(`Expected a number, but received: ${value}`)
}

// Same as default serializer
export const toString = (value: number): string => String(value)
