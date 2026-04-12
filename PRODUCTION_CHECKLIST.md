# Production Checklist

Use this checklist when validating the live Animaker AI system.

## Configuration

- Confirm `AUTH_URL` is `https://animaker.dev`
- Confirm `NEXT_PUBLIC_APP_URL` is `https://animaker.dev`
- Confirm `CREEM_WEBHOOK_SECRET` is set in Vercel Production
- Confirm `R2_BUCKET_NAME` is `make`
- Confirm `R2_PUBLIC_URL` matches the intended public bucket URL
- Confirm `RUNNINGHUB_WEBAPP_ID` matches the live workflow

## Creem

- Confirm the webhook URL is `https://animaker.dev/api/payment/webhook`
- Confirm the single-credit product ID matches the intended single package
- Confirm the 10-pack product ID matches the intended 10-pack package
- Confirm a successful checkout redirects back to `/dashboard?payment=success`
- Confirm duplicate webhook delivery does not grant duplicate credits

## Authentication

- Register a controlled test account
- Sign in successfully
- Confirm session persists across page navigation
- Confirm protected pages redirect correctly when signed out

## Credits

- Confirm new purchased credits appear in the credit table
- Confirm credit expiration days are correct:
  - single package: 30 days
  - 10-pack: 90 days
- Confirm task creation consumes 1 credit
- Confirm failed generation refunds 1 credit

## Video Generation

- Upload a photo successfully
- Upload a reference video successfully
- Create a task successfully
- Confirm the task is stored in table `tasks`
- Confirm RunningHub task ID is stored
- Confirm polling transitions from running to success or failed
- Confirm completed result is uploaded back to R2

## Database

- Confirm the production database has the expected `tasks` table
- Confirm the production database has the expected `orders` table
- Confirm Better Auth tables are healthy:
  - `user`
  - `session`
  - `account`
  - `verification`

## Logging And Ops

- Confirm Vercel function logs are accessible
- Confirm payment webhook failures can be identified from logs
- Confirm task creation failures can be identified from logs
- Confirm there is a known process for manual credit remediation

## Release Smoke Test

- Sign in
- Buy one package
- Verify credits increase
- Create one video task
- Verify credit decreases
- Verify task completes or fails cleanly
- If failed, verify refund is applied
