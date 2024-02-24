export const typedRouterFile = `
declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>
    '/users': RouteRecordInfo<
      '/users',
      '/users',
      Record<never, never>,
      Record<never, never>
    >
    '/users/[id]': RouteRecordInfo<
      '/users/[id]',
      '/users/:id',
      { id: ParamValue<true> },
      { id: ParamValue<false> }
    >
    '/users/[id]/edit': RouteRecordInfo<
      '/users/[id]/edit',
      '/users/:id/edit',
      { id: ParamValue<true> },
      { id: ParamValue<false> }
    >
  }
}
`
export const apiIndexFile = `
export interface User {
  id: number
  name: string
  photoURL: string
}

export async function getUserById(id: string | number) {
  return {} as User
}
export async function getUserList() {
  return [] as User[]
}

export async function getCommonFriends(userAId: string | number, userBId: string | number) {
  return [] as User[]
}

export async function getCurrentUser() {
  return {} as User
}

export async function getFriends(id: string | number) {
  return [] as User[]
}
`
export const usersLoaderFile = `
${apiIndexFile}
import { defineBasicLoader } from 'unplugin-vue-router/data-loaders/basic'

export const useUserData = defineBasicLoader((route) => getUserById(route.params.id as string))
export const useUserList = defineBasicLoader(() => getUserList())

export { User, getUserById, getUserList }
`

export const vueShimFile = `
declare module '*.vue' {
  import { defineComponent } from 'vue'
  export default defineComponent({})
}
`
