# 🔄 项目交接文档 - Animaker AI

## 📋 项目概述

**项目名称**: Animaker AI (animaker-new)  
**GitHub 仓库**: https://github.com/shaomingchan/animaker-new  
**当前状态**: 核心功能已完成，数据库已配置，待测试和优化  
**最后提交**: f4960f8 - Database schema refactoring and core setup

---

## 🎯 项目目标

将旧 Animaker AI 项目 (animaker-ai-new-2) 的视频生成功能迁移到基于 **ShipAny Template Two** 的新项目架构中。

### 核心功能
- ✅ 用户认证系统 (Better Auth)
- ✅ 积分系统 (支持过期、交易追踪)
- ✅ 支付集成 (Creem.io)
- ✅ 视频生成 API (RunningHub)
- ✅ 文件存储 (Cloudflare R2)
- ⏳ 前端页面优化 (进行中)

---

## 🏗️ 技术架构

### 技术栈
```
Frontend:  Next.js 15 + React 19 + TypeScript + Tailwind CSS
Auth:      Better Auth (email/password)
Database:  Neon PostgreSQL + Drizzle ORM
Payment:   Creem.io
Storage:   Cloudflare R2
Video API: RunningHub
i18n:      next-intl (中英文)
```

### 数据库表结构 (12 张表)

**认证相关** (ShipAny 原生)
- `user` - 用户信息
- `session` - 会话管理
- `account` - 账户关联
- `verification` - 邮箱验证

**业务逻辑** (混合方案)
- `credit` - 积分系统 (ShipAny 高级版)
- `config` - 系统配置
- `orders` - 订单记录 (简化版，参照旧项目)
- `tasks` - 视频任务 (旧项目原表)

**遗留表** (保留兼容)
- `chatMessage`, `rolePermission`, `userRole`, `verificationToken`

---

## 📂 关键文件路径

### 后端 API
```
src/app/api/
├── video/
│   └── task/
│       ├── create/route.ts          # 创建视频任务 (扣积分)
│       └── [id]/route.ts            # 查询任务状态 (失败退款)
├── payment/
│   ├── creem/checkout/route.ts      # Creem 支付页面
│   └── webhook/route.ts             # Creem 支付回调 (发放积分)
└── auth/[...all]/route.ts           # Better Auth 路由
```

### 前端页面
```
src/app/[locale]/
├── (landing)/page.tsx               # 落地页 (Animaker AI 品牌)
├── (app)/
│   ├── create/page.tsx              # 视频创建页
│   ├── task/[id]/page.tsx           # 任务详情页 (2分钟轮询)
│   └── dashboard/page.tsx           # 用户仪表盘
└── sign-up/page.tsx                 # 注册页
```

### 数据库配置
```
src/config/db/
├── schema.postgres.ts               # 数据库 Schema 定义
└── index.ts                         # Drizzle 实例

src/core/db/
└── config.ts                        # Drizzle Kit 配置
```

### 积分系统
```
src/shared/models/credit.ts          # 积分核心逻辑
- consumeCredits()                   # 消费积分
- grantCreditsForUser()              # 发放积分
```

### 翻译文件
```
src/config/locale/messages/
├── en/
│   ├── landing.json                 # 落地页英文
│   ├── task.json                    # 任务页英文
│   └── create.json                  # 创建页英文
└── zh/
    ├── landing.json                 # 落地页中文
    ├── task.json                    # 任务页中文
    └── create.json                  # 创建页中文
```

---

## 🔑 环境变量配置

### 必需配置 (.env)
```bash
# 数据库
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

# Creem 支付
CREEM_SECRET_KEY="..."
CREEM_WEBHOOK_SECRET="..."
NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY="..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_DOMAIN="..."

# RunningHub API
RUNNINGHUB_API_KEY="..."
RUNNINGHUB_API_URL="https://api.runninghub.ai"
```

---

## 💳 积分套餐配置

### 当前方案
```javascript
// Single Credit
{
  credits: 1,
  price: $1.99,
  validDays: 30
}

// 10-Pack
{
  credits: 10,
  price: $9.99,
  validDays: 90
}
```

### 修改位置
- `src/app/api/payment/creem/checkout/route.ts` (第 13-16 行)
- `src/app/api/payment/webhook/route.ts` (第 18-21 行)
- `src/app/[locale]/(app)/create/page.tsx` (购买按钮链接)

---

## 🚀 快速启动

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 填入真实配置
```

### 3. 初始化数据库
```bash
# 创建核心表
node create-core-tables.mjs

# 初始化认证配置
node init-auth-config.mjs

# 检查表结构
node check-tables.mjs
```

### 4. 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:3000
```

---

## ✅ 已完成功能

### Phase 1: 基础迁移 ✅
- [x] 复制 ShipAny 模板到新项目
- [x] 配置 Neon 数据库连接
- [x] 集成 Better Auth 认证系统

### Phase 2: 积分系统 ✅
- [x] 使用 ShipAny 高级积分系统
- [x] 集成 `consumeCredits()` 到视频创建 API
- [x] 集成 `grantCreditsForUser()` 到失败退款逻辑

### Phase 3: 支付集成 ✅
- [x] 创建 Creem checkout 路由
- [x] 创建 Creem webhook 路由
- [x] 配置 Single/10-Pack 积分套餐
- [x] 订单记录追踪

### Phase 4: 数据库重构 ✅
- [x] 简化 order 表结构 (参照旧项目)
- [x] 保留 tasks 表原结构
- [x] 创建核心认证表 (user, session, account, verification)
- [x] 初始化 auth 配置 (email_auth_enabled=true)

### Phase 5: 前端优化 (部分完成)
- [x] 任务详情页 2 分钟轮询
- [x] 轮询计数器和倒计时显示
- [x] 落地页 Animaker AI 品牌化
- [x] 中英文翻译文件
- [ ] 错误处理优化 (待完善)
- [ ] 定价页面 (待创建)

---

## ⚠️ 已知问题

### 1. 注册功能未测试
**状态**: 数据库已配置，代码已修复，但未实际测试  
**位置**: `src/shared/blocks/sign/sign-up.tsx`  
**修复**: 已改进错误提示逻辑，使用 `JSON.stringify(error)` 确保错误信息显示  
**待办**: 需要实际注册测试，验证 Better Auth 是否正常工作

### 2. Drizzle ORM 模块加载问题
**状态**: 已修复  
**修复**: 在 `next.config.mjs` 中添加 `serverExternalPackages: ['drizzle-orm', '@neondatabase/serverless']`

### 3. 翻译文件不完整
**状态**: 核心翻译已添加，部分页面翻译缺失  
**缺失**: 
- `landing.footer.*` (页脚链接)
- `landing.header` (导航栏)
- `pricing.*` (定价页面)
- `dashboard.*` (部分仪表盘文案)

### 4. 视频生成流程未端到端测试
**状态**: API 代码已完成，但未实际调用 RunningHub  
**待测试**:
- 上传照片到 R2
- 创建 RunningHub 任务
- 轮询任务状态
- 下载生成的视频

---

## 🔧 待完成工作

### 优先级 P0 (必须完成)
1. **测试注册登录流程**
   - 注册新用户
   - 邮箱验证 (当前已禁用)
   - 登录功能
   - Session 持久化

2. **测试支付流程**
   - Creem checkout 页面
   - Webhook 回调处理
   - 积分发放验证
   - 订单记录查询

3. **测试视频生成流程**
   - 上传照片 (R2)
   - 创建任务 (扣积分)
   - 轮询状态 (2分钟间隔)
   - 失败退款
   - 下载视频

### 优先级 P1 (重要)
4. **完善错误处理**
   - API 错误统一格式
   - 前端错误提示优化
   - 网络超时处理
   - 积分不足提示

5. **补全翻译文件**
   - 页脚链接翻译
   - 导航栏翻译
   - 错误信息翻译
   - 成功提示翻译

6. **创建定价页面**
   - 路径: `src/app/[locale]/(landing)/pricing/page.tsx`
   - 展示 Single/10-Pack 套餐
   - 对比表格
   - FAQ 区块

### 优先级 P2 (优化)
7. **用户体验优化**
   - 加载状态动画
   - 进度条显示
   - 成功/失败通知
   - 响应式设计优化

8. **性能优化**
   - 图片懒加载
   - API 响应缓存
   - 数据库查询优化
   - 前端代码分割

9. **文档完善**
   - API 文档
   - 部署指南
   - 故障排查手册
   - 用户使用手册

---

## 🛠️ 开发工具脚本

### 数据库管理
```bash
# 检查所有表
node check-tables.mjs

# 创建核心表
node create-core-tables.mjs

# 重置数据库 (危险操作!)
node reset-database.mjs

# 初始化认证配置
node init-auth-config.mjs
```

### API 测试
```bash
# 测试所有 API 端点
node test-api.mjs

# 完整功能测试
node test-complete.mjs
```

### 数据库推送
```bash
# 推送 schema 到数据库
npm run db:push

# 生成 Drizzle 迁移文件
npm run db:generate

# 查看数据库 Studio
npm run db:studio
```

---

## 📊 数据库 Schema 详解

### user 表
```typescript
{
  id: text (PK),
  name: text,
  email: text (UNIQUE),
  email_verified: boolean,
  image: text,
  created_at: timestamp,
  updated_at: timestamp,
  utm_source: text,
  ip: text,
  locale: text
}
```

### credit 表 (核心)
```typescript
{
  id: text (PK),
  user_id: text (FK -> user.id),
  user_email: text,
  order_no: text,
  transaction_no: text (UNIQUE),
  transaction_type: 'grant' | 'consume' | 'refund',
  transaction_scene: text,
  credits: integer,
  remaining_credits: integer,
  description: text,
  expires_at: timestamp,
  status: 'active' | 'expired' | 'consumed',
  created_at: timestamp,
  updated_at: timestamp
}
```

### tasks 表 (旧项目原表)
```typescript
{
  id: text (PK),
  userId: text,
  userEmail: text,
  photoUrl: text,
  videoUrl: text,
  resolution: '720' | '1080',
  duration: '5' | '10',
  status: 'pending' | 'processing' | 'completed' | 'failed',
  runninghubTaskId: text,
  errorMessage: text,
  createdAt: timestamp
}
```

### orders 表 (简化版)
```typescript
{
  id: text (PK),
  userId: text,
  productId: text,
  amount: integer,
  status: 'pending' | 'completed' | 'failed',
  createdAt: timestamp,
  completedAt: timestamp
}
```

---

## 🔐 安全注意事项

### 1. 环境变量保护
- ❌ 不要提交 `.env` 到 Git
- ✅ 使用 `.env.example` 作为模板
- ✅ 生产环境使用环境变量注入

### 2. API 密钥管理
- Creem Secret Key: 仅服务端使用
- RunningHub API Key: 仅服务端使用
- R2 Access Key: 仅服务端使用
- Better Auth Secret: 定期轮换

### 3. 数据库安全
- 使用 Neon 的 SSL 连接
- 定期备份数据库
- 限制数据库访问 IP
- 使用只读用户查询

### 4. 用户数据保护
- 密码使用 bcrypt 加密 (Better Auth 自动处理)
- Session token 使用 httpOnly cookie
- 敏感信息不记录日志
- 遵守 GDPR/隐私政策

---

## 📞 联系信息

**原开发者**: Claude Opus 4.6  
**项目所有者**: shaomingchan  
**GitHub 仓库**: https://github.com/shaomingchan/animaker-new  
**交接日期**: 2025-01-XX

---

## 📝 附录

### A. 旧项目对比

| 功能 | 旧项目 (animaker-ai-new-2) | 新项目 (animaker-new) |
|------|---------------------------|----------------------|
| 认证 | 外部认证 (无 user 表) | Better Auth (完整用户系统) |
| 积分 | 简单扣款 (SQL 直接操作) | ShipAny 高级系统 (支持过期) |
| 支付 | Creem (基础集成) | Creem (完整 webhook) |
| 数据库 | 6 张表 | 12 张表 |
| 前端 | 基础页面 | ShipAny 模板 + 优化 |

### B. 技术债务
- [ ] 移除未使用的数据库表 (chatMessage, rolePermission 等)
- [ ] 统一错误处理中间件
- [ ] 添加 API 速率限制
- [ ] 实现日志系统
- [ ] 添加监控告警

### C. 性能指标目标
- 首页加载: < 2s
- API 响应: < 500ms
- 视频生成: 10-15 分钟
- 数据库查询: < 100ms

---

**祝 OpenClaw 团队开发顺利！🚀**
