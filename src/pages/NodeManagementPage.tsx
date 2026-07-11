import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Badge } from '../components/ui/badge'
import { nodeApi } from '../lib/api'
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react'

interface NodeConfig {
  enable_whitelist: boolean
  whitelist: string[]
}

export default function NodeManagementPage() {
  const queryClient = useQueryClient()
  const [enableWhitelist, setEnableWhitelist] = useState(false)
  const [nodeIds, setNodeIds] = useState<string[]>([])
  const [newNodeId, setNewNodeId] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['node-config'],
    queryFn: nodeApi.getConfig,
  })

  const config: NodeConfig = useMemo(() => {
    const body = (data as any)?.body || {}
    return {
      enable_whitelist: Boolean(body.enable_whitelist),
      whitelist: Array.isArray(body.whitelist) ? body.whitelist : [],
    }
  }, [data])

  useEffect(() => {
    setEnableWhitelist(config.enable_whitelist)
    setNodeIds(config.whitelist)
  }, [config.enable_whitelist, config.whitelist])

  const updateMutation = useMutation({
    mutationFn: (payload: NodeConfig) => nodeApi.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['node-config'] })
    },
  })

  const addNodeId = () => {
    const value = newNodeId.trim()
    if (!value || nodeIds.includes(value)) return
    setNodeIds([...nodeIds, value])
    setNewNodeId('')
  }

  const updateNodeId = (index: number, value: string) => {
    setNodeIds(nodeIds.map((nodeId, i) => (i === index ? value : nodeId)))
  }

  const removeNodeId = (index: number) => {
    setNodeIds(nodeIds.filter((_, i) => i !== index))
  }

  const save = () => {
    const normalized = Array.from(new Set(nodeIds.map(id => id.trim()).filter(Boolean)))
    setNodeIds(normalized)
    updateMutation.mutate({
      enable_whitelist: enableWhitelist,
      whitelist: normalized,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">管理节点</h1>
          <p className="text-sm text-muted-foreground">读取并修改服务端 config.json 中的节点白名单配置</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>白名单设置</CardTitle>
          <CardDescription>开启后，仅白名单中的 node_id 可以作为允许节点使用。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-10">加载中...</div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label>开启白名单</Label>
                  <div className="text-sm text-muted-foreground">
                    当前状态：{enableWhitelist ? '已开启' : '已关闭'}
                  </div>
                </div>
                <Switch checked={enableWhitelist} onCheckedChange={setEnableWhitelist} />
              </div>

              <div className="space-y-3">
                <Label>添加 node_id</Label>
                <div className="flex gap-2">
                  <Input
                    value={newNodeId}
                    onChange={(e) => setNewNodeId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addNodeId()
                    }}
                    placeholder="请输入 node_id"
                  />
                  <Button type="button" onClick={addNodeId}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>node_id 列表</Label>
                  <Badge variant="secondary">{nodeIds.length}</Badge>
                </div>
                {nodeIds.length === 0 ? (
                  <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                    暂无 node_id
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nodeIds.map((nodeId, index) => (
                      <div key={`${nodeId}-${index}`} className="flex gap-2">
                        <Input
                          value={nodeId}
                          onChange={(e) => updateNodeId(index, e.target.value)}
                          placeholder="node_id"
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeNodeId(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? '保存中...' : '保存配置'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
