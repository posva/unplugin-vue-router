import { useRoute } from '@vue-router'
import { Ref, shallowRef } from 'vue'
import { defineLoader } from './defineLoader'
import { expectType } from 'ts-expect'

function dts(_fn: () => any) {}

dts(async () => {
  const route = useRoute()

  interface UserData {
    id: string
    name: string
  }

  const useDataLoader = defineLoader(async (route) => {
    const user = {
      id: route.params.id as string,
      name: 'Edu',
    }

    return { user }
  })

  expectType<{ user: UserData }>(await useDataLoader._loader(route))

  const { user, error, pending } = useDataLoader()

  expectType<{
    user: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useDataLoader())

  const useWithRef = defineLoader(async (route) => {
    const user = shallowRef({
      id: route.params.id as string,
      name: 'Edu',
    })

    return { user }
  })

  expectType<{
    user: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useWithRef())
})
