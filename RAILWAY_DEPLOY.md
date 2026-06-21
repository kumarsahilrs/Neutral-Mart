# NirmalMandi — Railway + Vercel Deploy Runbook
**Stack: Neon PostgreSQL · Upstash Redis · Railway (backend) · Vercel (frontend)**

> Estimated time to first live transaction: **2–3 hours**

---

## Prerequisites

- Railway account → [railway.app](https://railway.app) (free tier OK for MVP)
- Vercel account → [vercel.com](https://vercel.com)
- Neon account → [neon.tech](https://neon.tech) (free tier)
- Upstash account → [upstash.com](https://upstash.com) (free tier)
- OpenAI account → [platform.openai.com](https://platform.openai.com)
- Razorpay test account → [razorpay.com](https://razorpay.com)

---

## Step 1 — Generate JWT Keys

Run once on your machine. Keep these secret — set them as env vars only.

```bash
node scripts/generate-jwt-keys.js
```

Copy `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` — you'll need them in Step 5.

---

## Step 2 — Neon PostgreSQL

1. Create a free project at [neon.tech](https://console.neon.tech)
2. Create a database named `nirmalmandi`
3. Copy your connection string: `postgresql://user:pass@host.neon.tech/nirmalmandi?sslmode=require`
4. Run all 8 migrations **in order** using the Neon SQL editor or psql:

```bash
# If using psql locally:
export DATABASE_URL="postgresql://user:pass@host.neon.tech/nirmalmandi?sslmode=require"
psql $DATABASE_URL < infra/migrations/001_initial_schema.sql
psql $DATABASE_URL < infra/migrations/002_missing_columns.sql
psql $DATABASE_URL < infra/migrations/003_watchlist_and_compare.sql
psql $DATABASE_URL < infra/migrations/004_dispute_schema_fix.sql
psql $DATABASE_URL < infra/migrations/005_sprint13_rfq_voice_compliance.sql
psql $DATABASE_URL < infra/migrations/006_sprint14_bi_engines.sql
psql $DATABASE_URL < infra/migrations/007_sprint15_storefront.sql
psql $DATABASE_URL < infra/migrations/008_sprint16_compliance_bnpl.sql
psql $DATABASE_URL < infra/migrations/009_google_oauth.sql
```

5. Create admin user (replace phone number):
```sql
INSERT INTO users (id, phone, role, full_name, is_verified)
VALUES (gen_random_uuid(), '+919876543210', 'admin', 'Admin User', true);
```

---

## Step 3 — Upstash Redis

1. Create a Redis database at [upstash.com](https://console.upstash.com)
2. Select **Regional** (ap-south-1 for India latency)
3. Copy the `REDIS_URL` — it starts with `rediss://` (double s = TLS)

---

## Step 4 — Railway Projects

Railway works best with **one service per Railway project**, or all in one project using services.

### 4a. Create Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Choose "Empty Project"
3. Name it `nirmalmandi-backend`

### 4b. Deploy each service

For each service below, click **"+ New Service" → "GitHub Repo"** → select your repo → set **Root Directory**.

| Service name | Root directory | Port |
|---|---|---|
| `auth-service` | `packages/auth-service` | 3001 |
| `inventory-service` | `packages/inventory-service` | 3002 |
| `order-service` | `packages/order-service` | 3003 |
| `search-service` | `packages/search-service` | 3004 |
| `payment-service` | `packages/payment-service` | 3005 |
| `notification-service` | `packages/notification-service` | 3006 |
| `logistics-service` | `packages/logistics-service` | 3007 |
| `analytics-service` | `packages/analytics-service` | 3008 |
| `dispute-service` | `packages/dispute-service` | 3009 |
| `invoice-service` | `packages/invoice-service` | 3011 |
| `ai-service` | `ai-service` | 8000 |

**Important:** Each `railway.toml` in those directories tells Railway exactly how to build + start. Railway auto-detects and uses it.

### 4c. After deploying — note down public URLs

Railway gives each service a URL like `auth-service-production-xxxx.up.railway.app`.
You need these for the Vercel env vars in Step 6.

---

## Step 5 — Environment Variables (set on EVERY Railway service)

Go to each service → **Variables** tab → add these:

### Required on ALL services
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/nirmalmandi?sslmode=require
REDIS_URL=rediss://default:TOKEN@HOST.upstash.io:6379
JWT_PUBLIC_KEY=<base64 public key from Step 1>
INTERNAL_SERVICE_SECRET=<generate: openssl rand -hex 32>
NODE_ENV=production
PLATFORM_GSTIN=27AABCA1234A1Z5
```

### auth-service ONLY (add to the above)
```
JWT_PRIVATE_KEY=<base64 private key from Step 1>

# Email OTP (RECOMMENDED — free, instant, no DLT needed)
EMAIL_OTP_PROVIDER=resend
RESEND_API_KEY=re_xxxxx                    # resend.com → API Keys (free)
EMAIL_FROM=NirmalMandi <noreply@yourdomain.com>

# SMS OTP (Fast2SMS — cheapest Indian SMS, ~₹0.05-0.12/msg)
OTP_PROVIDER=fast2sms
FAST2SMS_API_KEY=<your-fast2sms-key>       # fast2sms.com → Developer → API Key

# SMS backup providers (optional)
MSG91_AUTH_KEY=<your MSG91 key>
MSG91_TEMPLATE_ID=<your template ID>
MSG91_SENDER_ID=NRMNDM

# Google OAuth (optional — enables "Sign in with Google")
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

### payment-service ONLY
```
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=<your secret>
RAZORPAY_WEBHOOK_SECRET=<your webhook secret>
```

### notification-service ONLY
```
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=<token>
TWILIO_WHATSAPP_FROM=+14155238886
FIREBASE_PROJECT_ID=<your-project>
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### ai-service ONLY
```
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXX
```

### inventory-service + invoice-service + logistics-service
```
AWS_REGION=ap-south-1
S3_BUCKET_NAME=nirmalmandi-dev
CLOUDFRONT_URL=https://d1234.cloudfront.net
```
*(Or use Cloudinary — set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)*

### search-service
```
ELASTICSEARCH_URL=https://your-opensearch-endpoint
```
*(For MVP, skip Elasticsearch — use Postgres-only search by setting `ELASTICSEARCH_URL=` empty; the service falls back gracefully)*

### Inter-service URLs (set on each service — use Railway internal URLs for zero-cost networking)
```
AUTH_SERVICE_URL=https://auth-service-production-xxxx.up.railway.app
INVENTORY_SERVICE_URL=https://inventory-service-production-xxxx.up.railway.app
ORDER_SERVICE_URL=https://order-service-production-xxxx.up.railway.app
SEARCH_SERVICE_URL=https://search-service-production-xxxx.up.railway.app
PAYMENT_SERVICE_URL=https://payment-service-production-xxxx.up.railway.app
NOTIFICATION_SERVICE_URL=https://notification-service-production-xxxx.up.railway.app
LOGISTICS_SERVICE_URL=https://logistics-service-production-xxxx.up.railway.app
ANALYTICS_SERVICE_URL=https://analytics-service-production-xxxx.up.railway.app
DISPUTE_SERVICE_URL=https://dispute-service-production-xxxx.up.railway.app
INVOICE_SERVICE_URL=https://invoice-service-production-xxxx.up.railway.app
AI_SERVICE_URL=https://ai-service-production-xxxx.up.railway.app
```

---

## Step 6 — Vercel (Web + Admin)

### 6a. Deploy web portal
1. `vercel.com/new` → Import Git repo → select `nirmalmandi`
2. Set **Root Directory** = `web`
3. Framework Preset = Next.js
4. Add env vars:

```
NEXT_PUBLIC_API_URL=https://auth-service-production-xxxx.up.railway.app
# All service URLs as NEXT_PUBLIC_ prefixed vars
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
```

**Important:** The web app uses Next.js API routes as a proxy (`/api/*` → backend services). Check `web/next.config.js` for the rewrite rules — update service URLs there.

### 6b. Deploy admin console
1. `vercel.com/new` → same repo → set **Root Directory** = `admin`
2. Framework Preset = Next.js
3. Same env vars + add:
```
NEXT_PUBLIC_API_BASE_URL=https://auth-service-production-xxxx.up.railway.app
```

---

## Step 7 — Razorpay Webhook

1. Razorpay dashboard → Settings → Webhooks → Add webhook
2. URL: `https://payment-service-production-xxxx.up.railway.app/payments/webhook`
3. Events to subscribe: `payment.captured`, `payment.failed`
4. Copy the webhook secret → set `RAZORPAY_WEBHOOK_SECRET` on payment-service

---

## Step 8 — Smoke Test

Once all services are green on Railway:

```bash
BASE=https://auth-service-production-xxxx.up.railway.app

# Health check all services
curl $BASE/health                                           # auth
curl https://inventory-service-XXXX.up.railway.app/health  # inventory
curl https://order-service-XXXX.up.railway.app/health      # orders

# Send OTP (dev mode: logs to Railway console)
curl -X POST $BASE/auth/otp/send \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210"}'

# Verify OTP (check Railway logs for the code)
curl -X POST $BASE/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210","otp":"XXXXXX"}'
# → Returns access_token. Test protected route:

curl https://inventory-service-XXXX.up.railway.app/listings \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Step 9 — First Real Transaction Checklist

- [ ] Admin login at `your-admin.vercel.app` (use the phone from Step 2)
- [ ] Create a test sector: Admin → Categories → Add
- [ ] Register test seller via `your-web.vercel.app/seller-register`
- [ ] Approve seller KYC: Admin → KYC
- [ ] Create a test listing as seller
- [ ] Register test buyer, browse, add to cart, checkout
- [ ] Use Razorpay test card: `4111 1111 1111 1111` CVV `123` Expiry `12/25`
- [ ] Confirm payment.captured webhook received (Railway logs on payment-service)
- [ ] Confirm escrow created (status `held` in DB)
- [ ] Buyer confirms delivery → escrow released

---

## Costs at MVP scale (~100 users, ~10 orders/day)

| Service | Free tier | When you'll need paid |
|---|---|---|
| Neon PostgreSQL | 0.5 GB, 1 compute | ~500 MB data |
| Upstash Redis | 256 MB, 10K req/day | High notification volume |
| Railway | $5/mo starter, $0.000463/CPU-sec | Always-on services need hobby plan |
| Vercel | Free for hobby | Custom domain needs pro |
| OpenAI | Pay per use | ~$0.01–0.10 per AI action |
| Razorpay | 2% per transaction | No fixed cost |

**Estimated MVP running cost: ~$5–15/month**

---

## Rollback

```bash
# Railway: in the service dashboard, click Deployments → previous → Redeploy
# Vercel: Deployments → previous → Promote to Production
# DB: Neon supports point-in-time restore on paid plans
```

---

## Next steps after MVP

1. Add Elasticsearch/OpenSearch for full-text search (currently uses Postgres LIKE queries as fallback)
2. Add Cloudinary for image uploads (currently uses S3 which needs AWS account)
3. Switch Razorpay to live mode
4. Set up MSG91 for real OTP SMS
5. Add Firebase for push notifications
6. Enable Datadog (add `DD_API_KEY` to all Railway services)
