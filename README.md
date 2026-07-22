# kcraftfrp 整体系统架构

kcraftfrp web panel 样式来源于另一个面板 [frp-panel](https://github.com/VaalaCat/frp-panel)

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        KCraftFRP 架构                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     WebSocket      ┌──────────────────────┐  │
│   │   节点 A     │◄──────────────────►│                      │  │
│   │  (frps)      │   连接+同步密钥     │                      │  │
│   └──────────────┘                    │      主控服务         │  │
│                                       │     (后端API)         │  │
│   ┌──────────────┐     WebSocket      │                      │  │
│   │   节点 B     │◄──────────────────►│                      │  │
│   │  (frps)      │   连接+同步密钥     │                      │  │
│   └──────────────┘                    └──────────┬───────────┘  │
│                                                  │               │
│   ┌──────────────┐                             │               │
│   │  用户客户端   │◄───── TCP连接 ───────────────┤               │
│   │   (frpc)     │      携带访问密钥             │               │
│   └──────────────┘                             │               │
│                                       ┌────────▼─────────┐     │
│                                       │    前端面板       │     │
│                                       │    (React)       │     │
│                                       └──────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 工作流程

### 1. 节点注册流程
```
节点启动 → 连接主控WebSocket → 发送节点信息(ID/名称/连接地址/Token)
    ↓
主控记录节点信息 → 返回register_ack → 节点进入在线状态
```

### 2. 用户创建隧道流程
```
用户登录面板 → 创建隧道 → 选择节点 → 保存到数据库
    ↓
主控通过WebSocket将隧道配置+访问密钥下发到对应节点
    ↓
节点更新本地授权密钥列表
```

### 3. 客户端连接流程
```
frpc客户端连接节点 → 携带访问密钥(user字段) → 节点验证密钥
    ↓
密钥在授权列表中 → 允许连接 → 建立隧道
密钥不在授权列表中 → 拒绝连接
```

### 4. 主控离线处理
```
主控离线 → 节点保持现有连接 → 使用缓存的密钥列表继续验证
    ↓
主控恢复 → 节点自动重连 → 同步最新密钥列表
```

## 功能特性

### 核心功能
- **用户管理**: 注册、登录、用户信息管理、访问密钥管理
- **隧道管理**: 创建、查询、更新、删除隧道，支持 TCP/UDP
- **权限组管理**: 细粒度权限控制，QoS 级别设置，带宽限制，隧道数量限制
- **节点管理**: WebSocket 实时通信，节点状态监控，负载状态显示
- **邀请码系统**: 可选开启，支持使用次数限制、有效期设置、默认用户组

### 安全特性
- **访问密钥验证**: 只有主控下发的访问密钥才能连接节点
- **主控离线保护**: 主控离线时节点继续使用缓存的密钥列表
- **登录验证码**: 连续登录失败3次后强制验证码
- **JWT认证**: 安全的用户会话管理
- **账户封禁**: 支持封禁/解封用户和隧道

## 目录结构

```
kcraftfrp-Main/
├── frontend/                    # React前端
│   ├── src/
│   │   ├── components/          # 组件
│   │   ├── pages/               # 页面组件
│   │   ├── lib/                 # 工具库
│   │   └── App.tsx              # 根组件
│   ├── public/
│   │   └── config.json          # 前端配置文件
│   └── dist/                    # 编译输出
```
### 其余组件尚未开源 请等待完善

## 快速开始

### 1. 环境要求

- Node.js 18.0+
- npm 9.0+

### 2. 配置后端

创建 `server/config.json`:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "mode": "debug"
  },
  "storage": {
    "type": "memory",
    "path": "./data"
  },
  "jwt": {
    "secret": "your-jwt-secret-change-in-production"
  },
  "cors": {
    "allow_all_origins": false,
    "allow_origins": [
      "https://yourdomain.com"
    ]
  }
}
```

### 3. 配置前端

修改 `frontend/public/config.json`:

```json
{
  "apiBaseUrl": "https://api.yourdomain.com/api",
  "wsBaseUrl": "wss://api.yourdomain.com/ws",
  "appTitle": "KCraftFRP 管理面板",
  "appDescription": "KCraftFRP 内网穿透管理平台"
}
```

## API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/captcha` - 获取验证码
- `GET /api/auth/captcha/check` - 检查是否需要验证码

### 用户相关
- `POST /api/user/get` - 获取用户信息
- `POST /api/user/update` - 更新用户信息
- `POST /api/user/regenerate-key` - 重新生成访问密钥
- `POST /api/user/frpc-config` - 获取FRPC配置（需传node_id）

### 隧道相关
- `POST /api/tunnel/create` - 创建隧道
- `GET /api/tunnel/list` - 获取隧道列表
- `PUT /api/tunnel/:id` - 更新隧道
- `DELETE /api/tunnel/:id` - 删除隧道

### 节点相关
- `GET /api/nodes/` - 获取节点列表及状态

### 管理员接口
- `GET /api/tunnel/all/detail` - 获取所有隧道详情
- `POST /api/tunnel/update-qos` - 更新隧道QoS
- `POST /api/tunnel/update-ban` - 封禁/解封隧道
- `POST /api/user/ban` - 封禁/解封用户
- `POST /api/user/reset-password` - 重置用户密码

## 默认账户

首次启动自动创建管理员账户：
- 用户名: `admin`
- 密码: `admin123`

**生产环境请立即修改默认密码！**

## QoS 级别说明

QoS级别范围 1-10，数值越小优先级越高：
- **1**: 最高优先级（管理员）
- **5**: 中等优先级（普通用户）
- **10**: 最低优先级


## 许可证

MIT License
