import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TbBuildingTunnel } from 'react-icons/tb'
import {
  Server,
  Cable,
  Activity,
  ShieldCheck,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../ui/sidebar'
import { Separator } from '../ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ThemeToggle } from '../ui/theme-toggle'
import { getUser, logout, isAdmin } from '../../lib/auth'
import { useState, useEffect } from 'react'

const navItems = [
  {
    title: '仪表盘',
    url: '/app/dashboard',
    icon: Activity,
  },
  {
    title: '隧道管理',
    url: '/app/proxies',
    icon: Cable,
  },
  {
    title: '节点状态',
    url: '/app/server-status',
    icon: Server,
  },
  {
    title: '个人信息',
    url: '/app/user-info',
    icon: User,
  },
  {
    title: '管理员',
    url: '#',
    icon: ShieldCheck,
    items: [
      { title: '隧道管理', url: '/app/admin-tunnels' },
      { title: '邀请码管理', url: '/app/invite-codes' },
      { title: '用户管理', url: '/app/user-management' },
      { title: '用户组管理', url: '/app/group-management' },
    ],
  },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    setUser(getUser())
  }, [location])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const urlSelected = (url: string) => {
    return location.pathname === url
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            onClick={() => navigate('/app/dashboard')}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <TbBuildingTunnel className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold font-mono">KCraftFRP</span>
              <span className="truncate text-xs font-mono">管理面板</span>
            </div>
          </SidebarMenuButton>
          <SidebarMenu>
            {navItems.map((item) => (
              <Collapsible
                key={item.title}
                asChild
                className="group/collapsible"
              >
                <>
                  {!item.items && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={urlSelected(item.url)}
                        onClick={() => navigate(item.url)}
                        tooltip={item.title}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  {item.items && (item.title !== '管理员' || isAdmin()) && (
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={urlSelected(subItem.url)}
                                onClick={() => navigate(subItem.url)}
                              >
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  )}
                </>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent />
        <SidebarFooter>
          <div className="flex w-full flex-row group-data-[collapsible=icon]:flex-col-reverse gap-2 justify-between">
            {user && (
              <div className="flex items-center gap-2 px-2 py-1">
                <User className="h-4 w-4" />
                <span className="text-sm truncate">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="ml-auto p-1 hover:bg-sidebar-accent rounded"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <header className="flex flex-row h-12 items-center gap-2 w-full pr-4">
            <div className="flex flex-row items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          <div className="h-[calc(100dvh_-_48px)] overflow-auto w-full pb-4 px-4 pt-2">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
