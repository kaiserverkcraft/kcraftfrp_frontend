import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Plus, RefreshCw, Edit, Trash2, KeyRound, Ban } from 'lucide-react'
import { useState } from 'react'
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
import { getToken } from '../lib/auth'
import { getApiBaseUrl } from '../lib/config'

interface User {
  id: number
  username: string
  email: string
  group_id: number
  group?: {
    id: number
    name: string
  }
  access_key: string
  is_banned: boolean
  created_at: string
}

interface Group {
  id: number
  name: string
}

export default function UserManagementPage() {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    group_id: 2,
  })

  const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch(`${getApiBaseUrl()}/user/list`, {
      headers: apiHeaders,
    }).then(r => r.json()),
  })

  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetch(`${getApiBaseUrl()}/group/list`, {
      headers: apiHeaders,
    }).then(r => r.json()),
  })

  const users: User[] = (((usersData as any)?.body?.users || []) as User[]).sort((a, b) => a.id - b.id)
  const groups: Group[] = (((groupsData as any)?.body?.groups || []) as Group[]).sort((a, b) => a.id - b.id)

  const createMutation = useMutation({
    mutationFn: () => fetch(`${getApiBaseUrl()}/user/create`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(newUser),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setCreateDialogOpen(false)
        setNewUser({ username: '', email: '', password: '', group_id: 2 })
      } else {
        alert(data.msg || '创建失败')
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => fetch(`${getApiBaseUrl()}/user/${editingUser!.id}`, {
      method: 'PUT',
      headers: apiHeaders,
      body: JSON.stringify({
        username: editingUser!.username,
        email: editingUser!.email,
        group_id: editingUser!.group_id,
      }),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setEditDialogOpen(false)
        setEditingUser(null)
      } else {
        alert(data.msg || '更新失败')
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`${getApiBaseUrl()}/user/${id}`, {
      method: 'DELETE',
      headers: apiHeaders,
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } else {
        alert(data.msg || '删除失败')
      }
    },
  })

  const banMutation = useMutation({
    mutationFn: (user: User) => fetch(`${getApiBaseUrl()}/user/ban`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ user_id: user.id, is_banned: !user.is_banned }),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } else {
        alert(data.msg || '操作失败')
      }
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: () => fetch(`${getApiBaseUrl()}/user/reset-password`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ user_id: resetPasswordUser!.id, new_password: newPassword }),
    }).then(r => r.json()),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setResetPasswordDialogOpen(false)
        setResetPasswordUser(null)
        setNewPassword('')
        alert('密码重置成功')
      } else {
        alert(data.msg || '重置失败')
      }
    },
  })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user)
    setResetPasswordDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加用户
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加用户</DialogTitle>
                <DialogDescription>创建新的用户账号</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>用户名</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="请输入用户名"
                  />
                </div>
                <div>
                  <Label>邮箱</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                </div>
                <div>
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="请输入密码"
                  />
                </div>
                <div>
                  <Label>用户组</Label>
                  <Select
                    value={String(newUser.group_id)}
                    onValueChange={(val) => setNewUser({ ...newUser, group_id: parseInt(val) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={String(group.id)}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>用户组</TableHead>
                  <TableHead>访问密钥</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={user.is_banned ? 'bg-red-500/10 text-gray-400 dark:text-gray-500' : ''}
                  >
                    <TableCell>{user.id}</TableCell>
                    <TableCell className={user.is_banned ? 'line-through opacity-70' : ''}>
                      {user.username}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={user.is_banned ? 'border-gray-500/30' : ''}>
                        {user.group?.name || `组${user.group_id}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                        {user.access_key?.substring(0, 16)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          user.is_banned 
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-none' 
                            : 'bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-none'
                        }
                      >
                        {user.is_banned ? '已封禁' : '正常'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} title="编辑">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user)} title="重置密码">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => banMutation.mutate(user)}
                          title={user.is_banned ? '解封' : '封禁'}
                        >
                          {/* 修改点 3：解封按钮的图标颜色调整，保持视觉一致性 */}
                          <Ban className={`h-4 w-4 ${user.is_banned ? 'text-green-500/70' : 'text-red-500'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('确定要删除这个用户吗？')) {
                              deleteMutation.mutate(user.id)
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
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 编辑用户对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label>用户名</Label>
                <Input
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                />
              </div>
              <div>
                <Label>邮箱</Label>
                <Input
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label>用户组</Label>
                <Select
                  value={String(editingUser.group_id)}
                  onValueChange={(val) => setEditingUser({ ...editingUser, group_id: parseInt(val) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* 重置密码对话框 */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>为用户 {resetPasswordUser?.username} 设置新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>新密码</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>取消</Button>
            <Button onClick={() => resetPasswordMutation.mutate()} disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? '重置中...' : '重置密码'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
