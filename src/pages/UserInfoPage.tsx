import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { User, KeyRound, Shield, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { userApi } from '../lib/api'

export default function UserInfoPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  const { data: userData, refetch } = useQuery({
    queryKey: ['userInfo'],
    queryFn: () => userApi.getInfo(),
  })

  const user = (userData as any)?.body?.user

  const passwordMutation = useMutation({
    mutationFn: () => userApi.changePassword({ old_password: oldPassword, new_password: newPassword }),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        setMessage('密码修改成功')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage(data.msg || '密码修改失败')
      }
    },
    onError: () => {
      setMessage('密码修改失败')
    },
  })

  const handlePasswordChange = () => {
    setMessage('')
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('请填写所有字段')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('两次密码输入不一致')
      return
    }
    passwordMutation.mutate()
  }

  const regenerateKeyMutation = useMutation({
    mutationFn: () => userApi.regenerateAccessKey(),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        refetch()
        alert('访问密钥已重新生成')
      } else {
        alert(data.msg || '重新生成失败')
      }
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户信息</h1>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>用户ID</Label>
              <div className="text-lg font-medium">{user?.id}</div>
            </div>
            <div>
              <Label>用户名</Label>
              <div className="text-lg font-medium">{user?.username}</div>
            </div>
            <div>
              <Label>邮箱</Label>
              <div className="text-lg font-medium">{user?.email}</div>
            </div>
            <div>
              <Label>用户组</Label>
              <div>
                <Badge variant="outline">
                  <Shield className="mr-1 h-3 w-3" />
                  {user?.group_id === 1 ? '管理员' : `用户组 ${user?.group_id}`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <KeyRound className="mr-2 h-5 w-5" />
              访问密钥
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>当前密钥</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                  {user?.access_key || '未生成'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (user?.access_key) {
                      navigator.clipboard.writeText(user.access_key)
                      alert('已复制到剪贴板')
                    }
                  }}
                >
                  复制
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('确定要重新生成访问密钥吗？旧密钥将立即失效。')) {
                  regenerateKeyMutation.mutate()
                }
              }}
              disabled={regenerateKeyMutation.isPending}
            >
              {regenerateKeyMutation.isPending ? '生成中...' : '重新生成密钥'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>当前密码</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入当前密码"
              />
            </div>
            <div>
              <Label>新密码</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
              />
            </div>
            <div>
              <Label>确认新密码</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          {message && (
            <div className={message.includes('成功') ? 'text-green-500' : 'text-red-500'}>
              {message}
            </div>
          )}
          <Button onClick={handlePasswordChange} disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? '修改中...' : '修改密码'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
