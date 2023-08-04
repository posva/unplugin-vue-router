import { vi } from 'vitest'
import { defineLoader } from '~/src/data-fetching_new/defineLoader'

export const dataOneSpy = vi.fn(async () => 'resolved 1')
export const dataTwoSpy = vi.fn(async () => 'resolved 2')

export const useDataOne = defineLoader(dataOneSpy)
export const useDataTwo = defineLoader(dataTwoSpy)
