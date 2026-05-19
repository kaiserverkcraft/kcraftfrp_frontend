import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Server, RefreshCw, Eye, Trash2 } from 'lucide-react'
import { nodeApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../lib/auth'

interface Node {
  id: string
  name: string
  address: string
  online: boolean
  cpu_usage: number
  memory_usage: number
  total_tunnels: number
  active_tunnels: number
}

export default function NodesPage() {
  const navigate = useNavigate()
  const admin = isAdmin()
  const { data: nodesData, isLoading, refetch } = useQuery({
    queryKey: ['nodes'],
    queryFn: nodeApi.getList,
    refetchInterval: 30000,
  })

  const nodes: Node[] = (((nodesData as any)?.body?.nodes || []) as Node[]).sort((a, b) => (a.id || '').localeCompare(b.id || ''))

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('确定要删除此节点吗？')) return
    try {
      await nodeApi.delete(nodeId)
      refetch()
    } catch (error) {
      console.error('删除节点失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">节点列表</h1>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">加载中...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node) => (
            <Card key={node.id} className={node.online ? 'border-green-500 dark:border-green-600' : 'border-red-500 dark:border-red-600 opacity-70'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Server className="mr-2 h-4 w-4" />
                  {node.name || (admin ? node.id : '未命名节点')}
                </CardTitle>
                <span className={`px-2 py-1 rounded text-xs ${node.online ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                  {node.online ? '在线' : '离线'}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {node.address || '未知地址'}
                  </div>

                  {admin && (
                    <div className="text-xs text-muted-foreground font-mono">
                      ID: {node.id}
                    </div>
                  )}

                  {node.online && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>CPU使用率</span>
                        <span>{node.cpu_usage?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>内存使用率</span>
                        <span>{node.memory_usage?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>活跃隧道</span>
                        <span>{node.active_tunnels || 0}/{node.total_tunnels || 0}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/admin-tunnels?node=${node.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      查看隧道
                    </Button>
                    {admin && (
                      <Button
                        onClick={() => handleDeleteNode(node.id)}
                        variant="destructive"
                        size="icon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {nodes.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              暂无节点数据
            </div>
          )}
        </div>
      )}
    </div>
  )
}
