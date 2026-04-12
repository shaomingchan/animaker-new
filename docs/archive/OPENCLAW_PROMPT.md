# 🤖 OpenClaw 团队开发提示词

## 📌 项目背景简述

你正在接手一个 **AI 视频生成 SaaS 项目** - Animaker AI。这是一个基于 ShipAny Template Two 构建的 Next.js 15 应用，核心功能是让用户上传照片生成 AI 视频。

**GitHub 仓库**: https://github.com/shaomingchan/animaker-new  
**技术栈**: Next.js 15 + Better Auth + Drizzle ORM + Neon PostgreSQL + Creem 支付 + RunningHub API

---

## 🎯 当前项目状态

### ✅ 已完成 (可直接使用)
1. **数据库架构** - 12 张表已创建并配置完成
2. **认证系统** - Better Auth 集成完成 (邮箱密码登录)
3. **积分系统** - ShipAny 高级积分系统 (支持过期、交易追踪)
4. **支付集成** - Creem.io 支付流程 (Single $1.99 / 10-Pack $9.99)
5. **视频 API** - RunningHub 集成代码 (创建任务、查询状态、失败退款)
6. **文件存储** - Cloudflare R2 配置
7. **前端页面** - 落地页、创建页、任务详情页、仪表盘

### ⚠️ 未测试 (需要验证)
1. **注册登录流程** - 代码已完成但未实际测试
2. **支付流程** - Webhook 未实际触发测试
3. **视频生成流程** - 端到端流程未验证
4. **积分扣除/退款** - 逻辑已实现但未测试

### 🔧 待完成 (需要开发)
1. **错误处理优化** - 统一错误格式和用户提示
2. **翻译文件补全** - 部分页面翻译缺失
3. **定价页面** - 需要创建独立的 pricing 页面
4. **用户体验优化** - 加载动画、进度条、通知系统

---

## 🚀 快速上手指南

### Step 1: 克隆仓库
```bash
git clone https://github.com/shaomingchan/animaker-new.git
cd animaker-new
```

### Step 2: 安装依赖
```bash
pnpm install
# 或
npm install
```

### Step 3: 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入以下配置：
# - DATABASE_URL (Neon PostgreSQL)
# - BETTER_AUTH_SECRET (随机字符串)
# - CREEM_SECRET_KEY (Creem 后台获取)
# - R2_* (Cloudflare R2 配置)
# - RUNNINGHUB_API_KEY (RunningHub API Key)
```

### Step 4: 初始化数据库
```bash
# 创建核心表 (user, session, account, credit 等)
node create-core-tables.mjs

# 初始化认证配置
node init-auth-config.mjs

# 验证表结构
node check-tables.mjs
```

### Step 5: 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:3000
```

---

## 📋 优先级任务清单

### 🔴 P0 - 必须完成 (阻塞上线)

#### 1. 测试注册登录流程
**目标**: 确保用户能正常注册和登录

**测试步骤**:
```
1. 访问 http://localhost:3000/sign-up
2. 填写邮箱和密码注册
3. 检查数据库 user 表是否创建用户
4. 尝试登录
5. 检查 session 表是否创建会话
```

**可能遇到的问题**:
- Better Auth 配置错误 → 检查 `src/core/auth/config.ts`
- 数据库连接失败 → 检查 `.env` 中的 `DATABASE_URL`
- 邮箱验证问题 → 当前已禁用，如需启用修改 `config` 表

**相关文件**:
- `src/shared/blocks/sign/sign-up.tsx` (注册组件)
- `src/core/auth/config.ts` (认证配置)
- `init-auth-config.mjs` (配置初始化脚本)

---

#### 2. 测试支付流程
**目标**: 确保用户能购买积分并正确发放

**测试步骤**:
```
1. 登录后访问 http://localhost:3000/create
2. 点击 "Buy Single Credit" 或 "Buy 10-Pack"
3. 跳转到 Creem 支付页面
4. 使用测试卡完成支付
5. Webhook 回调触发
6. 检查 credit 表是否增加积分
7. 检查 orders 表是否创建订单
```

**Webhook 测试**:
```bash
# 使用 ngrok 暴露本地服务
ngrok http 3000

# 在 Creem 后台配置 Webhook URL:
# https://your-ngrok-url.ngrok.io/api/payment/webhook
```

**相关文件**:
- `src/app/api/payment/creem/checkout/route.ts` (创建支付)
- `src/app/api/payment/webhook/route.ts` (处理回调)
- `src/shared/models/credit.ts` (积分逻辑)

---

#### 3. 测试视频生成流程
**目标**: 端到端验证视频生成功能

**测试步骤**:
```
1. 确保用户有积分 (可手动插入数据库)
2. 访问 http://localhost:3000/create
3. 上传照片
4. 选择分辨率和时长
5. 点击 "Generate Video"
6. 检查是否扣除 1 积分
7. 跳转到任务详情页
8. 等待 2 分钟轮询
9. 检查 RunningHub 任务状态
10. 视频生成成功后下载
```

**手动添加积分 (测试用)**:
```sql
-- 在 Neon 数据库中执行
INSERT INTO credit (
  id, user_id, user_email, transaction_no, 
  transaction_type, credits, remaining_credits, 
  status, expires_at, created_at, updated_at
) VALUES (
  'test-credit-1', 'your-user-id', 'test@example.com', 'txn-test-1',
  'grant', 10, 10, 'active', 
  NOW() + INTERVAL '30 days', NOW(), NOW()
);
```

**相关文件**:
- `src/app/api/video/task/create/route.ts` (创建任务)
- `src/app/api/video/task/[id]/route.ts` (查询状态)
- `src/app/[locale]/(app)/task/[id]/page.tsx` (任务详情页)
- `src/lib/runninghub.ts` (RunningHub API 封装)
- `src/lib/r2.ts` (R2 存储封装)

---

### 🟡 P1 - 重要 (影响体验)

#### 4. 完善错误处理
**目标**: 统一错误格式，优化用户提示

**需要处理的场景**:
- API 请求失败
- 积分不足
- 文件上传失败
- 视频生成失败
- 支付失败

**建议实现**:
```typescript
// 创建统一错误处理中间件
// src/lib/error-handler.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**前端错误提示**:
```typescript
// 使用 toast 库 (如 sonner)
import { toast } from 'sonner';

toast.error('Insufficient credits. Please purchase more.');
toast.success('Video generation started!');
```

---

#### 5. 补全翻译文件
**目标**: 完善中英文翻译，支持国际化

**缺失的翻译键**:
```json
// src/config/locale/messages/en/landing.json
{
  "landing.footer.privacy": "Privacy Policy",
  "landing.footer.terms": "Terms of Service",
  "landing.footer.contact": "Contact Us",
  "landing.header.pricing": "Pricing",
  "landing.header.login": "Login",
  "landing.header.signup": "Sign Up"
}

// src/config/locale/messages/en/pricing.json (新建)
{
  "pricing.title": "Simple, Transparent Pricing",
  "pricing.subtitle": "Choose the plan that fits your needs",
  "pricing.single.title": "Single Credit",
  "pricing.single.price": "$1.99",
  "pricing.single.description": "Perfect for trying out",
  "pricing.pack.title": "10-Pack",
  "pricing.pack.price": "$9.99",
  "pricing.pack.description": "Best value for regular users"
}
```

**相关文件**:
- `src/config/locale/messages/en/*.json`
- `src/config/locale/messages/zh/*.json`

---

#### 6. 创建定价页面
**目标**: 独立的定价页面，展示套餐对比

**文件路径**: `src/app/[locale]/(landing)/pricing/page.tsx`

**页面结构**:
```tsx
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="py-20">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your needs</p>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Single Credit Card */}
          <PricingCard
            title="Single Credit"
            price="$1.99"
            credits={1}
            validDays={30}
            features={[
              "1 video generation",
              "720p or 1080p resolution",
              "5s or 10s duration",
              "Valid for 30 days"
            ]}
          />

          {/* 10-Pack Card */}
          <PricingCard
            title="10-Pack"
            price="$9.99"
            credits={10}
            validDays={90}
            features={[
              "10 video generations",
              "720p or 1080p resolution",
              "5s or 10s duration",
              "Valid for 90 days",
              "Best value!"
            ]}
            highlighted
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <FAQ />
      </section>
    </div>
  );
}
```

---

### 🟢 P2 - 优化 (提升品质)

#### 7. 用户体验优化
- 添加加载动画 (Skeleton, Spinner)
- 实现进度条 (视频生成进度)
- 添加 Toast 通知 (成功/失败提示)
- 优化响应式设计 (移动端适配)

#### 8. 性能优化
- 图片懒加载 (`next/image` 优化)
- API 响应缓存 (React Query / SWR)
- 数据库查询优化 (添加索引)
- 前端代码分割 (动态导入)

#### 9. 监控和日志
- 集成 Sentry (错误追踪)
- 添加 Google Analytics (用户行为)
- 实现日志系统 (Winston / Pino)
- 配置告警通知 (邮件/Slack)

---

## 🔍 关键代码位置

### 积分系统核心逻辑
**文件**: `src/shared/models/credit.ts`

```typescript
// 消费积分 (视频生成时调用)
export async function consumeCredits({
  userId,
  credits,
  scene,
  description
}: ConsumeCreditsParams): Promise<ConsumeCreditsResult>

// 发放积分 (支付成功后调用)
export async function grantCreditsForUser({
  user,
  credits,
  validDays,
  description
}: GrantCreditsParams): Promise<void>
```

**使用示例**:
```typescript
// 创建视频任务时扣积分
const creditResult = await consumeCredits({
  userId,
  credits: 1,
  scene: 'video_generation',
  description: `Generate ${resolution}p ${duration}s video`,
});

if (!creditResult.success) {
  return Response.json(
    { error: 'Insufficient credits' },
    { status: 400 }
  );
}

// 视频生成失败时退款
await grantCreditsForUser({
  user: { id: userId, email: userEmail },
  credits: 1,
  validDays: 30,
  description: 'Refund for failed video generation',
});
```

---

### 视频生成 API 流程

**1. 创建任务** (`src/app/api/video/task/create/route.ts`)
```typescript
POST /api/video/task/create
Body: {
  photoUrl: string,
  resolution: '720' | '1080',
  duration: '5' | '10'
}

流程:
1. 验证用户登录
2. 扣除 1 积分
3. 上传照片到 R2
4. 调用 RunningHub API 创建任务
5. 保存任务到 tasks 表
6. 返回任务 ID
```

**2. 查询状态** (`src/app/api/video/task/[id]/route.ts`)
```typescript
GET /api/video/task/{taskId}

流程:
1. 从数据库查询任务
2. 如果状态是 pending/processing:
   - 调用 RunningHub API 查询状态
   - 更新数据库状态
3. 如果失败:
   - 退还 1 积分
4. 返回任务详情
```

**3. 前端轮询** (`src/app/[locale]/(app)/task/[id]/page.tsx`)
```typescript
// 每 2 分钟轮询一次
const POLL_INTERVAL = 120000; // 2 minutes

useEffect(() => {
  const interval = setInterval(() => {
    fetchTaskStatus();
  }, POLL_INTERVAL);

  return () => clearInterval(interval);
}, []);
```

---

## 🐛 常见问题排查

### 问题 1: 注册时报错 "email_verified field not found"
**原因**: 数据库字段名不匹配  
**解决**: 
```bash
# 重新创建 user 表
node create-core-tables.mjs
```

### 问题 2: 支付后积分未到账
**原因**: Webhook 未触发或处理失败  
**排查**:
```bash
# 1. 检查 Creem 后台 Webhook 日志
# 2. 检查本地日志
# 3. 手动触发 Webhook 测试

curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.succeeded", ...}'
```

### 问题 3: 视频生成一直 pending
**原因**: RunningHub API 调用失败  
**排查**:
```bash
# 1. 检查 RUNNINGHUB_API_KEY 是否正确
# 2. 检查 API 配额是否用完
# 3. 查看 tasks 表的 errorMessage 字段
# 4. 手动调用 RunningHub API 测试

curl -X POST https://api.runninghub.ai/v1/tasks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "...", "resolution": "720", "duration": "5"}'
```

### 问题 4: 数据库连接超时
**原因**: Neon 数据库休眠或网络问题  
**解决**:
```bash
# 1. 检查 DATABASE_URL 是否正确
# 2. 在 Neon 后台唤醒数据库
# 3. 检查本地网络连接
# 4. 尝试重新连接

node check-tables.mjs
```

---

## 📚 重要文档链接

### 官方文档
- [Next.js 15 文档](https://nextjs.org/docs)
- [Better Auth 文档](https://www.better-auth.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [Creem 支付文档](https://docs.creem.io)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)

### 项目文档
- `HANDOVER.md` - 完整交接文档
- `CLAUDE.md` - 项目架构和开发指南
- `README.md` - 项目简介
- `.env.example` - 环境变量模板

---

## 💡 开发建议

### 1. 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 提交前运行 `npm run lint`

### 2. Git 工作流
```bash
# 创建功能分支
git checkout -b feature/pricing-page

# 提交代码
git add .
git commit -m "feat: add pricing page"

# 推送到远程
git push origin feature/pricing-page

# 创建 Pull Request
```

### 3. 测试策略
- 单元测试: 核心逻辑函数
- 集成测试: API 端点
- E2E 测试: 关键用户流程
- 手动测试: UI/UX 体验

### 4. 部署建议
- 使用 Vercel 部署 (推荐)
- 配置环境变量
- 设置自定义域名
- 配置 Webhook URL

---

## 🎯 成功标准

### 最小可行产品 (MVP)
- ✅ 用户能注册登录
- ✅ 用户能购买积分
- ✅ 用户能生成视频
- ✅ 视频生成成功后能下载
- ✅ 失败时能退款

### 生产就绪 (Production Ready)
- ✅ 所有功能端到端测试通过
- ✅ 错误处理完善
- ✅ 翻译文件完整
- ✅ 性能优化完成
- ✅ 监控告警配置
- ✅ 文档完善

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看 `HANDOVER.md` 详细文档
2. 检查 GitHub Issues
3. 查看代码注释
4. 参考旧项目代码 (animaker-ai-new-2)

---

**祝开发顺利！有任何问题随时在 GitHub Issues 中提出。🚀**

---

## 🔖 快速命令参考

```bash
# 安装依赖
pnpm install

# 初始化数据库
node create-core-tables.mjs
node init-auth-config.mjs

# 检查数据库
node check-tables.mjs

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 数据库操作
npm run db:push      # 推送 schema
npm run db:studio    # 打开数据库 GUI
npm run db:generate  # 生成迁移文件
```

---

**最后更新**: 2025-01-XX  
**版本**: 1.0.0  
**状态**: 待接手开发
