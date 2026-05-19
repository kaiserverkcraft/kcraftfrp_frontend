import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { TbBuildingTunnel } from 'react-icons/tb'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { userApi } from '../lib/api'
import { setAuth } from '../lib/auth'
import { getApiBaseUrl } from '../lib/config'

interface CaptchaData {
  captcha_id: string
  captcha_img: string
}

type AuthMode = 'login' | 'register'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null)
  const [captchaInput, setCaptchaInput] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const bottomInfo = 'pixiv PID: 135839784'

  const from = (location.state as any)?.from?.pathname || '/app/dashboard'

  useEffect(() => {
    fetchCaptchaRequired()
  }, [])

  const fetchCaptchaRequired = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/captcha/check`)
      const data = await response.json()
      if (data.code === 200 && data.body?.captcha_required) {
        setShowCaptcha(true)
        fetchCaptcha()
      }
    } catch {
    }
  }

  const fetchCaptcha = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/captcha`)
      const data = await response.json()
      if (data.code === 200 && data.body) {
        setCaptchaData(data.body)
        setCaptchaInput('')
      }
    } catch {
      setError('获取验证码失败')
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
  }

  const loginMutation = useMutation({
    mutationFn: async () => {
      const loginData: any = { username, password }
      if (showCaptcha && captchaData) {
        loginData.captcha_id = captchaData.captcha_id
        loginData.captcha_code = captchaInput
      }
      return userApi.login(loginData)
    },
    onSuccess: (data: any) => {
      if (data.code === 200 && data.body?.token) {
        setAuth(data.body.token, data.body.user)
        navigate(from, { replace: true })
      } else {
        if (data.body?.captcha_required) {
          setShowCaptcha(true)
          fetchCaptcha()
        }
        
        if (data.code === 403 && data.msg?.includes('封禁')) {
          setError('账户已被封禁，请联系管理员')
        } else {
          setError(data.msg || '用户名或密码错误')
        }
      }
    },
    onError: (err: Error) => {
      if (showCaptcha) {
        fetchCaptcha()
      }
      setError(err.message || '登录失败，请检查网络连接')
    },
  })

  const registerMutation = useMutation({
    mutationFn: () => userApi.register({ username, email, password, invite_code: inviteCode }),
    onSuccess: (data: any) => {
      if (data.code === 200) {
        setError('')
        setMode('login')
        alert('注册成功，请登录')
      } else {
        setError(data.msg || '注册失败')
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.msg
      if (msg) {
        setError(msg)
      } else {
        setError('注册失败，请检查网络连接')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'login') {
      if (!username || !password) {
        setError('请输入用户名和密码')
        return
      }
      
      if (showCaptcha && !captchaInput) {
        setError('请输入验证码')
        return
      }
      
      loginMutation.mutate()
    } else {
      if (!username || !email || !password) {
        setError('请填写所有必填项')
        return
      }
      if (password !== confirmPassword) {
        setError('两次密码输入不一致')
        return
      }
      registerMutation.mutate()
    }
  }

  const isPending = mode === 'login' ? loginMutation.isPending : registerMutation.isPending
  const buttonText = mode === 'login' ? '登录' : '注册'
  const pendingText = mode === 'login' ? '登录中...' : '注册中...'

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/images/135839784_p0_master1200.jpg')] bg-center bg-cover bg-no-repeat"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-950/70 to-slate-900/70" />

      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-white/10 backdrop-blur-2xl rounded-xl px-4 py-2 border border-white/20 shadow-xl shadow-black/40">
          <p className="text-gray-300 text-xs whitespace-nowrap">{bottomInfo}</p>
        </div>
      </div>

      <div className="relative z-10 hidden md:flex md:w-1/2 lg:w-3/5 flex flex-col justify-center items-center p-8 lg:p-16">
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <TbBuildingTunnel className="h-16 w-16 lg:h-20 lg:w-20 text-blue-400" />
            <h1 className="text-4xl lg:text-5xl font-bold font-mono text-white">kcraftfrp</h1>
          </div>
          <p className="text-xl lg:text-2xl text-gray-200 mb-4">
            Beta 测试中 kcraftfrp - Beta0.91.78
          </p>
          <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
            基于Gofrp软件，提供稳定、安全、超快的内网穿透体验
            目前仍然处于测试阶段，欢迎有兴趣的用户加入测试并提供反馈

          </p>
        </div>
      </div>

      <div className="relative z-10 flex-1 md:w-1/2 lg:w-2/5 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          <div className="md:hidden flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <TbBuildingTunnel className="h-12 w-12 text-blue-400" />
              <span className="text-2xl font-bold font-mono text-white">kcraftfrp - Beta0.91.78</span>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl shadow-black/60">
            <div className="flex rounded-xl bg-white/5 p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                注册
              </button>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
                {mode === 'login' ? '欢迎回来' : '创建账户'}
              </h2>
              <p className="text-gray-300 text-sm">
                {mode === 'login' ? '登录到您的账户' : '填写以下信息注册您的账户'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-200 text-sm font-medium">
                  用户名 {mode === 'register' && <span className="text-red-300">*</span>}
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200 text-sm font-medium">
                      邮箱 <span className="text-red-300">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入邮箱"
                      className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-200 text-sm font-medium">
                        密码 <span className="text-red-300">*</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-200 text-sm font-medium">
                        确认密码 <span className="text-red-300">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="请再次输入"
                        className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode" className="text-gray-200 text-sm font-medium">
                      邀请码
                    </Label>
                    <Input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="如有邀请码请填写（选填）"
                      className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {mode === 'login' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 text-sm font-medium">
                    密码
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {mode === 'login' && showCaptcha && (
                <div className="space-y-2">
                  <Label className="text-gray-200 text-sm font-medium">
                    验证码
                  </Label>
                  <div className="flex gap-3">
                    <div
                      className="flex-shrink-0 w-28 h-12 rounded-lg overflow-hidden cursor-pointer bg-slate-700 flex items-center justify-center"
                      onClick={fetchCaptcha}
                      title="点击刷新验证码"
                    >
                      {captchaData ? (
                        <img
                          src={captchaData.captcha_img}
                          alt="验证码"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">点击加载</span>
                      )}
                    </div>
                    <Input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="请输入验证码"
                      maxLength={4}
                      className="bg-white/90 text-gray-900 placeholder:text-gray-400 border-0 h-12 rounded-xl text-base focus:ring-2 focus:ring-blue-500 flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-400">登录失败超过3次需要验证码，点击图片可刷新</p>
                </div>
              )}

              {error && (
                <div className="text-red-300 text-sm text-center bg-red-500/20 py-3 px-4 rounded-xl border border-red-500/30">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {pendingText}
                  </span>
                ) : buttonText}
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-6 pt-6 border-t border-white/15">
                <div className="text-center">
                  <span className="text-gray-300">还没有账号？</span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-blue-400 hover:text-blue-300 ml-2 font-medium transition-colors"
                  >
                    立即注册
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="mt-5 pt-5 border-t border-white/15">
                <div className="text-center">
                  <span className="text-gray-300">已有账号？</span>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-blue-400 hover:text-blue-300 ml-2 font-medium transition-colors"
                  >
                    立即登录
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-300 hover:text-white text-sm transition-colors inline-flex items-center gap-1" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.6)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
