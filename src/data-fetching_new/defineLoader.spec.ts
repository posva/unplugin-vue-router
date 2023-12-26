/**
 * @vitest-environment happy-dom
 */
import { Ref, shallowRef } from 'vue'
import { defineBasicLoader } from './defineLoader'
import { expectType } from 'ts-expect'
import { describe } from 'vitest'
import { NavigationResult } from './navigation-guard'
import { testDefineLoader } from '~/tests/data-loaders'

describe('defineLoader', () => {
  testDefineLoader('Basic', defineBasicLoader, { ssrKeyName: 'key' })
})

// dts testing
function dts(_fn: () => unknown) {}

dts(async () => {
  interface UserData {
    id: string
    name: string
  }

  const useDataLoader = defineBasicLoader(async (route) => {
    const user = {
      id: route.params.id as string,
      name: 'Edu',
    }

    return user
  })

  expectType<{
    data: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useDataLoader())

  // TODO: do we really need to support non-async usage?
  const useWithRef = defineBasicLoader(async (route) => {
    const user = shallowRef<UserData>({
      id: route.params.id as string,
      name: 'Edu',
    })

    return user
  })

  expectType<{
    data: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useWithRef())

  async function loaderUser() {
    const user: UserData = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }

  expectType<{ data: Ref<UserData | undefined> }>(
    defineBasicLoader(loaderUser, { lazy: true })()
  )
  expectType<Promise<UserData>>(defineBasicLoader(loaderUser, { lazy: true })())
  expectType<Promise<UserData>>(defineBasicLoader(loaderUser, {})())
  expectType<{ data: Ref<UserData> }>(defineBasicLoader(loaderUser, {})())
  expectType<{ data: Ref<UserData> }>(
    defineBasicLoader(loaderUser, { lazy: false })()
  )
  expectType<{ data: Ref<UserData> }>(
    defineBasicLoader(loaderUser, { lazy: false })()
  )

  // it should allow returning a Navigation Result without a type error
  expectType<{ data: Ref<UserData> }>(
    defineBasicLoader(
      async () => {
        if (Math.random()) {
          return loaderUser()
        } else {
          return new NavigationResult('/')
        }
      },
      { lazy: false }
    )()
  )
  expectType<Promise<UserData>>(
    defineBasicLoader(
      async () => {
        if (Math.random()) {
          return loaderUser()
        } else {
          return new NavigationResult('/')
        }
      },
      { lazy: false }
    )()
  )
})
