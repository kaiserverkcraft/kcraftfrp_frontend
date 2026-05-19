import axios from 'axios'
import { getToken, getUser, setUser } from './auth'
import { getApiBaseUrl } from './config'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const apiBaseUrl = getApiBaseUrl()
  if (apiBaseUrl && apiBaseUrl !== '/api') {
    config.baseURL = apiBaseUrl
  }
  
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    } else if (error.response?.status === 403) {
      try {
        const user = getUser()
        if (user) {
          const res = await axios.post(
            error.config?.baseURL || '/api' + '/user/get',
            {},
            { headers: { Authorization: `Bearer ${getToken()}` } }
          )
          if (res.data?.code === 200 && res.data?.body?.user) {
            const updatedUser = {
              id: res.data.body.user.id,
              username: res.data.body.user.username,
              email: res.data.body.user.email,
              group_id: res.data.body.user.group_id,
              group: res.data.body.user.group ? {
                id: res.data.body.user.group.id,
                name: res.data.body.user.group.name,
                qos_level: res.data.body.user.group.qos_level,
                bandwidth: res.data.body.user.group.bandwidth,
                max_tunnels: res.data.body.user.group.max_tunnels,
                allowed_nodes: res.data.body.user.group.allowed_nodes || [],
              } : undefined,
              access_key: res.data.body.user.access_key,
            }
            setUser(updatedUser)
            window.dispatchEvent(new CustomEvent('user-permission-updated', { detail: updatedUser }))
          }
        }
      } catch (e) {
        console.error('Failed to refresh user info on 403:', e)
      }
    }
    return Promise.reject(error)
  }
)

export const userApi = {
  login: (data: { username: string; password: string; captcha_id?: string; captcha_code?: string }) =>
    api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string; invite_code?: string }) =>
    api.post('/auth/register', data),
  getInfo: () => api.post('/user/get', {}),
  changePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/user/update', data),
  updateTransport: (data: { proxy_protocol?: string; use_encryption?: boolean; use_compression?: boolean }) =>
    api.post('/user/update', data),
  regenerateAccessKey: () => api.post('/user/regenerate-key', {}),
  getFrpcConfig: (nodeId?: string) => api.post('/user/frpc-config', { node_id: nodeId }),
}

export const tunnelApi = {
  get: () => api.get('/tunnel/list'),
  create: (data: { 
    name: string
    type: string
    local_ip: string
    local_port: number
    remote_port: number
    node_id: string
  }) => api.post('/tunnel/create', data),
  update: (data: { 
    id: number
    name: string
    local_ip: string
    local_port: number
    remote_port: number
  }) => api.put(`/tunnel/${data.id}`, data),
  delete: (data: { id: number }) => api.delete(`/tunnel/${data.id}`),
  start: (data: { id: number }) => api.post('/proxy/start_proxy', { proxy_id: data.id }),
  stop: (data: { id: number }) => api.post('/proxy/stop_proxy', { proxy_id: data.id }),
  getByUserID: (data: { user_id: number }) => api.post('/tunnel/by-user', data),
  getAllWithUserInfo: () => api.get('/tunnel/all/detail'),
  updateQoS: (data: { tunnel_id: number; qos_level: number }) =>
    api.post('/tunnel/update-qos', data),
  updateBan: (data: { tunnel_id: number; is_banned: boolean }) =>
    api.post('/tunnel/update-ban', data),
  updateBandwidth: (data: { tunnel_id: number; bandwidth_limit: number }) =>
    api.post('/tunnel/update-bandwidth', data),
}

export const nodeApi = {
  getList: () => api.get('/node/list'),
  getStatus: () => api.get('/nodes/'),
  delete: (nodeId: string) => api.delete(`/nodes/${nodeId}`),
}

export const statsApi = {
  get: () => api.get('/platform/baseinfo'),
}

export const inviteCodeApi = {
  getList: () => api.get('/invite-code/list'),
  create: (data: { code?: string; max_uses?: number; expire_days?: number; group_id?: number }) =>
    api.post('/invite-code/create', data),
  delete: (data: { id: number }) => api.post('/invite-code/delete', data),
  getSetting: () => api.get('/invite-code/setting'),
  updateSetting: (data: { enabled: boolean; default_group_id: number; default_max_uses: number; default_expire_days: number }) =>
    api.post('/invite-code/setting', data),
}

export const groupApi = {
  getList: () => api.get('/group/list'),
  create: (data: { name: string; description: string; qos_level: number; bandwidth_limit: number; max_tunnels: number; allowed_nodes: string[] }) =>
    api.post('/group/create', data),
  update: (data: { id: number; name: string; description: string; qos_level: number; bandwidth_limit: number; max_tunnels: number; allowed_nodes: string[] }) =>
    api.put(`/group/${data.id}`, data),
  delete: (data: { id: number }) => api.delete(`/group/${data.id}`),
}

export default api
