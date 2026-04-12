# 🤖 OpenClaw AI 团队 - 项目接手提示词

## 📌 你的身份和任务

你是 OpenClaw AI 开发团队的成员，现在接手 **Animaker AI** 项目的后续开发工作。这是一个 AI 视频生成 SaaS 应用，基于 Next.js 15 + Better Auth + Drizzle ORM 构建。

**项目仓库**: https://github.com/shaomingchan/animaker-new  
**当前状态**: 核心架构已完成，需要完成测试、优化和上线准备

---

## 🎯 你的核心任务

### Phase 1: 环境配置和验证 (第 1 天)

**任务 1.1: 克隆项目并配置环境**
```bash
git clone https://github.com/shaomingchan/animaker-new.git
cd animaker-new
pnpm install
```

**任务 1.2: 配置环境变量**

创建 `.env` 文件，使用以下配置：

```bash
# 数据库配置
DATABASE_URL="postgresql://neondb_owner:npg_xxxxxxxxxx@ep-xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Better Auth 配置
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Creem 支付配置
CREEM_SECRET_KEY="sk_test_xxxxxxxxxx"
CREEM_WEBHOOK_SECRET="whsec_xxxxxxxxxx"
NEXT_PUBLIC_CREEM_PUBLISHABLE_KEY="pk_test_xxxxxxxxxx"

# Creem 产品 ID
CREEM_PRODUCT_ID_SINGLE="prod_xxxxxxxxxx"
CREEM_PRODUCT_ID_10PACK="prod_xxxxxxxxxx"

# Cloudflare R2 配置
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="animaker-videos"
R2_PUBLIC_DOMAIN="https://your-r2-domain.com"

# RunningHub API 配置
RUNNINGHUB_API_KEY="your-api-key"
RUNNINGHUB_API_URL="https://api.runninghub.ai"

# Google OAuth (可选)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**任务 1.3: 初始化数据库**
```bash
# 创建所有必需的表
node create-core-tables.mjs

# 初始化认证配置
node init-auth-config.mjs

# 验证表结构
node check-tables.mjs
```

**任务 1.4: 启动开发服务器**
```bash
npm run dev
# 访问 http://localhost:3000
```

**验收标准**:
- ✅ 项目成功启动，无报错
- ✅ 数据库连接正常，12 张表已创建
- ✅ 首页能正常访问
- ✅ 注册页面能正常打开

---

### Phase 2: 核心功能测试 (第 2-3 天)

**任务 2.1: 测试注册登录流程**

**步骤**:
1. 访问 http://localhost:3000/sign-up
2. 使用测试邮箱注册: `test@example.com` / `Test123456!`
3. 检查数据库 `user` 表是否创建用户记录
4. 尝试登录
5. 检查 `session` 表是否创建会话记录
6. 访问 http://localhost:3000/dashboard 验证登录状态

**可能遇到的问题**:
- 如果报错 "email_verified field not found" → 重新运行 `node create-core-tables.mjs`
- 如果无法登录 → 检查 `BETTER_AUTH_SECRET` 是否配置
- 如果 session 未创建 → 检查数据库连接

**验收标准**:
- ✅ 用户能成功注册
- ✅ 用户能成功登录
- ✅ Dashboard 页面能正常访问
- ✅ 用户信息正确显示

---

**任务 2.2: 测试支付流程**

**步骤 1: 配置 Webhook (使用 ngrok)**
```bash
# 安装 ngrok
npm install -g ngrok

# 启动 ngrok
ngrok http 3000

# 复制 ngrok URL (例如: https://abc123.ngrok.io)
# 在 Creem 后台配置 Webhook URL:
# https://abc123.ngrok.io/api/payment/webhook
```

**步骤 2: 测试购买流程**
1. 登录后访问 http://localhost:3000/create
2. 点击 "Buy Single Credit" 按钮
3. 跳转到 Creem 支付页面
4. 使用测试卡完成支付:
   - 卡号: `4242 4242 4242 4242`
   - 过期日期: 任意未来日期
   - CVC: 任意 3 位数字
5. 支付成功后，检查是否跳转回网站
6. 查询数据库验证:
   ```sql
   -- 检查积分是否到账
   SELECT * FROM credit WHERE user_email = 'test@example.com';
   
   -- 检查订单是否创建
   SELECT * FROM orders WHERE user_email = 'test@example.com';
   ```

**步骤 3: 测试 10-Pack 购买**
重复上述步骤，点击 "Buy 10-Pack" 按钮

**验收标准**:
- ✅ 支付页面能正常打开
- ✅ 支付成功后积分正确到账
- ✅ `credit` 表记录正确（credits=1 或 10）
- ✅ `orders` 表记录正确
- ✅ 积分过期时间正确（Single: 30天, 10-Pack: 90天）

---

**任务 2.3: 测试视频生成流程**

**步骤 1: 准备测试数据**
```sql
-- 如果没有积分，手动添加测试积分
INSERT INTO credit (
  id, user_id, user_email, transaction_no, 
  transaction_type, credits, remaining_credits, 
  status, expires_at, created_at, updated_at
) VALUES (
  'test-credit-' || gen_random_uuid(), 
  'your-user-id', 
  'test@example.com', 
  'txn-test-' || gen_random_uuid(),
  'grant', 10, 10, 'active', 
  NOW() + INTERVAL '30 days', NOW(), NOW()
);
```

**步骤 2: 创建视频任务**
1. 访问 http://localhost:3000/create
2. 上传一张测试照片（建议使用人像照片）
3. 选择分辨率: 720p
4. 选择时长: 5s
5. 点击 "Generate Video"
6. 记录任务 ID

**步骤 3: 监控任务状态**
1. 自动跳转到任务详情页: http://localhost:3000/task/{taskId}
2. 观察轮询行为（每 2 分钟刷新一次）
3. 查看数据库任务状态:
   ```sql
   SELECT * FROM tasks WHERE id = 'your-task-id';
   ```
4. 检查 RunningHub 任务状态（如果有 API 访问权限）

**步骤 4: 验证积分扣除**
```sql
-- 检查积分是否扣除
SELECT * FROM credit WHERE user_email = 'test@example.com' ORDER BY created_at DESC;

-- 应该看到:
-- 1. 一条 consume 类型的记录（扣除 1 积分）
-- 2. remaining_credits 减少 1
```

**步骤 5: 测试失败退款**
如果视频生成失败，检查:
```sql
-- 应该看到一条 refund 类型的记录
SELECT * FROM credit WHERE transaction_type = 'refund' AND user_email = 'test@example.com';
```

**验收标准**:
- ✅ 照片能成功上传到 R2
- ✅ 任务创建成功，积分正确扣除
- ✅ 任务详情页能正常显示
- ✅ 轮询功能正常工作（每 2 分钟）
- ✅ 视频生成成功后能下载
- ✅ 失败时能正确退款

---

### Phase 3: 错误处理优化 (第 4 天)

**任务 3.1: 统一 API 错误格式**

创建 `src/lib/error-handler.ts`:
```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return Response.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

**任务 3.2: 更新 API 路由使用错误处理**

更新 `src/app/api/video/task/create/route.ts`:
```typescript
import { AppError, ErrorCodes, handleApiError } from '@/lib/error-handler';

// 在积分不足时抛出错误
if (!creditResult.success) {
  throw new AppError(
    ErrorCodes.INSUFFICIENT_CREDITS,
    'Insufficient credits. Please purchase more credits.',
    400
  );
}

// 在 catch 块中使用统一错误处理
try {
  // ... 业务逻辑
} catch (error) {
  return handleApiError(error);
}
```

**任务 3.3: 前端错误提示优化**

安装 toast 库:
```bash
pnpm add sonner
```

更新 `src/app/[locale]/(app)/create/page.tsx`:
```typescript
import { toast } from 'sonner';

// 在错误处理中使用 toast
if (response.error) {
  if (response.code === 'INSUFFICIENT_CREDITS') {
    toast.error('Insufficient credits. Please purchase more.');
  } else {
    toast.error(response.error || 'Failed to create video task');
  }
}

// 成功提示
toast.success('Video generation started!');
```

**验收标准**:
- ✅ 所有 API 返回统一的错误格式
- ✅ 前端能正确显示错误提示
- ✅ 积分不足时有明确提示
- ✅ 网络错误有友好提示

---

### Phase 4: 翻译补全 (第 5 天)

**任务 4.1: 补全英文翻译**

更新 `src/config/locale/messages/en/landing.json`:
```json
{
  "landing.footer.privacy": "Privacy Policy",
  "landing.footer.terms": "Terms of Service",
  "landing.footer.contact": "Contact Us",
  "landing.footer.copyright": "© 2026 Animaker AI. All rights reserved.",
  "landing.header.pricing": "Pricing",
  "landing.header.features": "Features",
  "landing.header.login": "Login",
  "landing.header.signup": "Sign Up"
}
```

更新 `src/config/locale/messages/en/create.json`:
```json
{
  "create.error.insufficientCredits": "Insufficient credits. Please purchase more.",
  "create.error.uploadFailed": "Failed to upload photo. Please try again.",
  "create.error.invalidFile": "Invalid file type. Please upload a JPG or PNG image.",
  "create.success.taskCreated": "Video generation started! Redirecting to task page...",
  "create.button.generating": "Generating...",
  "create.button.generate": "Generate Video"
}
```

**任务 4.2: 补全中文翻译**

同步更新对应的中文翻译文件。

**验收标准**:
- ✅ 所有页面文案都有中英文翻译
- ✅ 错误提示有翻译
- ✅ 按钮文字有翻译
- ✅ 切换语言功能正常

---

### Phase 5: 定价页面 (第 6 天)

**任务 5.1: 创建定价页面**

创建 `src/app/[locale]/(landing)/pricing/page.tsx`:
```typescript
import { useTranslations } from 'next-intl';

export default function PricingPage() {
  const t = useTranslations('pricing');
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center mb-4">
          {t('title')}
        </h1>
        <p className="text-xl text-gray-400 text-center mb-16">
          {t('subtitle')}
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Single Credit Card */}
          <PricingCard
            title={t('single.title')}
            price="$1.99"
            credits={1}
            validDays={30}
            features={[
              t('single.feature1'),
              t('single.feature2'),
              t('single.feature3'),
            ]}
            productId="single"
          />
          
          {/* 10-Pack Card */}
          <PricingCard
            title={t('pack.title')}
            price="$9.99"
            credits={10}
            validDays={90}
            features={[
              t('pack.feature1'),
              t('pack.feature2'),
              t('pack.feature3'),
              t('pack.feature4'),
            ]}
            productId="10pack"
            highlighted
          />
        </div>
      </div>
    </div>
  );
}
```

**任务 5.2: 创建定价卡片组件**

创建 `src/components/pricing-card.tsx`

**任务 5.3: 添加翻译**

创建 `src/config/locale/messages/en/pricing.json` 和对应的中文版本

**验收标准**:
- ✅ 定价页面能正常访问
- ✅ 两个套餐卡片正确显示
- ✅ 购买按钮能跳转到支付页面
- ✅ 响应式设计正常

---

### Phase 6: 最终测试和优化 (第 7 天)

**任务 6.1: 端到端测试**

完整测试用户旅程:
1. 访问首页
2. 注册账号
3. 购买积分
4. 生成视频
5. 下载视频

**任务 6.2: 性能优化**
- 添加图片懒加载
- 优化首屏加载时间
- 添加 loading 状态

**任务 6.3: 创建测试报告**

创建 `TESTING_REPORT.md` 文档，记录:
- 测试用例
- 测试结果
- 发现的问题
- 解决方案

**验收标准**:
- ✅ 所有核心功能测试通过
- ✅ 无明显 Bug
- ✅ 性能达标（首页加载 < 2s）
- ✅ 测试报告完整

---

## 📋 工作检查清单

### 必须完成 (P0)
- [ ] 环境配置完成，项目能正常启动
- [ ] 注册登录流程测试通过
- [ ] 支付流程测试通过（Single + 10-Pack）
- [ ] 视频生成流程测试通过
- [ ] 积分扣除和退款逻辑验证

### 重要任务 (P1)
- [ ] 统一错误处理实现
- [ ] 前端错误提示优化
- [ ] 翻译文件补全（中英文）
- [ ] 定价页面创建

### 优化任务 (P2)
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 测试报告编写
- [ ] 代码注释补充

---

## 🔍 关键代码位置速查

### 积分系统
- **核心逻辑**: `src/shared/models/credit.ts`
- **消费积分**: `consumeCredits()` 函数
- **发放积分**: `grantCreditsForUser()` 函数

### 视频生成
- **创建任务**: `src/app/api/video/task/create/route.ts`
- **查询状态**: `src/app/api/video/task/[id]/route.ts`
- **任务详情页**: `src/app/[locale]/(app)/task/[id]/page.tsx`
- **RunningHub 封装**: `src/lib/runninghub.ts`
- **R2 存储封装**: `src/lib/r2.ts`

### 支付系统
- **Checkout**: `src/app/api/payment/creem/checkout/route.ts`
- **Webhook**: `src/app/api/payment/webhook/route.ts`

### 数据库
- **Schema**: `src/config/db/schema.postgres.ts`
- **初始化脚本**: `create-core-tables.mjs`

---

## 🐛 常见问题快速解决

### 问题 1: 数据库连接失败
```bash
# 检查 DATABASE_URL 是否正确
echo $DATABASE_URL

# 测试数据库连接
node check-tables.mjs
```

### 问题 2: 注册报错
```bash
# 重新创建表
node create-core-tables.mjs

# 重新初始化配置
node init-auth-config.mjs
```

### 问题 3: 支付 Webhook 未触发
```bash
# 确保 ngrok 正在运行
ngrok http 3000

# 检查 Creem 后台 Webhook 配置
# 检查 CREEM_WEBHOOK_SECRET 是否正确
```

### 问题 4: 视频生成失败
```bash
# 检查 RunningHub API Key
echo $RUNNINGHUB_API_KEY

# 检查 R2 配置
echo $R2_ACCESS_KEY_ID

# 查看任务错误信息
# SELECT * FROM tasks WHERE status = 'failed';
```

---

## 📊 成功标准

项目完成的标准:
1. ✅ 所有 P0 任务完成
2. ✅ 核心功能端到端测试通过
3. ✅ 无阻塞性 Bug
4. ✅ 测试报告完整
5. ✅ 代码提交到 GitHub

---

## 📞 遇到问题怎么办？

1. **先查文档**:
   - `OPENCLAW_PROMPT.md` - 开发指南
   - `HANDOVER.md` - 技术文档
   - `CLAUDE.md` - 项目规范

2. **在 GitHub Issues 提问**:
   - 描述问题现象
   - 提供错误日志
   - 说明已尝试的解决方案

3. **自主调试**:
   - 检查环境变量配置
   - 查看数据库表结构
   - 阅读相关代码注释

---

## 🎯 开始工作

现在开始执行 **Phase 1: 环境配置和验证**，完成后在 GitHub Issues 中报告进度。

祝开发顺利！🚀
