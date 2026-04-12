# Production Baseline

This document is the current-state takeover baseline for `animaker-new`.
It is intended to replace older handoff notes as the primary operational reference.

## Purpose

Treat this repository as a live system, not a greenfield migration.

When documentation conflicts:

1. Runtime code wins.
2. Production environment configuration wins.
3. Database schema and live provider dashboards win.
4. Older handoff notes are historical context only.

## Current Product Shape

Animaker AI is a Next.js App Router application built on top of ShipAny Template Two.
It provides:

- Better Auth authentication
- credit-based billing
- Creem checkout and webhook-based credit fulfillment
- Cloudflare R2 media storage
- RunningHub video generation task orchestration

## Source Of Truth

Use these files first when validating behavior:

- `src/app/api/video/upload/route.ts`
- `src/app/api/video/task/create/route.ts`
- `src/app/api/video/task/[id]/route.ts`
- `src/app/api/payment/creem/checkout/route.ts`
- `src/app/api/payment/webhook/route.ts`
- `src/shared/models/credit.ts`
- `src/shared/lib/r2.ts`
- `src/shared/lib/runninghub.ts`
- `src/config/db/schema.postgres.ts`
- `.env.example`

## Verified Current Conventions

### Environment variables

Primary variables currently used by code:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` or `NEXT_PUBLIC_APP_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME` with fallback support for legacy `R2_BUCKET`
- `R2_PUBLIC_URL`
- `RUNNINGHUB_API_KEY`
- `RUNNINGHUB_WEBAPP_ID`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE`
- `NEXT_PUBLIC_CREEM_PRODUCT_ID_10PACK`

### Database naming

Important mappings in Postgres schema:

- Drizzle model `order` maps to table `orders`
- Drizzle model `videoTask` maps to table `tasks`

Do not trust older docs that refer to these as if model names and table names are the same.

### Credit handling

Credits must go through:

- `consumeCredits()`
- `grantCreditsForUser()`

Do not directly mutate a user credit balance.

## Operational Flows

### Upload and generation flow

1. Client requests upload URL from `/api/video/upload`
2. Client uploads media directly to R2
3. Client calls `/api/video/task/create`
4. Server consumes 1 credit
5. Server downloads uploaded files from R2
6. Server uploads files to RunningHub
7. Server stores task record in `tasks`
8. Client polls `/api/video/task/[id]`
9. On success, result is downloaded and uploaded back to R2
10. On failure, credit is refunded

### Payment flow

1. Client navigates to `/api/payment/creem/checkout`
2. Checkout is created with Creem using product ID
3. Creem webhook calls `/api/payment/webhook`
4. Server writes an `orders` record
5. Server grants credits using the credit transaction system

## Immediate Risks To Validate In Production

These are the first things to verify in a controlled account:

- Sign-up and sign-in still work against the current production database schema
- Creem success callback returns to the correct domain
- Creem webhook is configured to the correct environment and grants credits exactly once
- R2 uploads are writing to the intended bucket
- Video creation consumes credits once and only once
- Failed tasks refund credits once and only once

## Known Documentation Drift

Older handoff files have drift and should not be treated as authoritative because they include:

- mixed environment variable names
- mixed table names
- migration-era language that no longer matches a live project
- duplicate claims about completion state
- encoding corruption and unreadable sections

## Takeover Checklist

### P0

- Confirm actual production env vars in hosting platform
- Confirm current Creem webhook URL and secret
- Confirm actual R2 bucket name and public URL
- Confirm `tasks` and `orders` table shape in production
- Run a controlled payment test
- Run a controlled video-generation test

### P1

- Replace old handoff docs with a maintained runbook
- Add a rollback and incident section
- Add ownership notes for external services

### P2

- Remove stale migration-only docs or archive them
- Refresh `README.md` so it reflects the real product
- Add a simple smoke-test checklist for release verification

## Change Log

This baseline was created after reconciling the repository with the existing handoff documents and current code paths.
