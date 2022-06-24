export const MODULE_VUE_ROUTER = '@vue-router'
// the id is used internally and cannot contain slashes
export const MODULE_ROUTES_ID = `${MODULE_VUE_ROUTER}~routes`
// the path is used by the user and having slashes is just more natural
export const MODULE_ROUTES_PATH = `${MODULE_VUE_ROUTER}/routes`

export const VIRTUAL_PREFIX = 'virtual:'

export const MODULES_ID_LIST = [MODULE_VUE_ROUTER, MODULE_ROUTES_PATH]
