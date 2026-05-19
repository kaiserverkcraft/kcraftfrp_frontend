import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Search, RefreshCw, Ban, Trash2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { tunnelApi } from '../lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

interface Tunnel {
  id: number
  name: string
  type: string
  local_ip: string
  local_port: number
  remote_port: number
  status: string
  qos_level: number
  bandwidth: number
  is_banned: boolean
  user_id: number
  user?: {
    id: number
    username: string
  }
  node_id: string
  node?: {
    id: string
    name: string
    online: boolean
  }
}

const QOS_LEVELS = [
  { value: 0, label: 'QoS 0 - 最高优先级' },
  { value: 1, label: 'QoS 1 - 高优先级' },
  { value: 2, label: 'QoS 2 - 中高优先级' },
  { value: 3, label: 'QoS 3 - 中等优先级' },
  { value: 4, label: 'QoS 4 - 中低优先级' },
  { value: 5, label: 'QoS 5 - 低优先级' },
  { value: 6, label: 'QoS 6 - 尽力传输' },
  { value: 7, label: 'QoS 7 - 后台传输' },
]

export default function AdminTunnelsPage() {
  const queryClient = useQueryClient()
  const [searchUserId, setSearchUserId] = useState('')
  const [searchNodeId, setSearchNodeId] = useState('')
  const [searchNodeName, setSearchNodeName] = useState('')
  const [searchMode, setSearchMode] = useState<'all' | 'user'>('all')

  const { data: tunnels, isLoading, refetch } = useQuery({
    queryKey: ['allTunnels', searchMode, searchUserId],
    queryFn: searchMode === 'user' && searchUserId 
      ? () => tunnelApi.getByUserID({ user_id: parseInt(searchUserId) }) 
      : tunnelApi.getAllWithUserInfo,
  })

  const qosMutation = useMutation({
    mutationFn: ({ tunnelId, qosLevel }: { tunnelId: number; qosLevel: number }) => 
      tunnelApi.updateQoS({ tunnel_id: tunnelId, qos_level: qosLevel }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTunnels'] })
    },
  })

  const banMutation = useMutation({
    mutationFn: ({ tunnelId, isBanned }: { tunnelId: number; isBanned: boolean }) =>
      tunnelApi.updateBan({ tunnel_id: tunnelId, is_banned: isBanned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTunnels'] })
    },
  })

  const bandwidthMutation = useMutation({
    mutationFn: ({ tunnelId, bandwidth }: { tunnelId: number; bandwidth: number }) =>
      tunnelApi.updateBandwidth({ tunnel_id: tunnelId, bandwidth_limit: bandwidth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTunnels'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tunnelId: number) => tunnelApi.delete({ id: tunnelId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTunnels'] })
    },
  })

  const rawTunnelList: Tunnel[] = (tunnels as any)?.body?.tunnels || []

  const tunnelList = useMemo(() => {
    let filtered = rawTunnelList

    if (searchNodeId) {
      filtered = filtered.filter(t =>
        t.node_id?.toLowerCase().includes(searchNodeId.toLowerCase())
      )
    }

    if (searchNodeName) {
      filtered = filtered.filter(t =>
        t.node?.name?.toLowerCase().includes(searchNodeName.toLowerCase())
      )
    }

    return filtered.sort((a, b) => a.id - b.id)
  }, [rawTunnelList, searchNodeId, searchNodeName])

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      tcp: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      udp: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    }
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const handleSearch = () => {
    if (searchUserId) {
      setSearchMode('user')
    } else {
      setSearchMode('all')
    }
    refetch()
  }

  const handleReset = () => {
    setSearchUserId('')
    setSearchNodeId('')
    setSearchNodeName('')
    setSearchMode('all')
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">隧道管理</h1>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选隧道</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户UID</label>
              <Input
                placeholder="输入用户UID"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">节点ID</label>
              <Input
                placeholder="输入节点ID"
                value={searchNodeId}
                onChange={(e) => setSearchNodeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">节点名称</label>
              <Input
                placeholder="输入节点名称"
                value={searchNodeName}
                onChange={(e) => setSearchNodeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  搜索
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  重置
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-10">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>所属用户</TableHead>
                    <TableHead>所属节点</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>本地地址</TableHead>
                    <TableHead>远程端口</TableHead>
                    <TableHead>QoS级别</TableHead>
                    <TableHead>速率限制</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tunnelList.map((tunnel) => (
                    <TableRow key={tunnel.id} className={tunnel.is_banned ? 'bg-red-500/10 text-gray-400 dark:text-gray-500' : ''}>
                      <TableCell>{tunnel.id}</TableCell>
                      <TableCell className="font-medium">{tunnel.name}</TableCell>
                      <TableCell>
                        {tunnel.user ? (
                          <span>{tunnel.user.username} (UID: {tunnel.user.id})</span>
                        ) : (
                          <span className="text-muted-foreground">未知用户</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tunnel.node ? (
                          <div className="flex items-center gap-2">
                            <span>{tunnel.node.name}</span>
                            <Badge className={tunnel.node.online ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}>
                              {tunnel.node.online ? '在线' : '离线'}
                            </Badge>
                          </div>
                        ) : tunnel.node_id ? (
                          <span className="text-muted-foreground text-xs">{tunnel.node_id}</span>
                        ) : (
                          <span className="text-muted-foreground">未分配</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadge(tunnel.type)}>{tunnel.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{tunnel.local_ip}:{tunnel.local_port}</TableCell>
                      <TableCell>{tunnel.remote_port}</TableCell>
                      <TableCell>
                        <Select
                          value={String(tunnel.qos_level || 0)}
                          onValueChange={(val) => qosMutation.mutate({ tunnelId: tunnel.id, qosLevel: parseInt(val) })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QOS_LEVELS.map(qos => (
                              <SelectItem key={qos.value} value={String(qos.value)}>
                                {qos.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-20"
                            value={tunnel.bandwidth || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              bandwidthMutation.mutate({ tunnelId: tunnel.id, bandwidth: val })
                            }}
                            placeholder="Mbps"
                          />
                          <span className="text-xs text-muted-foreground">Mbps</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => banMutation.mutate({ tunnelId: tunnel.id, isBanned: !tunnel.is_banned })}
                            title={tunnel.is_banned ? '解封' : '封禁'}
                          >
                            <Ban className={`h-4 w-4 ${tunnel.is_banned ? 'text-green-500' : 'text-red-500'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('确定要删除这个隧道吗？删除后将无法恢复。')) {
                                deleteMutation.mutate(tunnel.id)
                              }
                            }}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tunnelList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                        暂无隧道数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
