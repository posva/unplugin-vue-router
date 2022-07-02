export const MODULE_VUE_ROUTER = '@vue-router'
// the path is used by the user and having slashes is just more natural
export const MODULE_ROUTES_PATH = `${MODULE_VUE_ROUTER}/routes`

export const VIRTUAL_PREFIX = 'virtual:'

export const MODULES_ID_LIST = [MODULE_VUE_ROUTER, MODULE_ROUTES_PATH]

export function getVirtualId(id: string) {
  return id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : null
}

export function asVirtualId(id: string) {
  return VIRTUAL_PREFIX + id
}
