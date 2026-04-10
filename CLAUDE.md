# Animaker AI - Project Documentation

## Project Overview

Animaker AI is an AI-powered video generation platform built on the ShipAny template. Users can upload photos and optional reference videos to generate AI-animated videos using the RunningHub API.

**Tech Stack:**
- Next.js 15 (App Router)
- Better Auth (authentication)
- Drizzle ORM + Neon PostgreSQL
- Cloudflare R2 (object storage)
- RunningHub API (AI video generation)
- Creem.io (payment processing)
- Tailwind CSS + shadcn/ui

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Database operations
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## Architecture

### Authentication Flow
1. User signs in via Better Auth (Google OAuth, Email, etc.)
2. Session stored in database (sessions table)
3. Protected routes check session via middleware
4. Client-side: use `useSession()` from @/core/auth/client
5. Server-side: use `auth()` from @/core/auth/server

### Video Generation Flow
1. **Upload Phase:**
   - Client requests presigned URLs from `/api/video/upload`
   - Client uploads files directly to Cloudflare R2
   - Returns R2 object keys

2. **Task Creation:**
   - Client calls `/api/video/task/create` with R2 keys and parameters
   - Server deducts credits from user account
   - Server downloads files from R2
   - Server uploads to RunningHub API
   - Server submits AI generation task
   - Returns task ID

3. **Status Polling:**
   - Client polls `/api/video/task/[id]` every 5 seconds
   - Server checks RunningHub task status
   - When complete, server downloads result and uploads to R2
   - Returns result URL to client

### Database Schema

**Core Tables:**
- `user` - User accounts (includes credits, plan)
- `session` - Active sessions
- `account` - OAuth accounts
- `video_task` - Video generation tasks

**Video Task Fields:**
- `id` - UUID primary key
- `userId` - Foreign key to user
- `status` - pending | running | success | failed
- `photoKey` - R2 object key for photo
- `videoKey` - R2 object key for reference video (optional)
- `resultKey` - R2 object key for generated video
- `resultUrl` - Public URL for result
- `resolution` - 480p | 720p | 1080p
- `duration` - 5 | 10 | 15 seconds
- `runninghubTaskId` - External task ID
- `errorMessage` - Error details if failed
- `createdAt` - Timestamp
- `completedAt` - Timestamp

**Other Tables:**
- `order` - Payment records
- `subscription` - User subscriptions
- `credit_transaction` - Credit history
- `post` - Blog posts
- `taxonomy` - Categories/tags

### External Services

**Cloudflare R2:**
- Bucket: `animaker-ai`
- Public URL: `https://pub-xxx.r2.dev`
- Operations: upload, download, presigned URLs
- Library: `src/shared/lib/r2.ts`

**RunningHub API:**
- Base URL: `https://api.runninghub.ai`
- Operations: upload files, submit task, check status, download result
- Library: `src/shared/lib/runninghub.ts`
- Requires: API key in `RUNNINGHUB_API_KEY`

**Creem.io:**
- Payment processing
- Webhook: `/api/payment/webhook`
- Credit packages: 10, 50, 100 credits

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

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=animaker-ai
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# RunningHub API
RUNNINGHUB_API_KEY=...
RUNNINGHUB_BASE_URL=https://api.runninghub.ai

# Creem Payment
CREEM_API_KEY=...
CREEM_WEBHOOK_SECRET=...

# Proxy (for development in China)
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

## Common Patterns

### Checking Authentication (Client)
```tsx
'use client';
import { useSession } from '@/core/auth/client';

export default function MyPage() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) redirect('/sign-in');
  
  return <div>Hello {session.user.name}</div>;
}
```

### Checking Authentication (Server)
```tsx
import { auth } from '@/core/auth/server';
import { redirect } from 'next/navigation';

export default async function MyPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  return <div>Hello {session.user.name}</div>;
}
```

### Deducting Credits
```tsx
import { db } from '@/core/db';
import { user } from '@/config/db/schema.postgres';
import { eq } from 'drizzle-orm';

// Check balance
const [currentUser] = await db
  .select()
  .from(user)
  .where(eq(user.id, userId));

if (currentUser.credits < cost) {
  throw new Error('Insufficient credits');
}

// Deduct credits
await db
  .update(user)
  .set({ credits: currentUser.credits - cost })
  .where(eq(user.id, userId));
```

### Uploading to R2
```tsx
import { uploadToR2, getPresignedUrl } from '@/shared/lib/r2';

// Direct upload
await uploadToR2(key, buffer, contentType);

// Presigned URL (for client upload)
const url = await getPresignedUrl(key, contentType);
```

### Calling RunningHub API
```tsx
import { 
  uploadFileToRunningHub, 
  submitTask, 
  getTaskStatus,
  downloadResult 
} from '@/shared/lib/runninghub';

// Upload files
const photoUrl = await uploadFileToRunningHub(photoBuffer, 'photo.jpg');
const videoUrl = await uploadFileToRunningHub(videoBuffer, 'video.mp4');

// Submit task
const taskId = await submitTask({
  photoUrl,
  videoUrl,
  resolution: '720p',
  duration: 5
});

// Check status
const status = await getTaskStatus(taskId);

// Download result
const resultBuffer = await downloadResult(status.resultUrl);
```

## Debugging

### Enable Debug Logs
```env
DEBUG=true
NODE_ENV=development
```

### Check Database
```bash
pnpm db:studio
```

### Check R2 Storage
- Use Cloudflare dashboard
- Or use R2 API directly

### Check RunningHub Tasks
- Check task status via API
- Review error messages in database

## Credit System

**Credit Costs:**
- 480p, 5s: 1 credit
- 720p, 5s: 2 credits
- 1080p, 5s: 3 credits
- +1 credit per additional 5 seconds

**Credit Packages:**
- Starter: 10 credits - $9.99
- Pro: 50 credits - $39.99
- Business: 100 credits - $69.99

## Migration Notes

This project was migrated from a standalone Next.js app to the ShipAny template:

**Preserved from Original:**
- Video generation logic (R2 + RunningHub)
- Credit system
- Creem payment integration
- Purple-blue gradient theme

**New from ShipAny:**
- Better Auth (replaced NextAuth)
- Blog system
- Advanced user management
- RBAC system
- Multi-language support (next-intl)
- Enhanced UI components

**Key Differences:**
- Auth: `useSession()` from Better Auth (not NextAuth)
- i18n: `useTranslations()` from next-intl (not custom hook)
- Database: Drizzle ORM with extended schema
- Layout: ShipAny's app router structure
