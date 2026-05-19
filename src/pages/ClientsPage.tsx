import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { RefreshCw, Plus, Settings, Terminal, FileText, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'

interface Client {
  id: string
  name: string
  status: string
  version: string
  platform: string
  address: string
  connect_time: string
  is_connected: boolean
}

export default function ClientsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      return res.json()
    },
  })

  const clients: Client[] = (data as any)?.body?.clients || []

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
          <h1 className="text-2xl font-bold">客户端管理</h1>
          <p className="text-muted-foreground">管理 FRP 客户端</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建客户端
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
                  <TableHead>平台</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>连接时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm">{client.id}</TableCell>
                    <TableCell>{client.name || '-'}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>{client.version || '-'}</TableCell>
                    <TableCell>{client.platform || '-'}</TableCell>
                    <TableCell>{client.address || '-'}</TableCell>
                    <TableCell>{client.connect_time || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" title="配置">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="终端">
                          <Terminal className="h-4 w-4" />
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
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      暂无客户端数据
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
