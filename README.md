# Animaker AI

Animaker AI is a production Next.js application for AI-powered video generation.
Users upload a photo and a reference video, purchase credits, and generate animated output through RunningHub.

This repository started from ShipAny Template Two, but it should now be treated as a live product codebase rather than a template demo.

## Start Here

For current maintenance and AI-assisted work, use these files first:

- `README.md`
- `AGENTS.md`
- `PRODUCTION_BASELINE.md`
- `PRODUCTION_CHECKLIST.md`

Historical migration and handoff notes were moved to `docs/archive/` so they do not compete with the current operational source of truth.

## Production Status

- Production site: [animaker.dev](https://animaker.dev)
- Deployment platform: Vercel
- Database: Neon PostgreSQL
- Storage: Cloudflare R2
- Video provider: RunningHub
- Payment provider: Creem

## Core Flows

### Authentication

- Better Auth session handling
- Dynamic auth configuration loaded from the `config` table

### Credits

- Credits are granted through `grantCreditsForUser()`
- Credits are consumed through `consumeCredits()`
- Credits support expiration
- Consumption uses FIFO
- Failed video tasks should refund credits

Do not directly modify user credit balances.

### Video Generation

1. Client requests an upload URL from `/api/video/upload`
2. Client uploads source files to R2
3. Client calls `/api/video/task/create`
4. Server consumes 1 credit
5. Server uploads inputs to RunningHub
6. Server stores the task in the `tasks` table
7. Client polls `/api/video/task/[id]`
8. On success, the result is copied back to R2
9. On failure, the task is marked failed and credit is refunded

### Payments

1. Client enters Creem checkout through `/api/payment/creem/checkout`
2. Creem calls `/api/payment/webhook`
3. The app writes an order record
4. The app grants credits through the credit transaction system

## Important Files

- `src/app/api/video/upload/route.ts`
- `src/app/api/video/task/create/route.ts`
- `src/app/api/video/task/[id]/route.ts`
- `src/app/api/payment/creem/checkout/route.ts`
- `src/app/api/payment/webhook/route.ts`
- `src/shared/models/credit.ts`
- `src/shared/lib/r2.ts`
- `src/shared/lib/runninghub.ts`
- `src/config/db/schema.postgres.ts`
- `PRODUCTION_BASELINE.md`

## Environment Variables

Primary variables used by the current app:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `RUNNINGHUB_API_KEY`
- `RUNNINGHUB_WEBAPP_ID`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE`
- `NEXT_PUBLIC_CREEM_PRODUCT_ID_10PACK`

The codebase also contains fallback compatibility for legacy naming in a few places, but the list above should be treated as the preferred current convention.

## Local Development

```bash
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000).

## Database Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

## Notes For Maintainers

- Model names and table names are not always identical:
  - Drizzle model `order` maps to table `orders`
  - Drizzle model `videoTask` maps to table `tasks`
- Older handoff documents in the repository are historical only and may contain drift or encoding issues
- Archived historical documents now live under `docs/archive/`
- `PRODUCTION_BASELINE.md` is the current takeover reference

## Recommended Next Checks

- Verify sign-up and sign-in on production
- Verify Creem payment creates exactly one order and grants credits once
- Verify task creation consumes exactly one credit
- Verify failed tasks refund exactly one credit
- Verify R2 uploads land in the intended bucket
