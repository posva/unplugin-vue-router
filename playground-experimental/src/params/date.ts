import { type ParamParser, miss } from 'vue-router/experimental'

export const parser: ParamParser<Date, string> = {
  get: (value: string): Date => {
    const asDate = new Date(value)
    if (Number.isNaN(asDate.getTime())) {
      throw miss(`Invalid date: "${value}"`)
    }

    return asDate
  },
  set: (value: Date): string =>
    value
      .toISOString()
      // allows keeping simple dates like 2023-10-01 without time
      // while still being able to parse full dates like 2023-10-01T12:00:00.000Z
      .replace('T00:00:00.000Z', ''),
}
