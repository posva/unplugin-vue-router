export const MODULE_VUE_ROUTER_AUTO = 'vue-router/auto'
// vue-router/auto/routes was more natural but didn't work well with TS
export const MODULE_ROUTES_PATH = `${MODULE_VUE_ROUTER_AUTO}-routes`

// NOTE: not sure if needed. Used for HMR the virtual routes
let time = Date.now()
/**
 * Last time the routes were loaded from MODULE_ROUTES_PATH
 */
export const ROUTES_LAST_LOAD_TIME = {
  get value() {
    return time
  },
  update(when = Date.now()) {
    time = when
  },
}

// using \0 like recommended in docs makes the module not be parsed by vite
// and all of its imports are never refreshed
// having /__ makes the file go through import analysis and adds timestamps to the imports
export const VIRTUAL_PREFIX = '/__'

// allows removing the route block from the code
export const ROUTE_BLOCK_ID = `${VIRTUAL_PREFIX}/vue-router/auto/route-block`

export const MODULES_ID_LIST = [MODULE_VUE_ROUTER_AUTO, MODULE_ROUTES_PATH]

export function getVirtualId(id: string) {
  return id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : null
}

export const routeBlockQueryRE = /\?vue&type=route/

export function asVirtualId(id: string) {
  return VIRTUAL_PREFIX + id
}
