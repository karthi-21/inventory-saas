# Vercel Deployment Guide — OmniBIZ

This guide covers deploying OmniBIZ (Next.js 16 + Prisma + Supabase + Razorpay) to Vercel.

---

## 1. Connect the GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with your GitHub account.
2. Click **"Add New Project"** and select **"Import Git Repository"**.
3. Find the OmniBIZ repository in the list and click **Import**.
4. Vercel auto-detects the Next.js framework. The `vercel.json` in the repo root overrides defaults with the correct build and install commands.

---

## 2. Environment Variables

Set the following in **Settings > Environment Variables** in the Vercel dashboard. Add them for **Production**, **Preview**, and **Development** unless noted otherwise.

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `DATABASE_URL` | Prisma connection string (pooler URL) | Yes |
| `DIRECT_URL` | Prisma direct connection URL for migrations | Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification secret | Yes |
| `RESEND_API_KEY` | Resend email API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://omnibiz.vercel.app`) | Yes |

**Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secrets in them.
- `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` must **only** be used in server-side code (Route Handlers, Server Actions, Server Components).
- For `DATABASE_URL`, use the Supabase pooler connection string (port 6543) for serverless environments. For `DIRECT_URL`, use the direct connection string (port 5432).

---

## 3. Vercel GitHub Integration

The Vercel GitHub integration enables automatic deployments on every push.

1. After importing the repo (step 1), Vercel installs the **Vercel for GitHub** app on the repository automatically.
2. If it does not, go to [github.com/apps/vercel](https://github.com/apps/vercel) and install it, granting access to the OmniBIZ repository.
3. Once installed, every push to the production branch triggers a production deployment.
4. Pull requests receive preview deployments automatically (see section 4).

---

## 4. Branch Deployments (Preview Deploys)

By default, Vercel creates a **preview deployment** for every push to a non-production branch and for every pull request.

### Configuration

In **Settings > Git** in the Vercel dashboard:

- **Production Branch**: Set to `main` (or your preferred branch). Only pushes to this branch deploy to production.
- **Preview Deployments**: Enabled by default. Every PR gets a unique preview URL (e.g. `omnibiz-git-feature-xyz-yourteam.vercel.app`).
- **Ignored Build Step** (optional): Skip preview deploys for documentation-only changes by setting a custom ignore command:
  ```
  git diff --quiet HEAD^ HEAD -- . ':!docs' ':!*.md'
  ```

### Preview Environment Variables

If preview deployments need different variable values (e.g. a staging Supabase project), override them in **Settings > Environment Variables** by scoping values to the **Preview** environment.

---

## 5. Build Details

The `vercel.json` in the repository root configures the build:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm ci",
  "regions": ["bom1"]
}
```

- **buildCommand**: Runs `prisma generate` before `next build` so the Prisma Client is available at build time.
- **installCommand**: Uses `npm ci` for deterministic installs.
- **regions**: Deployed to `bom1` (Mumbai) for lowest latency to Indian retail users. Change this in `vercel.json` if a different region is preferred. Available regions: `iad1` (US East), `sfo1` (US West), `cdg1` (Paris), `bom1` (Mumbai), `hnd1` (Tokyo), etc.

---

## 6. Post-Deployment Checklist

- [ ] Verify the production URL loads the app correctly.
- [ ] Test Supabase auth (sign up, sign in).
- [ ] Confirm Razorpay checkout flow works end-to-end.
- [ ] Check that webhook endpoints respond (Razorpay webhooks).
- [ ] Verify email sending via Resend works.
- [ ] Run `npx prisma migrate status` to confirm database migrations are applied.
- [ ] Review Vercel **Deployment Logs** for any warnings.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Prisma Client not generated | Ensure `buildCommand` in `vercel.json` includes `npx prisma generate` before `next build`. |
| Database connection timeouts | Use the Supabase pooler URL (port 6543) for `DATABASE_URL`. Serverless functions need pooled connections. |
| Razorpay webhooks failing | Verify `RAZORPAY_WEBHOOK_SECRET` matches the secret configured in the Razorpay dashboard. |
| Environment variable missing at runtime | Check the variable is set for the correct environment (Production / Preview / Development) in the Vercel dashboard. |