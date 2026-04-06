# Day 11: Deployment, CI/CD & Launch Preparation

## Goal
Deploy the app to production and set up continuous deployment so every push to main automatically deploys.

---

## Why This Day Matters
Until the app is live, no one can use it. This day ensures a smooth, automated deployment pipeline.

---

## Tasks

### 11.1 Vercel Deployment
- [ ] Connect repo to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Add all env vars from `.env.example`
- [ ] Deploy preview branch (feature branches → preview URLs)
- [ ] Deploy main branch → production
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Add `/dashboard` as protected route (requires auth — handled by middleware)
- [ ] Add `/.next` and `/node_modules` to cache

### 11.2 Supabase Production Setup
- [ ] Create production Supabase project (not development)
- [ ] Run `prisma migrate deploy` on production
- [ ] Verify all tables exist
- [ ] Configure RLS policies in Supabase dashboard
- [ ] Set up storage bucket for product images (if not already)
- [ ] Configure auth settings:
  - Enable Google OAuth
  - Enable phone OTP
  - Set session expiry
  - Configure redirect URLs (production domain)

### 11.3 CI/CD Pipeline (GitHub Actions)
Create file at `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

- [ ] Create `.github/workflows/deploy.yml` with the above content
- [ ] Add secrets in GitHub repo: Settings → Secrets → Actions:
  - `VERCEL_TOKEN` — from Vercel dashboard
  - `VERCEL_ORG_ID` — from Vercel project settings
  - `VERCEL_PROJECT_ID` — from Vercel project settings
- [ ] Test runs on every PR
- [ ] Deploy only on merge to main
- [ ] Add Slack notification on deploy success/failure (optional)

### 11.4 Domain & SSL
- [ ] Register domain (or use Vercel subdomain for now)
- [ ] Configure DNS: A record for Vercel
- [ ] Enable SSL (automatic with Vercel)
- [ ] Add `www` redirect

### 11.5 Monitoring & Observability
- [ ] Add Sentry for error tracking:
  - Install: `npm install @sentry/nextjs`
  - Configure DSN in env vars
  - Add error boundary in app
- [ ] Set up uptime monitoring (UptimeRobot or similar — free tier)
- [ ] Set up error alerting (Sentry + email)

### 11.6 Pre-Launch Checklist
- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] SSL certificate active
- [ ] Error tracking active
- [ ] Uptime monitoring active
- [ ] Test payment flow in production mode (Razorpay test mode)
- [ ] Verify all redirects work (HTTP → HTTPS, www → non-www)
- [ ] Check all API routes return proper status codes

### 11.7 Launch Announcement Assets
- [ ] Prepare launch email template (Mailchimp or Resend)
- [ ] Social media posts: Twitter, LinkedIn, WhatsApp Business
- [ ] Screenshot assets: POS screen, dashboard, mobile view
- [ ] Demo video (3-minute walkthrough)

---

## Deliverable
App deployed to production with automated CI/CD. Every push to main auto-deploys. Launch checklist complete.

---

## Dependencies
- Day 10 (tests passing)
- Vercel account
- Supabase production project
- Domain (optional for v1)
