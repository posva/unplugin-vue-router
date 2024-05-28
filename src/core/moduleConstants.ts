export const MODULE_VUE_ROUTER = 'vue-router/auto'
// vue-router/auto/routes was more natural but didn't work well with TS
export const MODULE_ROUTES_PATH = `${MODULE_VUE_ROUTER}-routes`

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

export const VIRTUAL_PREFIX = 'virtual:'

// allows removing the route block from the code
export const ROUTE_BLOCK_ID = `${VIRTUAL_PREFIX}/vue-router/auto/route-block`

export const MODULES_ID_LIST = [MODULE_VUE_ROUTER, MODULE_ROUTES_PATH]

export function getVirtualId(id: string) {
  return id.startsWith(VIRTUAL_PREFIX) ? id.slice(VIRTUAL_PREFIX.length) : null
}

export const routeBlockQueryRE = /\?vue&type=route/

export function asVirtualId(id: string) {
  return VIRTUAL_PREFIX + id
}
