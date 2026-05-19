const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    const verify = localStorage.getItem(key)
    if (verify !== value) {
      localStorage.removeItem(key)
      return false
    }
    return true
  } catch {
    return false
  }
}

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
  }
}

export interface Group {
  id: number
  name: string
  qos_level: number
  bandwidth: number
  max_tunnels: number
  allowed_nodes: string[]
}

export interface User {
  id: number
  username: string
  email: string
  group_id: number
  group?: Group
  access_key?: string
  proxy_protocol?: string
  use_encryption?: boolean
  use_compression?: boolean
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return safeGetItem(TOKEN_KEY)
}

export const setToken = (token: string) => {
  if (typeof window === 'undefined') return
  safeSetItem(TOKEN_KEY, token)
}

export const removeToken = () => {
  if (typeof window === 'undefined') return
  safeRemoveItem(TOKEN_KEY)
}

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const raw = safeGetItem(USER_KEY)
  if (!raw) return null
  try {
    const wrapper = JSON.parse(raw)
    if (wrapper._v === 1 && wrapper._data) {
      return wrapper._data as User
    }
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const setUser = (user: User) => {
  if (typeof window === 'undefined') return
  const wrapper = { _v: 1, _data: user }
  const json = JSON.stringify(wrapper)
  if (!safeSetItem(USER_KEY, json)) {
    safeSetItem(USER_KEY + '_backup', json)
  }
}

export const removeUser = () => {
  if (typeof window === 'undefined') return
  safeRemoveItem(USER_KEY)
  safeRemoveItem(USER_KEY + '_backup')
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}

export const isAdmin = (): boolean => {
  const user = getUser()
  return user?.group_id === 1
}

export const logout = () => {
  removeToken()
  removeUser()
}

export const setAuth = (token: string, user: User) => {
  setToken(token)
  setUser(user)
}
