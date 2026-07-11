import { useNavigate } from 'react-router-dom'
import { TbBuildingTunnel } from 'react-icons/tb'
import { Server, Shield, Zap, Globe, ArrowRight, Cpu, Network, Lock, Rocket, Menu, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useState, useEffect, type MouseEvent } from 'react'
import { getApiBaseUrl } from '../lib/config'

interface PlatformStats {
  total_users: number
  total_nodes: number
  active_tunnels: number
  total_tunnels: number
  traffic_24h: number
}

const STATS_CACHE_KEY = 'kcraftfrp_stats_cache'
const STATS_CACHE_TTL = 5 * 60 * 1000

function getCachedStats(): PlatformStats | null {
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < STATS_CACHE_TTL) {
        return data
      }
    }
  } catch {
    return null
  }
  return null
}

function setCachedStats(data: PlatformStats) {
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch {
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}

export default function HomePage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState<PlatformStats | null>(getCachedStats())

  useEffect(() => {
    if (stats) {
      return
    }

    const fetchStats = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl()
        const response = await fetch(`${apiBaseUrl}/platform/stats`)
        const result = await response.json()
        if (result.code === 200 && result.body?.stats) {
          setStats(result.body.stats)
          setCachedStats(result.body.stats)
        }
      } catch {
      }
    }

    fetchStats()
  }, [stats])

  const handleFeatureMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`)
  }

  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor
    const prevBodyBg = document.body.style.backgroundColor
    const prevBodyOverflowX = document.body.style.overflowX
    document.documentElement.style.backgroundColor = getComputedStyle(document.documentElement).backgroundColor || '#0f1724'
    document.body.style.backgroundColor = '#0b1220'
    document.body.style.overflowX = 'hidden'
    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg
      document.body.style.backgroundColor = prevBodyBg
      document.body.style.overflowX = prevBodyOverflowX
    }
  }, [])

  const features = [
    {
      icon: Server,
      title: '多节点支持',
      description: '支持多个边缘节点部署，实现就近接入，降低延迟',
    },
    {
      icon: Shield,
      title: '安全可靠',
      description: '端到端加密传输，保护您的数据安全',
    },
    {
      icon: Zap,
      title: '高性能',
      description: '基于Golang，传输效率高，延迟低',
    },
    {
      icon: Globe,
      title: '覆盖广',
      description: '多地域节点部署，满足不同场景需求',
    },
    {
      icon: Cpu,
      title: 'QoS控制',
      description: '支持服务质量等级控制，合理分配带宽资源',
    },
    {
      icon: Network,
      title: '协议支持',
      description: '支持TCP、UDP等基础穿透协议',
    },
    {
      icon: Lock,
      title: '访问控制',
      description: '支持访问密钥认证，确保服务安全可控',
    },
    {
      icon: Rocket,
      title: '快速部署',
      description: '简单配置即可快速启动，一键生成配置文件',
    },
  ]

  const protocols = ['TCP', 'UDP']

  const statsDisplay = [
    { value: '99.96%', label: '服务可用性' },
    { value: '12/7', label: '技术支持' },
    { value: stats?.total_nodes ?? '-', label: '节点数量' },
    { value: stats?.active_tunnels ?? '-', label: '活跃隧道' },
    { value: stats ? formatBytes(stats.traffic_24h) : '-', label: '24h累计处理流量' },
    { value: stats?.total_users ?? '-', label: '用户总数' },
  ]

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <TbBuildingTunnel className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500" />
              <span className="text-lg sm:text-xl font-bold font-mono">kcraftfrp - beta</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-3">
              <Button
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                onClick={() => navigate('/login')}>
                管理面板
              </Button>
            </div>

            <button
              className="sm:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="sm:hidden py-4 border-t border-slate-800">
              <div className="flex flex-col gap-3">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                  管理面板
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] sm:w-[600px] md:w-[800px] h-[80vw] sm:h-[600px] md:h-[800px] max-w-full bg-blue-500/20 rounded-full blur-3xl opacity-20 sm:opacity-30 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-800 border border-slate-700 text-xs sm:text-sm text-gray-300 mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
              v0.91.114 Beta / 测试版本
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"/>
                kcraftfrp
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 sm:mb-4 font-medium">
              内网穿透管理面板
            </p>
            
            <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 sm:mb-10 max-w-xl sm:max-w-2xl mx-auto leading-relaxed px-2">
              基于Golang语言打造的高性能后端 以及节点端 速度超快超稳定
              让你轻松的将内网服务 安全的暴露到公网 适用于远程办公 远程控制 内网资源共享等多种场景
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
                onClick={() => navigate('/login')}
              >
                立即开始使用
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-8 md:py-10 lg:py-12 xl:py-14 2xl:py-16 border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
            {statsDisplay.map((stat, index) => (
              <div
                key={index}
                onMouseMove={handleFeatureMouseMove}
                className="group relative overflow-hidden rounded-xl border border-transparent bg-gradient-to-b from-slate-900/20 to-slate-950/10 p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/30 hover:from-slate-800/40 hover:to-slate-900/20 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(160px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(59,130,246,0.18),transparent_70%)]" />
                <div className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/10 via-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold text-blue-400 mb-1 sm:mb-2 transition-colors duration-300 group-hover:text-cyan-300">{stat.value}</div>
                <div className="relative z-10 text-sm sm:text-base text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">核心功能</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-xl sm:max-w-2xl mx-auto">
              提供全方位的内网穿透解决方案，满足您的各种需求
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseMove={handleFeatureMouseMove}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:from-slate-800 hover:to-slate-900 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(220px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(59,130,246,0.22),transparent_70%)]" />
                <div className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-400/5 flex items-center justify-center mb-3 sm:mb-4 ring-1 ring-blue-400/10 transition-all duration-300 group-hover:scale-105 group-hover:from-blue-500/25 group-hover:to-cyan-400/15 group-hover:ring-blue-300/25">
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400 transition-colors duration-300 group-hover:text-cyan-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 transition-colors duration-300 group-hover:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed transition-colors duration-300 group-hover:text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">支持的协议</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">支持各类传输协议，满足不同场景需求</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
            {protocols.map((protocol) => (
              <div
                key={protocol}
                onMouseMove={handleFeatureMouseMove}
                className="group relative overflow-hidden rounded-lg sm:rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-4 sm:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:from-slate-700 hover:to-slate-800 hover:shadow-xl hover:shadow-blue-500/10 cursor-default"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(180px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(59,130,246,0.22),transparent_70%)]" />
                <div className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 text-lg sm:text-xl font-mono font-semibold transition-colors duration-300 group-hover:text-cyan-300">{protocol}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">快速开始</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">三步启动 快速使用</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '01', title: '注册账号', desc: '填写基本信息，完成账号注册' },
              { step: '02', title: '创建隧道', desc: '选择节点，配置隧道参数' },
              { step: '03', title: '启动服务', desc: '获取配置文件，启动客户端' },
            ].map((item, index) => (
              <div
                key={index}
                onMouseMove={handleFeatureMouseMove}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 text-center md:text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:from-slate-800 hover:to-slate-900 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(220px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(59,130,246,0.22),transparent_70%)]" />
                <div className="pointer-events-none absolute inset-px rounded-[inherit] bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="text-5xl sm:text-6xl font-bold text-slate-800 mb-3 sm:mb-4 transition-colors duration-300 group-hover:text-blue-400/25">{item.step}</div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 transition-colors duration-300 group-hover:text-white">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-1/3 border-t border-dashed border-slate-700 transition-colors duration-300 group-hover:border-blue-400/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">准备好开始了吗？</h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8 md:mb-10">
            立即注册，体验高效稳定的内网穿透服务
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-base sm:text-lg px-8 sm:px-10 md:px-12 h-12 sm:h-14 shadow-xl shadow-blue-500/25"
            onClick={() => navigate('/login')}
          >
            管理面板
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </section>

      <footer className="py-6 sm:py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <TbBuildingTunnel className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <span className="font-mono font-semibold text-sm sm:text-base">kcraftfrp</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              &copy; {new Date().getFullYear()} KcraftNetwork Studio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
