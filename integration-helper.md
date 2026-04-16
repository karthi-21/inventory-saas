Here's the full breakdown for both integrations:

  ———

  ## Dodo Payments — SaaS Subscriptions

  This is what your customers pay you (Ezvento) for their monthly/yearly Launch/Grow/Scale subscription.

  ### Env Variables

  | Variable | Server or UI? | What It Does | Example Value |
  |---|---|---|---|
  | DODO_API_KEY | Server only | Authenticates all Dodo API calls (checkout, subscription management) | dodo_test_abc123... |
  | DODO_WEBHOOK_SECRET | Server only | Verifies webhook signatures so nobody can fake payment events | whsec_abc123... |
  | DODO_BASE_URL | Server only | API base URL — sandbox for testing, production when live |
  https://api.sandbox.dodopayments.com |
  | DODO_LAUNCH_PLAN_ID | Server only | Dodo's product ID for the Launch plan you created | prod_abc123... |
  | DODO_GROW_PLAN_ID | Server only | Dodo's product ID for the Grow plan you created | prod_xyz789... |
  | NEXT_PUBLIC_DODO_PUBLIC_KEY | UI + Server | Currently not used in code (kept for future client-side checkout) |
  dodo_pub_abc... |

  None of the Dodo env vars (except NEXT_PUBLIC_DODO_PUBLIC_KEY) are exposed to the browser. All API calls happen server-side in
  route handlers.

  ### How to Get Each Key

  Step 1: Sign up

  1. Go to https://dashboard.dodopayments.com (https://dashboard.dodopayments.com)
  2. Create an account (email, password)
  3. Verify your email

  Step 2: Get DODO_API_KEY

  1. Log into the Dodo dashboard
  2. Go to Settings → API Keys (or Developer → API Keys)
  3. You'll see two keys:
      - Test mode key — starts with dodo_test_... (use this during development)
      - Live mode key — starts with dodo_live_... (use this in production)
  4. Copy the Test mode key for now → this goes in DODO_API_KEY
  5. ⚠️ Never put the live key in .env.local until you're ready to go live

  Step 3: Get DODO_WEBHOOK_SECRET

  1. In the Dodo dashboard, go to Settings → Webhooks
  2. Click Add Endpoint
  3. Enter your webhook URL: https://yourdomain.com/api/payments/dodo-webhook
  4. Select events: subscription.created, subscription.active, subscription.renewed, subscription.cancelled,
     subscription.past_due, payment.succeeded, payment.failed
  5. After saving, Dodo shows you a Signing Secret (starts with whsec_...)
  6. Copy it → this goes in DODO_WEBHOOK_SECRET
  7. ⚠️ This secret is shown only once. Save it immediately.

  Step 4: Create Plans and get DODO_LAUNCH_PLAN_ID + DODO_GROW_PLAN_ID

  1. In the Dodo dashboard, go to Products (or Catalog)
  2. Click Create Product or Add Product
  3. Create the Launch plan:
      - Name: Ezvento Launch
      - Type: Recurring / Subscription
      - Price: ₹999/month
      - Billing cycle: Monthly
      - Currency: INR
  4. After saving, Dodo assigns a Product ID (looks like prod_abc123xyz or a slug)
  5. Copy that ID → this goes in DODO_LAUNCH_PLAN_ID
  6. Repeat for Grow plan: Name Ezvento Grow, Price ₹2,499/month → copy its Product ID → DODO_GROW_PLAN_ID
  7. For Scale plan: Dodo doesn't need a product ID since it's custom/pricing-contact-sales

  Step 5: Set DODO_BASE_URL

  - Sandbox (testing): https://api.sandbox.dodopayments.com
  - Production (live): https://api.dodopayments.com
  - Use sandbox until you're ready to accept real money

  Step 6: NEXT_PUBLIC_DODO_PUBLIC_KEY

  - Some payment gateways expose a public key for client-side checkout
  - Dodo may provide this under Settings → API Keys as a "Publishable Key" or "Public Key"
  - Currently Ezvento does all Dodo interactions server-side (redirect-based checkout), so this is optional for now
  - If Dodo offers a client-side JS SDK later, this key would be used in browser code

  ### Dodo Dashboard Quick Reference

  | What You Need | Dashboard Path | What It's Called in Dodo UI |
  |---|---|---|
  | API Key | Settings → API Keys | "Secret Key" or "API Key" |
  | Webhook Secret | Settings → Webhooks | "Signing Secret" or "Webhook Secret" |
  | Launch Plan ID | Products → Your Product | "Product ID" or "Product Slug" |
  | Grow Plan ID | Products → Your Product | "Product ID" or "Product Slug" |
  | Public Key | Settings → API Keys | "Publishable Key" or "Public Key" |

  ———

  ## PhonePe — POS In-Store Payments

  This is what your retailer's customers pay the retailer with (UPI scan, PhonePe app). PhonePe processes the payment and sends
  it to the retailer's bank account.

  ### Env Variables

  | Variable | Server or UI? | What It Does | Example Value |
  |---|---|---|---|
  | PHONEPE_MERCHANT_ID | Server only | Your merchant ID — identifies your business to PhonePe | MERCHANTUATXXXX |
  | PHONEPE_SALT_KEY | Server only | Secret key used to generate X-VERIFY signature on every API call | abc123def456... |
  | PHONEPE_SALT_INDEX | Server only | Index number of the salt key (usually 1) | 1 |
  | PHONEPE_API_URL | Server only | API base URL — sandbox for testing, production when live |
  https://api-preprod.phonepe.com/apis/pg-sandbox |
  | PHONEPE_CALLBACK_URL | Server only | URL PhonePe calls after payment completes (your webhook) |
  https://yourdomain.com/api/payments/pos/webhook |
  | PHONEPE_REDIRECT_URL | Server only | URL to redirect the customer's browser after payment |
  https://yourdomain.com/dashboard/billing |

  All PhonePe env vars are server-only. Nothing is exposed to the browser. The POS page initiates payment via your server API
  route, which then calls PhonePe server-to-server.

  ### How to Get Each Key

  Step 1: Sign up for PhonePe PG

  1. Go to https://developer.phonepe.com (https://developer.phonepe.com)
  2. Click Register or Sign Up
  3. Create a developer account (email, business details)
  4. For testing: PhonePe provides a sandbox/preprod environment automatically
  5. For production: You need to complete PhonePe's merchant onboarding (PAN, bank account, business proof)

  Step 2: Get PHONEPE_MERCHANT_ID

  1. Log into the PhonePe Developer Portal (https://developer.phonepe.com (https://developer.phonepe.com))
  2. Go to Dashboard or Profile
  3. You'll see your Merchant ID — it looks like MERCHANTUATXXXX (for UAT/sandbox) or MERCHANTXXXX (for production)
  4. Copy it → this goes in PHONEPE_MERCHANT_ID
  5. In the PhonePe dashboard, this is labeled "Merchant ID" or "MID"

  Step 3: Get PHONEPE_SALT_KEY and PHONEPE_SALT_INDEX

  1. In the PhonePe Developer Portal, go to API Keys or Credentials or Integration Settings
  2. You'll see a section with:
      - Salt Key (also called "Salt" or "API Key") — a long random string like abc123def456ghi789...
      - Salt Index — a number, usually 1 (if you've only generated one key)
  3. If you don't see any keys, click Generate Key or Create Salt Key
  4. Copy the Salt Key → PHONEPE_SALT_KEY
  5. Copy the Salt Index (usually 1) → PHONEPE_SALT_INDEX
  6. ⚠️ The Salt Key is the most sensitive credential — if it leaks, anyone can make API calls on your behalf. Never commit it to
     git.

  Step 4: Set PHONEPE_API_URL

  - Sandbox/UAT (testing): https://api-preprod.phonepe.com/apis/pg-sandbox
  - Production (live money): https://api.phonepe.com/apis/pg
  - Use sandbox until your integration is verified by PhonePe

  Step 5: Set PHONEPE_CALLBACK_URL

  - This is the URL on your server that PhonePe calls after a payment
  - Set it to: https://yourdomain.com/api/payments/pos/webhook
  - For local dev: http://localhost:3003/api/payments/pos/webhook (PhonePe can't reach localhost, so use ngrok for testing)
  - ⚠️ PhonePe needs to be able to reach this URL. For sandbox testing, use ngrok (https://ngrok.com) to expose your local serve
    r.

  Step 6: Set PHONEPE_REDIRECT_URL

  - This is where the customer's browser goes after completing/cancelling payment
  - Set it to: https://yourdomain.com/dashboard/billing
  - For local dev: http://localhost:3003/dashboard/billing

  ### PhonePe Dashboard Quick Reference

  | What You Need | Dashboard Path | What It's Called in PhonePe UI |
  |---|---|---|
  | Merchant ID | Dashboard → Profile / Home | "Merchant ID" or "MID" |
  | Salt Key | Integration Settings → API Keys | "Salt Key" or "Salt" |
  | Salt Index | Integration Settings → API Keys | "Salt Index" (number next to the key) |
  | Callback URL | Integration Settings → Callback | "Callback URL" or "Webhook URL" |
  | Production approval | Dashboard → Go Live | "Go Live" / "Production Activation" |

  ———

  ## Testing Flow

  ### Dodo Payments — Test a Subscription

  1. Use sandbox DODO_BASE_URL and dodo_test_ API key
  2. Go through your Ezvento signup → payment page
  3. Click "Pay Now" → redirected to Dodo's sandbox checkout
  4. Dodo sandbox lets you simulate success/failure without real payment
  5. Check DODO_WEBHOOK_SECRET works by checking your server logs after checkout

  ### PhonePe — Test a UPI Payment

  1. Use sandbox PHONEPE_API_URL with UAT credentials
  2. In the POS, select "UPI" payment → your server calls PhonePe sandbox
  3. PhonePe sandbox returns a simulated payment response
  4. For full end-to-end testing with a real UPI app, you'll need PhonePe's Test App or use ngrok to expose your local server

  ### Going Live Checklist

  - [ ] Replace dodo_test_ key with dodo_live_ key
  - [ ] Replace DODO_BASE_URL with production URL
  - [ ] Replace PhonePe UAT Merchant ID + Salt Key with production credentials
  - [ ] Replace PHONEPE_API_URL with production URL
  - [ ] Update webhook URL in Dodo dashboard to your production domain
  - [ ] Update callback URL in PhonePe dashboard to your production domain
  - [ ] Remove all placeholder values from .env.local
  - [ ] Set all env vars in Vercel dashboard (Settings → Environment Variables)
  - [ ] Test with a small real transaction (₹1)