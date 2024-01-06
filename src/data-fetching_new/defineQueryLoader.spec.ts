/**
 * @vitest-environment happy-dom
 */
import { Ref, shallowRef } from 'vue'
import { defineQueryLoader } from './defineQueryLoader'
import { expectType } from 'ts-expect'
import { describe } from 'vitest'
import { NavigationResult } from './navigation-guard'
import { testDefineLoader } from '../../tests/data-loaders'

describe.skip('defineQueryLoader', () => {
  testDefineLoader('Basic', defineQueryLoader, { ssrKeyName: 'key' })
})

// dts testing
function dts(_fn: () => unknown) {}

dts(async () => {
  interface UserData {
    id: string
    name: string
  }

  const useDataLoader = defineQueryLoader(async (route) => {
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
  const useWithRef = defineQueryLoader(async (route) => {
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
    defineQueryLoader(loaderUser, { lazy: true })()
  )
  expectType<Promise<UserData>>(defineQueryLoader(loaderUser, { lazy: true })())
  expectType<Promise<UserData>>(defineQueryLoader(loaderUser, {})())
  expectType<{ data: Ref<UserData> }>(defineQueryLoader(loaderUser, {})())
  expectType<{ data: Ref<UserData> }>(
    defineQueryLoader(loaderUser, { lazy: false })()
  )
  expectType<{ data: Ref<UserData> }>(
    defineQueryLoader(loaderUser, { lazy: false })()
  )

  // it should allow returning a Navigation Result without a type error
  expectType<{ data: Ref<UserData> }>(
    defineQueryLoader(
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
    defineQueryLoader(
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
