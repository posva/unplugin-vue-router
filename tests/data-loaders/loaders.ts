import { vi } from 'vitest'
import { defineBasicLoader } from '~/src/data-fetching_new/defineLoader'

export const dataOneSpy = vi.fn(async () => 'resolved 1')
export const dataTwoSpy = vi.fn(async () => 'resolved 2')

export const useDataOne = defineBasicLoader(dataOneSpy)
export const useDataTwo = defineBasicLoader(dataTwoSpy)
