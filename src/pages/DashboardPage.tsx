import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { tunnelApi, nodeApi, userApi } from '../lib/api'
import { getUser, setUser } from '../lib/auth'
import { Server, Cable, Activity, KeyRound } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(getUser())

  const refreshUserInfo = useCallback(async () => {
    try {
      const res: any = await userApi.getInfo()
      if (res.code === 200 && res.body?.user) {
        const updatedUser = {
          id: res.body.user.id,
          username: res.body.user.username,
          email: res.body.user.email,
          group_id: res.body.user.group_id,
          group: res.body.user.group ? {
            id: res.body.user.group.id,
            name: res.body.user.group.name,
            qos_level: res.body.user.group.qos_level,
            bandwidth: res.body.user.group.bandwidth,
            max_tunnels: res.body.user.group.max_tunnels,
            allowed_nodes: res.body.user.group.allowed_nodes || [],
          } : undefined,
          access_key: res.body.user.access_key,
        }
        setUser(updatedUser)
        setCurrentUser(updatedUser)
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error)
    }
  }, [])

  useEffect(() => {
    refreshUserInfo()
  }, [refreshUserInfo])

  useEffect(() => {
    const handlePermissionUpdate = (e: CustomEvent) => {
      setCurrentUser(e.detail)
    }
    window.addEventListener('user-permission-updated', handlePermissionUpdate as EventListener)
    return () => {
      window.removeEventListener('user-permission-updated', handlePermissionUpdate as EventListener)
    }
  }, [])

  const { data: tunnelsData } = useQuery({
    queryKey: ['tunnels'],
    queryFn: tunnelApi.get,
  })

  const { data: nodesData } = useQuery({
    queryKey: ['nodes'],
    queryFn: nodeApi.getStatus,
  })

  const tunnels = (tunnelsData as any)?.body?.tunnels || []
  const nodes = (nodesData as any)?.body?.nodes || []

  const onlineNodes = nodes.filter((n: any) => n.online).length
  const totalNodes = nodes.length
  
  const activeTunnelsFromNodes = nodes.reduce((sum: number, n: any) => sum + (n.active_tunnels || 0), 0)

  const maxTunnels = currentUser?.group_id === 1 ? 999 : 5
  // 后端有时会返回从0开始的隧道数量（即最大索引），如果提供了 count 字段则把它 +1
  const backendTunnelsCount = (tunnelsData as any)?.body?.count
  const createdTunnels = typeof backendTunnelsCount === 'number' ? backendTunnelsCount + 1 : tunnels.length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">节点数量</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineNodes}/{totalNodes}
            </div>
            <p className="text-xs text-muted-foreground">在线/总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已创建的隧道</CardTitle>
            <Cable className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {createdTunnels}/{maxTunnels === 999 ? '∞' : maxTunnels}
            </div>
            <p className="text-xs text-muted-foreground">已创建/可创建</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃隧道</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeTunnelsFromNodes}</div>
            <p className="text-xs text-muted-foreground">全局活跃</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">访问密钥</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono truncate">
              {currentUser?.access_key?.substring(0, 16)}...
            </div>
            <p className="text-xs text-muted-foreground">用于frpc认证</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>欢迎使用 kcraftfrp</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            kcraftfrp Welcome To Beta Testing! 目前限速15Mbps 商业以及定制节点用户可联系 欢迎反馈各种bug
          </p>
          <div className="mt-4 grid gap-2">
            <p className="text-sm"><strong>当前账户：</strong>{currentUser?.username}</p>
            <p className="text-sm"><strong>用户组：</strong>{currentUser?.group_id === 1 ? '管理员' : '普通用户'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>如需中国内地节点：</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            中国内地节点需要私聊联系管理员开通，其他节点欢迎测试！
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
