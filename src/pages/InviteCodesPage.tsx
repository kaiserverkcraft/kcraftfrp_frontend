import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inviteCodeApi } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Plus, Trash2, Copy, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'

interface InviteCode {
  id: number
  code: string
  max_uses: number
  used_count: number
  expire_days: number
  expires_at: string
  group_id: number
  created_by: number
  is_active: boolean
  created_at: string
}

interface InviteSetting {
  enabled: boolean
  default_group_id: number
  default_max_uses: number
  default_expire_days: number
}

export default function InviteCodesPage() {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [newCode, setNewCode] = useState({ code: '', max_uses: 1, expire_days: 30, group_id: 2 })
  const [batchCount, setBatchCount] = useState(5)
  const [batchMaxUses, setBatchMaxUses] = useState(1)
  const [batchExpireDays, setBatchExpireDays] = useState(30)

  const { data: codesData, isLoading: codesLoading, refetch } = useQuery({
    queryKey: ['inviteCodes'],
    queryFn: inviteCodeApi.getList,
  })

  const { data: settingData } = useQuery({
    queryKey: ['inviteSetting'],
    queryFn: inviteCodeApi.getSetting,
  })

  const codes: InviteCode[] = (codesData as any)?.body?.invite_codes || []
  const setting: InviteSetting = (settingData as any)?.body?.setting || {
    enabled: false,
    default_group_id: 2,
    default_max_uses: 1,
    default_expire_days: 30,
  }

  const createMutation = useMutation({
    mutationFn: () => inviteCodeApi.create(newCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] })
      setCreateDialogOpen(false)
      setNewCode({ code: '', max_uses: 1, expire_days: 30, group_id: 2 })
    },
  })

  const batchCreateMutation = useMutation({
    mutationFn: async () => {
      const promises = []
      for (let i = 0; i < batchCount; i++) {
        promises.push(inviteCodeApi.create({
          max_uses: batchMaxUses,
          expire_days: batchExpireDays,
          group_id: setting.default_group_id,
        }))
      }
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] })
      setBatchDialogOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => inviteCodeApi.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] })
    },
  })

  const settingMutation = useMutation({
    mutationFn: (newSetting: InviteSetting) => inviteCodeApi.updateSetting(newSetting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteSetting'] })
    },
  })

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewCode({ ...newCode, code })
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  const isExpired = (code: InviteCode) => {
    if (!code.expires_at) return false
    return new Date(code.expires_at) < new Date()
  }

  const getCodeStatus = (code: InviteCode) => {
    if (!code.is_active) return { text: '已禁用', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' }
    if (isExpired(code)) return { text: '已过期', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    if (code.max_uses > 0 && code.used_count >= code.max_uses) return { text: '已用完', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    return { text: '可用', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  }

  if (codesLoading) {
    return <div className="text-center py-10">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">邀请码管理</h1>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            邀请码设置
            <Switch
              checked={setting.enabled || false}
              onCheckedChange={(checked) => settingMutation.mutate({ ...setting, enabled: checked })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>默认使用次数</Label>
              <Input
                type="number"
                value={setting.default_max_uses || 1}
                onChange={(e) => settingMutation.mutate({ ...setting, default_max_uses: parseInt(e.target.value) || 1 })}
                disabled={!setting.enabled}
              />
            </div>
            <div>
              <Label>默认有效天数</Label>
              <Input
                type="number"
                value={setting.default_expire_days || 30}
                onChange={(e) => settingMutation.mutate({ ...setting, default_expire_days: parseInt(e.target.value) || 30 })}
                disabled={!setting.enabled}
              />
            </div>
            <div>
              <Label>默认用户组ID</Label>
              <Input
                type="number"
                value={setting.default_group_id || 2}
                onChange={(e) => settingMutation.mutate({ ...setting, default_group_id: parseInt(e.target.value) || 2 })}
                disabled={!setting.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>邀请码列表</CardTitle>
            <div className="flex gap-2">
              <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    批量生成
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>批量生成邀请码</DialogTitle>
                    <DialogDescription>一次性生成多个邀请码</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>生成数量</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={batchCount}
                        onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>每个邀请码最大使用次数（0为不限）</Label>
                      <Input
                        type="number"
                        value={batchMaxUses}
                        onChange={(e) => setBatchMaxUses(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>有效天数（0为永不过期）</Label>
                      <Input
                        type="number"
                        value={batchExpireDays}
                        onChange={(e) => setBatchExpireDays(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>取消</Button>
                    <Button onClick={() => batchCreateMutation.mutate()} disabled={batchCreateMutation.isPending}>
                      {batchCreateMutation.isPending ? '生成中...' : '生成'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    创建邀请码
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建邀请码</DialogTitle>
                    <DialogDescription>创建单个邀请码，可自定义或自动生成</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>邀请码（留空自动生成）</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newCode.code}
                          onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                          placeholder="留空自动生成随机码"
                        />
                        <Button variant="outline" onClick={generateRandomCode}>随机</Button>
                      </div>
                    </div>
                    <div>
                      <Label>最大使用次数（0为不限）</Label>
                      <Input
                        type="number"
                        value={newCode.max_uses}
                        onChange={(e) => setNewCode({ ...newCode, max_uses: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>有效天数（0为永不过期）</Label>
                      <Input
                        type="number"
                        value={newCode.expire_days}
                        onChange={(e) => setNewCode({ ...newCode, expire_days: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>注册后用户组ID</Label>
                      <Input
                        type="number"
                        value={newCode.group_id}
                        onChange={(e) => setNewCode({ ...newCode, group_id: parseInt(e.target.value) || 2 })}
                      />
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
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {codes.map((code) => {
              const status = getCodeStatus(code)
              return (
                <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <code className="px-2 py-1 bg-muted rounded font-mono">{code.code}</code>
                    <span className="text-sm text-muted-foreground">
                      {code.used_count}/{code.max_uses > 0 ? code.max_uses : '∞'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                      {status.text}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {code.expires_at ? `过期: ${formatDate(code.expires_at)}` : '永不过期'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('确定要删除这个邀请码吗？')) {
                          deleteMutation.mutate(code.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )
            })}
            {codes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">暂无邀请码</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
