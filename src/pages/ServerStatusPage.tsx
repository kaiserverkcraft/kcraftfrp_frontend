import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { RefreshCw, Server, Activity, Cpu, HardDrive, Trash2, AlertCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { nodeApi } from '../lib/api'
import { isAdmin } from '../lib/auth'

interface PortRange {
  start: number
  end: number
}

interface NodeStatus {
  id: string
  name: string
  address: string
  online: boolean
  cpu_usage: number
  memory_usage: number
  network_in: number
  network_out: number
  total_tunnels: number
  active_tunnels: number
  uptime: number
  traffic_in_24h: number
  traffic_out_24h: number
  last_heartbeat: number
  allow_ports?: PortRange[]
  version?: string
}

export default function ServerStatusPage() {
  const queryClient = useQueryClient()
  const admin = isAdmin()
  const lastUpdate = new Date()

  const { 
    data: nodesData, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['serverStatus'],
    queryFn: nodeApi.getStatus,
    refetchInterval: 30000,
    staleTime: 10000,
    gcTime: 60000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const nodes: NodeStatus[] = (nodesData as any)?.body?.nodes || []
  
  const sortedNodes = [...nodes].sort((a, b) => {
    const nameA = a.name || a.id || ''
    const nameB = b.name || b.id || ''
    return nameA.localeCompare(nameB, 'zh-CN')
  })

  const deleteMutation = useMutation({
    mutationFn: (nodeId: string) => nodeApi.delete(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serverStatus'] })
    },
    onError: (error: any) => {
      alert(`删除节点失败: ${error?.message || '未知错误'}`)
    }
  })

  const handleDelete = (nodeId: string, nodeName: string) => {
    if (!admin) {
      alert('权限不足，只有管理员可以删除节点')
      return
    }
    if (confirm(`确定要删除节点 "${nodeName || nodeId}" 吗？\n\n节点ID: ${nodeId}`)) {
      deleteMutation.mutate(nodeId)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    if (bytes == null || isNaN(bytes)) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
    const index = Math.min(i, sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, index)).toFixed(2)) + ' ' + sizes[index]
  }

  const formatLastUpdate = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getUsageColor = (usage: number): string => {
    if (usage >= 90) return 'text-red-500'
    if (usage >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const totalTrafficIn = sortedNodes.reduce((sum, n) => sum + (n.traffic_in_24h || 0), 0)
  const totalTrafficOut = sortedNodes.reduce((sum, n) => sum + (n.traffic_out_24h || 0), 0)
  const onlineCount = sortedNodes.filter(n => n.online).length
  const totalActiveTunnels = sortedNodes.reduce((sum, n) => sum + (n.active_tunnels || 0), 0)

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">节点状态</h1>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>加载节点数据失败: {(error as any)?.message || '未知错误'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">节点状态</h1>
          <p className="text-sm text-muted-foreground mt-1">
            最后更新: {formatLastUpdate(lastUpdate)}
            {isFetching && <span className="ml-2 text-blue-500">(刷新中...)</span>}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">节点总数</div>
            <div className="text-2xl font-bold">{sortedNodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">在线节点</div>
            <div className="text-2xl font-bold text-green-500">{onlineCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">在线隧道</div>
            <div className="text-2xl font-bold text-blue-500">{totalActiveTunnels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">24h入站流量</div>
            <div className="text-2xl font-bold text-green-600">{formatBytes(totalTrafficIn)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">24h出站流量</div>
            <div className="text-2xl font-bold text-blue-600">{formatBytes(totalTrafficOut)}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : sortedNodes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            暂无节点数据
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedNodes.map((node) => {
            return (
              <Card key={node.id} className={`${node.online ? '' : 'opacity-60 border-gray-300'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-lg">
                      <Server className="mr-2 h-5 w-5" />
                      {node.name || '未命名节点'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={node.online ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                        {node.online ? '在线' : '离线'}
                      </Badge>
                      {admin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(node.id, node.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {admin && <div>节点ID: <code className="bg-muted px-1 rounded text-xs">{node.id}</code></div>}
                    {admin && node.address && <div>地址: {node.address}</div>}
                    {node.version && <div>版本: <code className="bg-muted px-1 rounded text-xs">{node.version}</code></div>}
                    {node.allow_ports && node.allow_ports.length > 0 && (
                      <div>端口范围: {node.allow_ports.map(pr => `${pr.start}-${pr.end}`).join(', ')}</div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {node.online ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                          <Cpu className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <div className="text-xs text-muted-foreground">CPU</div>
                          <div className={`font-semibold ${getUsageColor(node.cpu_usage || 0)}`}>
                            {(node.cpu_usage || 0).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                          <HardDrive className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <div className="text-xs text-muted-foreground">内存</div>
                          <div className={`font-semibold ${getUsageColor(node.memory_usage || 0)}`}>
                            {(node.memory_usage || 0).toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                          <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <div className="text-xs text-muted-foreground">在线隧道</div>
                          <div className="font-semibold">
                            {node.active_tunnels || 0}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950 rounded-lg p-1">
                          <ArrowDownToLine className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">24h入站流量</div>
                            <div className="font-semibold text-green-600 dark:text-green-400">{formatBytes(node.traffic_in_24h || 0)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 rounded-lg p-1">
                          <ArrowUpFromLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">24h出站流量</div>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">{formatBytes(node.traffic_out_24h || 0)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      节点离线
                      {node.last_heartbeat > 0 && (
                        <div className="text-xs mt-1">
                          最后心跳: {new Date(node.last_heartbeat * 1000).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
