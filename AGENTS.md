# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Animaker AI** - AI-powered video generation SaaS built on ShipAny Template Two. Users upload a photo and reference video to generate animated videos using RunningHub's AI API. The project uses a credit-based payment system with Creem.io integration.

**Tech Stack:**
- Next.js 15 (App Router, Turbopack)
- Better Auth (authentication)
- Drizzle ORM + Neon PostgreSQL
- Cloudflare R2 (file storage)
- RunningHub API (AI video generation)
- Creem.io (payment processing)
- next-intl (i18n: English/Chinese)

## Development Commands

```bash
# Development
npm run dev                    # Start dev server with Turbopack

# Database
npm run db:generate            # Generate Drizzle migrations
npm run db:migrate             # Run migrations
npm run db:push                # Push schema changes directly (dev only)
npm run db:studio              # Open Drizzle Studio

# Auth
npm run auth:generate          # Generate Better Auth types

# Build & Deploy
npm run build                  # Production build
npm run build:fast             # Build with increased memory
npm run start                  # Start production server

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format with Prettier
npm run format:check           # Check formatting
```

## Critical Architecture Patterns

### 1. Credit System (ShipAny Advanced)

**NEVER directly modify user credits.** Always use the credit transaction system:

```typescript
// Consuming credits (e.g., video generation)
import { consumeCredits } from '@/shared/models/credit';

const creditRecord = await consumeCredits({
  userId,
  credits: 1,
  scene: 'video_generation',
  description: 'Generate video task',
  metadata: JSON.stringify({ taskId, resolution, duration }),
});
```

```typescript
// Granting credits (e.g., refunds, purchases)
import { grantCreditsForUser } from '@/shared/models/credit';

await grantCreditsForUser({
  user: { id: userId, email: userEmail },
  credits: 10,
  validDays: 90,
  description: 'Purchase 10-Pack',
});
```

**Key behaviors:**
- Credits have expiration dates (`validDays` parameter)
- Consumption uses FIFO (oldest credits first)
- Each transaction creates a `credit` table record with `transactionNo`
- Failed operations should refund credits with `grantCreditsForUser()`

### 2. Database Schema Naming Convention

**Critical:** Better Auth expects snake_case column names, but Drizzle schema uses camelCase TypeScript properties:

```typescript
// In schema.postgres.ts
export const user = table('user', {
  emailVerified: boolean('email_verified'),  // TS: camelCase, DB: snake_case
  createdAt: timestamp('created_at'),
});
```

**Always specify the database column name** as the first argument to Drizzle column functions. This mismatch has caused authentication bugs in the past.

### 3. Authentication (Better Auth)

**Session validation pattern:**
```typescript
import { getAuth } from '@/core/auth';

const auth = await getAuth();
const session = await auth.api.getSession({ headers: req.headers });

if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Configuration is dynamic** - loaded from `config` table at runtime:
- `email_auth_enabled` - Enable/disable email/password auth
- `email_verification_enabled` - Require email verification
- `google_auth_enabled` - Enable Google OAuth

Run `init-auth-config.mjs` to initialize default auth settings.

### 4. Video Generation Flow

The complete flow spans multiple API routes and external services:

```
1. User uploads → /api/video/upload (returns R2 presigned URLs)
2. Client uploads files to R2 directly
3. Client calls /api/video/task/create with R2 keys
   ├─ Consume 1 credit (consumeCredits)
   ├─ Download files from R2
   ├─ Upload to RunningHub (rhUpload)
   ├─ Submit task (rhSubmitTask)
   └─ Store task in videoTask table
4. Client polls /api/video/task/[id] every 2 minutes
   ├─ Query RunningHub status (rhQueryTask)
   ├─ If complete: download result, upload to R2
   └─ If failed: refund credit (grantCreditsForUser)
5. Return final R2 URL to client
```

**Important timing:**
- Polling interval: 2 minutes (120 seconds) - optimized for ~15 min generation time
- Do NOT reduce to 10 seconds - wastes resources
- R2 presigned URLs expire in 10 minutes (600s)

### 5. Payment Integration (Creem.io)

Two credit packages configured in `.env`:
- **Single:** 1 credit, $1.99, 30 days validity
- **10-Pack:** 10 credits, $9.99, 90 days validity

**Checkout flow:**
```typescript
// /api/payment/creem/checkout
POST with { package: 'single' | '10pack' }
→ Creates Creem checkout session
→ Redirects to Creem payment page
```

**Webhook flow:**
```typescript
// /api/payment/webhook
POST from Creem with checkout.completed event
→ Verify webhook signature (CREEM_WEBHOOK_SECRET)
→ Grant credits (grantCreditsForUser)
→ Create order record for audit trail
→ Use onConflictDoNothing to prevent duplicate processing
```

## Database Tables

**Core ShipAny tables:**
- `user`, `session`, `account`, `verification` - Better Auth
- `credit` - Credit transactions with expiration tracking
- `order` - Payment records
- `config` - Runtime configuration

**Animaker-specific tables:**
- `video_task` - Video generation tasks
  - Links to `credit` table via `creditId`
  - Stores RunningHub `taskId` and status
  - Stores R2 keys for input/output files

### 6. File Storage (Cloudflare R2)

Located in `src/shared/lib/r2.ts`:

```typescript
// Upload file directly
await uploadToR2(key, buffer, contentType);

// Get presigned URL for client upload
await getUploadPresignedUrl(key, contentType, expiresIn);

// Get presigned URL for download
await getPresignedUrl(key, expiresIn);

// Get public URL (if bucket is public)
getPublicUrl(key);
```

**Key naming convention:** `{userId}/{uuid}.{ext}`

### 7. Internationalization (next-intl)

Translation files: `src/config/locale/messages/{locale}/{namespace}.json`

```typescript
// In Server Components
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('namespace');

// In Client Components
import { useTranslations } from 'next-intl';
const t = useTranslations('namespace');
```

**Supported locales:** `en`, `zh`

## Key Routes

### User Pages
- `/` - Landing page
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/create` - Video creation page (protected)
- `/dashboard` - Task list page (protected)
- `/task/[id]` - Task detail page (protected)
- `/account` - Account settings (protected)

### API Routes
- `/api/video/upload` - Get presigned upload URLs
- `/api/video/task/create` - Create video generation task
- `/api/video/task/[id]` - Get task status
- `/api/payment/webhook` - Creem payment webhook
- `/api/auth/**` - Better Auth endpoints

## Environment Variables

Required variables in `.env`:

```bash
# Core
DATABASE_URL                          # Neon PostgreSQL connection string
AUTH_SECRET                           # openssl rand -base64 32
NEXT_PUBLIC_APP_URL                   # http://localhost:3000
NEXT_PUBLIC_APP_NAME                  # Animaker AI

# Cloudflare R2
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME                        # animaker-ai
R2_PUBLIC_URL                         # https://pub-xxx.r2.dev

# RunningHub API
RUNNINGHUB_API_KEY
RUNNINGHUB_WEBAPP_ID                  # 1982768582520119298

# Creem Payment
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE   # Product ID for 1 credit
NEXT_PUBLIC_CREEM_PRODUCT_ID_10PACK   # Product ID for 10 credits
```

## Common Issues & Solutions

### Issue: "column email_verified does not exist"
**Cause:** Database column is `email_verified` but Drizzle schema had wrong mapping.
**Solution:** Ensure schema uses `boolean('email_verified')` not `boolean('emailVerified')`.

### Issue: Registration fails silently
**Cause:** Missing auth config in `config` table.
**Solution:** Run `node init-auth-config.mjs` to initialize defaults.

### Issue: Credit consumption fails
**Cause:** Trying to consume more credits than available, or credits expired.
**Solution:** Check user's active credits with `getUserCredits()`. Handle 402 error on frontend.

### Issue: Webhook called multiple times
**Cause:** Creem retries failed webhooks.
**Solution:** Use `onConflictDoNothing()` when inserting order records.

## Testing Workflow

1. **Database setup:**
   ```bash
   npm run db:push
   node init-auth-config.mjs
   ```

2. **Test auth:** Register → Login → Check session

3. **Test credits:** 
   - Manually grant credits via Drizzle Studio
   - Or complete a test payment

4. **Test video generation:**
   - Upload photo + video
   - Submit task (consumes 1 credit)
   - Poll status every 2 minutes
   - Verify result URL

5. **Test payment:**
   - Use Creem test mode
   - Complete checkout
   - Verify webhook received
   - Check credits granted

## Migration Notes

This project was migrated from an older Animaker codebase to ShipAny Template Two:
- Old project used direct SQL for credits → Now uses ShipAny credit system
- Old project used 10-second polling → Now uses 2-minute polling
- Old project had different API paths (`/api/task/*`) → Now uses `/api/video/task/*`

See `MIGRATION_SUMMARY.md` for detailed migration history.
