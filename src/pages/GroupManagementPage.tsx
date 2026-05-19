import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { Plus, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { groupApi, nodeApi } from '../lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

interface Group {
  id: number
  name: string
  description: string
  qos_level: number
  bandwidth: number
  max_tunnels: number
  allowed_nodes: string[]
  created_at: string
}

interface Node {
  id: string
  name: string
  online: boolean
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

const getQoSColor = (level: number) => {
  if (level <= 1) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  if (level <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (level <= 5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

export default function GroupManagementPage() {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [editSelectedNodes, setEditSelectedNodes] = useState<string[]>([])
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    qos_level: 3,
    bandwidth_limit: 15,
    max_tunnels: 10,
  })

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ['groups'],
    queryFn: groupApi.getList,
  })

  const { data: nodesData } = useQuery({
    queryKey: ['nodes'],
    queryFn: nodeApi.getList,
  })

  const groupList: Group[] = (((groups as any)?.body?.groups || []) as Group[]).sort((a, b) => a.id - b.id)
  const nodeList: Node[] = (nodesData as any)?.body?.nodes || []

  const toggleNode = (nodeId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditSelectedNodes(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId]
      )
    } else {
      setSelectedNodes(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId)
          : [...prev, nodeId]
      )
    }
  }

  const toggleAllNodes = (isEdit: boolean = false) => {
    if (isEdit) {
      if (editSelectedNodes.length === nodeList.length) {
        setEditSelectedNodes([])
      } else {
        setEditSelectedNodes(nodeList.map(n => n.id))
      }
    } else {
      if (selectedNodes.length === nodeList.length) {
        setSelectedNodes([])
      } else {
        setSelectedNodes(nodeList.map(n => n.id))
      }
    }
  }

  const createMutation = useMutation({
    mutationFn: () => groupApi.create({
      name: newGroup.name,
      description: newGroup.description,
      qos_level: newGroup.qos_level,
      bandwidth_limit: newGroup.bandwidth_limit,
      max_tunnels: newGroup.max_tunnels,
      allowed_nodes: selectedNodes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setCreateDialogOpen(false)
      setNewGroup({
        name: '',
        description: '',
        qos_level: 3,
        bandwidth_limit: 15,
        max_tunnels: 10,
      })
      setSelectedNodes([])
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => groupApi.update({
      id: editingGroup!.id,
      name: editingGroup!.name,
      description: editingGroup!.description,
      qos_level: editingGroup!.qos_level,
      bandwidth_limit: editingGroup!.bandwidth,
      max_tunnels: editingGroup!.max_tunnels,
      allowed_nodes: editSelectedNodes,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setEditDialogOpen(false)
      setEditingGroup(null)
      setEditSelectedNodes([])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => groupApi.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setEditSelectedNodes(group.allowed_nodes || [])
    setEditDialogOpen(true)
  }

  const getNodeName = (nodeId: string) => {
    const node = nodeList.find(n => n.id === nodeId)
    return node?.name || node?.id || nodeId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户组管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open)
            if (!open) setSelectedNodes([])
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加用户组
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>添加用户组</DialogTitle>
                <DialogDescription>创建新的用户组</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label>名称</Label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="用户组名称"
                  />
                </div>
                <div>
                  <Label>描述</Label>
                  <Input
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="用户组描述"
                  />
                </div>
                <div>
                  <Label>默认QoS级别</Label>
                  <Select
                    value={String(newGroup.qos_level)}
                    onValueChange={(val) => setNewGroup({ ...newGroup, qos_level: parseInt(val) })}
                  >
                    <SelectTrigger>
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
                </div>
                <div>
                  <Label>默认速率限制 (Mbps, 0为不限)</Label>
                  <Input
                    type="number"
                    value={newGroup.bandwidth_limit}
                    onChange={(e) => setNewGroup({ ...newGroup, bandwidth_limit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>隧道数量限制 (0为不限)</Label>
                  <Input
                    type="number"
                    value={newGroup.max_tunnels}
                    onChange={(e) => setNewGroup({ ...newGroup, max_tunnels: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>可用节点</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleAllNodes(false)}
                      className="text-xs"
                    >
                      {selectedNodes.length === nodeList.length ? '取消全选' : '全选'}
                    </Button>
                  </div>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {nodeList.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-2">暂无可用节点</div>
                    ) : (
                      nodeList.map((node) => (
                        <div key={node.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`create-${node.id}`}
                            checked={selectedNodes.includes(node.id)}
                            onCheckedChange={() => toggleNode(node.id, false)}
                          />
                          <label 
                            htmlFor={`create-${node.id}`} 
                            className="text-sm cursor-pointer flex items-center gap-2"
                          >
                            <span>{node.name || node.id}</span>
                            {node.online ? (
                              <span className="text-xs text-green-500">(在线)</span>
                            ) : (
                              <span className="text-xs text-gray-400">(离线)</span>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedNodes.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      已选择 {selectedNodes.length} 个节点
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <TableHead>描述</TableHead>
                  <TableHead>默认QoS</TableHead>
                  <TableHead>速率限制</TableHead>
                  <TableHead>隧道限制</TableHead>
                  <TableHead>可用节点</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupList.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.id}</TableCell>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>
                      <Badge className={getQoSColor(group.qos_level)}>{group.qos_level}</Badge>
                    </TableCell>
                    <TableCell>
                      {group.bandwidth > 0 ? `${group.bandwidth}Mbps` : '不限'}
                    </TableCell>
                    <TableCell>
                      {group.max_tunnels > 0 ? group.max_tunnels : '不限'}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {group.allowed_nodes?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {group.allowed_nodes.slice(0, 3).map(nodeId => (
                              <Badge key={nodeId} variant="outline" className="text-xs">
                                {getNodeName(nodeId)}
                              </Badge>
                            ))}
                            {group.allowed_nodes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.allowed_nodes.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">全部</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(group)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('确定要删除这个用户组吗？')) {
                              deleteMutation.mutate(group.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {groupList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      暂无用户组数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) {
          setEditingGroup(null)
          setEditSelectedNodes([])
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑用户组</DialogTitle>
            <DialogDescription>修改用户组信息</DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label>名称</Label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                />
              </div>
              <div>
                <Label>描述</Label>
                <Input
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                />
              </div>
              <div>
                <Label>默认QoS级别</Label>
                <Select
                  value={String(editingGroup.qos_level)}
                  onValueChange={(val) => setEditingGroup({ ...editingGroup, qos_level: parseInt(val) })}
                >
                  <SelectTrigger>
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
              </div>
              <div>
                <Label>默认速率限制 (Mbps, 0为不限)</Label>
                <Input
                  type="number"
                  value={editingGroup.bandwidth}
                  onChange={(e) => setEditingGroup({ ...editingGroup, bandwidth: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>隧道数量限制 (0为不限)</Label>
                <Input
                  type="number"
                  value={editingGroup.max_tunnels}
                  onChange={(e) => setEditingGroup({ ...editingGroup, max_tunnels: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>可用节点</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleAllNodes(true)}
                    className="text-xs"
                  >
                    {editSelectedNodes.length === nodeList.length ? '取消全选' : '全选'}
                  </Button>
                </div>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {nodeList.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-2">暂无可用节点</div>
                  ) : (
                    nodeList.map((node) => (
                      <div key={node.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-${node.id}`}
                          checked={editSelectedNodes.includes(node.id)}
                          onCheckedChange={() => toggleNode(node.id, true)}
                        />
                        <label 
                          htmlFor={`edit-${node.id}`} 
                          className="text-sm cursor-pointer flex items-center gap-2"
                        >
                          <span>{node.name || node.id}</span>
                          {node.online ? (
                            <span className="text-xs text-green-500">(在线)</span>
                          ) : (
                            <span className="text-xs text-gray-400">(离线)</span>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {editSelectedNodes.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    已选择 {editSelectedNodes.length} 个节点
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
