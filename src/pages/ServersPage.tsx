import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { RefreshCw, Plus, Settings, FileText, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'

interface Server {
  id: string
  name: string
  status: string
  version: string
  address: string
  bind_port: number
  is_connected: boolean
}

export default function ServersPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const res = await fetch('/api/servers')
      return res.json()
    },
  })

  const servers: Server[] = (data as any)?.body?.servers || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default">在线</Badge>
      case 'offline':
        return <Badge variant="destructive">离线</Badge>
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">服务端管理</h1>
          <p className="text-muted-foreground">管理 FRP 服务端</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建服务端
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-10">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>绑定端口</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-mono text-sm">{server.id}</TableCell>
                    <TableCell>{server.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(server.status)}</TableCell>
                    <TableCell>{server.version || '-'}</TableCell>
                    <TableCell>{server.address || '-'}</TableCell>
                    <TableCell>{server.bind_port || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" title="配置">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="日志">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="删除">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {servers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      暂无服务端数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
