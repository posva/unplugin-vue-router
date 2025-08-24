// NOTE: should be imported from vue-router
const invalid = (...args: ConstructorParameters<typeof Error>) =>
  new Error(...args)

export const parse = (value: string): Date => {
  const asDate = new Date(value)
  if (Number.isNaN(asDate.getTime())) {
    throw invalid(`Invalid date: "${value}"`)
  }

  return asDate
}

export const toString = (value: Date): string =>
  value
    .toISOString()
    // allows keeping simple dates like 2023-10-01 without time
    .replace('T00:00:00.000Z', '')
