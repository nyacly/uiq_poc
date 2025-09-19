# UiQ Community Platform 🌟

A comprehensive community platform designed for the Ugandan community in Queensland, Australia. Connect local businesses, discover events, find services, and build meaningful community connections.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

---

## 🚀 Quick start (10 minutes)

| Step | Command | Notes |
| ---- | ------- | ----- |
| 1. Clone & install | `git clone https://github.com/nyacly/uiq_poc.git && cd uiq_poc && npm install` | Node.js 20+ recommended. |
| 2. Copy env template | `cp .env.example .env.local` | Set `DATABASE_URL`, `NEXTAUTH_SECRET`, Stripe keys, `NEXT_PUBLIC_MAPBOX_TOKEN`. |
| 3. Start PostgreSQL | `docker run --rm -it -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=uiq_dev -p 5432:5432 postgres:16` | Or point `DATABASE_URL` at an existing Postgres instance. |
| 4. Apply Drizzle migrations | `npx drizzle-kit push` | Uses `drizzle.config.ts` to create/update the Postgres schema. |
| 5. Prepare Prisma | `npm run db:push` | Creates the local SQLite file Prisma/NextAuth relies on. |
| 6. Seed demo data | `npm run db:seed` | Populates Postgres with admin, business owner, member, and rich sample content. |
| 7. Launch dev server | `npm run dev` | Visit http://localhost:5000. |

### Seeded personas

After the seed runs, list the generated user records if you need to inspect seeded data or role assignments:

```bash
psql "$DATABASE_URL" -c "select id, email, role from users order by email;"
```

| Email              | Role        | Description                     |
| ------------------ | ----------- | ------------------------------- |
| `admin@uiq.local`  | `admin`     | Platform administrator          |
| `owner@uiq.local`  | `moderator` | Business owner seeded for demos |
| `member@uiq.local` | `member`    | Everyday community member       |

Use `/auth/signup` (or `POST /api/auth/signup`) to create credentials for your own accounts, or configure Google OAuth to sign in with an existing email. Server-side routes now rely on NextAuth sessions instead of the development cookie shim.

---

## 🩺 Health check

- Endpoint: `GET http://localhost:5000/api/health`
- Scripted check: `npm run health-check`
  - Continuous mode: `npm run health-monitor`

Both paths should return `{ "status": "ok" }` when the app, database, and third-party integrations are responding.

---

## 🔐 Authentication flows

- **Email & password** – Call `POST /api/auth/signup` (or use `/auth/signup`) with `{ email, password, displayName }` to create an account. Subsequent logins go through NextAuth’s credentials provider.
- **Google OAuth** – Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. When present, Google appears as a provider on the sign-in page.
- **Server-side usage** – API routes call `getSessionUser()`/`requireUser()` which resolve the active NextAuth session and load role + membership tier from Postgres.

Automated tests can mint short-lived JWT session cookies the same way as `e2e/api-happy-path.spec.ts` does with `next-auth/jwt`.

## ✅ Tests & quality gates

| Purpose | Command |
| ------- | ------- |
| Linting | `npm run lint` |
| Type checking | `npm run type-check` |
| Unit/API tests | `npm run test` |
| Playwright E2E | `npm run test:e2e` |
| CI-equivalent suite | `npm run test:all` |

Playwright composes signed NextAuth session cookies (see `e2e/api-happy-path.spec.ts`) to authenticate requests without bypassing RBAC.

---

## 🧪 Webhook mocking (Stripe)

1. Ensure `npm run dev` is running.
2. Paste a user ID from the seed output into the payload below.
3. Send the request to the local webhook endpoint:

```bash
curl -X POST http://localhost:5000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "customer.subscription.created",
    "data": {
      "object": {
        "id": "sub_test_local",
        "status": "active",
        "customer": "cus_test_local",
        "metadata": { "userId": "<uuid-from-users-table>", "tier": "PLUS" },
        "items": { "data": [ { "price": { "metadata": { "tier": "PLUS" } } } ] },
        "current_period_start": 1735689600,
        "current_period_end": 1738281600
      }
    }
  }'
```

A successful call responds with `{ "received": true }`. To test against Stripe’s CLI, run `stripe listen --forward-to localhost:5000/api/stripe/webhook` and export `STRIPE_WEBHOOK_SECRET`.

---

## ☁️ Deployment (Vercel runbook)

Configure these variables in Vercel → Settings → Environment Variables for **Preview** and **Production**:

| Key | Why it matters |
| --- | -------------- |
| `DATABASE_URL` | Primary Postgres database (Neon/Supabase/RDS/etc.). |
| `NEXTAUTH_URL` | Full domain of the deployed site. |
| `NEXTAUTH_SECRET` | 32+ character secret for NextAuth JWTs. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Enable Google OAuth sign-in. |
| `STRIPE_SECRET_KEY` | Stripe secret key (live mode for production). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend key for Stripe Elements. |
| `STRIPE_WEBHOOK_SECRET` | Signature secret from Stripe dashboard. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Required for interactive maps. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Twilio SMS delivery. |
| Optional analytics (`SENTRY_DSN`, `GOOGLE_ANALYTICS_ID`, etc.) | Enable observability tooling. |
| Feature flags (`ENABLE_PAYMENTS`, `ENABLE_SMS_NOTIFICATIONS`) | Keep `true` to ship the full experience. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Configure Supabase Storage uploads (`service_role` is preferred in production). |

> 💡 Ship your Drizzle migrations (`drizzle/*.sql`) with every deploy. The CI/CD pipeline applies them before the Next.js build runs.

---

### 🖼️ Media storage

- **Development** – uploads remain local in `attached_assets/` and are served via `/assets/*` so existing URLs keep working.
- **Production/preview** – when `SUPABASE_URL` and either `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` are configured, `/api/uploads` streams files to the Supabase Storage bucket `public/uiq` and returns public URLs.
- **Bucket policies** – create a Supabase Storage bucket named `public` with a `uiq/` folder and lock it down with:

```sql
-- Allow anonymous public reads for published media
create policy "uiq_public_read"
on storage.objects for select
using (bucket_id = 'public');

-- Limit writes/deletes to the service role (API enforces owner/admin rules)
create policy "uiq_server_writes"
on storage.objects for all
using (bucket_id = 'public' and auth.role() = 'service_role')
with check (bucket_id = 'public' and auth.role() = 'service_role');
```

The upload API already checks the signed-in user’s role, so pairing those policies with the service-role key keeps the bucket private while maintaining public CDN access.

---

## ✨ Features

### 🏢 Business Directory
- Comprehensive local business listings
- Category-based browsing (restaurants, services, retail, etc.)
- Business profiles with contact information and reviews
- Location-based search with interactive maps
- Business verification and premium listings

### 📅 Community Events
- Event discovery and RSVP functionality
- Community calendar with filtering options
- Event categories (cultural, business, social, educational)
- Organizer tools for event management
- Location-based event recommendations

### 🛍️ Classifieds & Marketplace
- Buy/sell community marketplace
- Job postings and opportunities
- Housing and accommodation listings
- Services and professional offerings
- Messaging system (database schema ready, frontend UI in development)

### 👥 User Management
- User authentication and profiles
- Membership tiers (Free, Plus, Family)
- Business account management
- Community engagement features
- Privacy controls and settings

### 🔔 Communication
- Messaging system (database schema implemented, real-time features in development)
- Community announcements
- SMS notifications for verification (Twilio integration)
- Email updates and newsletters (planned)
- Push notifications (planned for mobile apps)

### 💳 Payments & Subscriptions
- Stripe payment processing
- Subscription management
- Business premium features
- Secure transaction handling
- Payment history and receipts

---

## 🏗️ Tech stack

### Frontend
- **Next.js 15.5.3** – App Router with React Server Components
- **TypeScript** – Fully typed codebase
- **Tailwind CSS** – Utility-first styling
- **React Hook Form** – Form state management
- **Lucide React** – Iconography
- **Mapbox GL** – Map visualisations

### Backend
- **Next.js API routes** – Serverless edge-first endpoints
- **Drizzle ORM** – Type-safe queries against Postgres
- **Row-Level Security (RLS)** – Enforced at the database layer

### Integrations
- **Stripe** – Payments and subscriptions
- **Twilio** – SMS notifications
- **Mapbox** – Mapping services
- **Vercel** – Hosting & edge runtime

### DevOps & CI/CD
- **GitHub Actions** – Automated CI/CD
- **Playwright & Jest** – E2E and unit testing
- **Lighthouse CI** – Performance monitoring
- **ESLint & Prettier** – Code quality tooling

---

## 🛠️ Development scripts

```bash
# Development
npm run dev          # Start Next.js locally
npm run build        # Production build
npm run start        # Run the build locally

# Quality & tests
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run test         # Jest
npm run test:e2e     # Playwright
npm run test:all     # Lint + type-check + Jest + Playwright

# Database (Prisma/Drizzle helpers)
npx drizzle-kit push # Apply Drizzle migrations
npm run db:seed      # Seed Postgres data
npm run db:push      # Sync Prisma SQLite schema for NextAuth
npm run db:studio    # Explore the Prisma SQLite DB

# Ops
npm run health-check # Single health probe
npm run performance  # Performance monitor script
npm run lighthouse   # Lighthouse CI audit
```

Project structure, CI/CD, security posture, and contribution guidelines remain unchanged from previous revisions—see below for reference.

---

## 📂 Project structure

```
├── .github/workflows/     # CI/CD pipelines
├── attached_assets/       # Project assets and uploads
├── drizzle/               # Generated SQL migrations
├── e2e/                   # Playwright tests
├── monitoring/            # Prometheus/Grafana configs
├── scripts/               # Utility scripts (health-check, performance, seed)
├── server/                # Server-side helpers (auth, db)
├── shared/                # Shared schema and types (Drizzle)
├── src/
│   ├── app/               # Next.js App Router pages & API routes
│   ├── components/        # React components by feature
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities (auth, stripe, etc.)
│   ├── styles/            # Global styles
│   └── types/             # TypeScript definitions
├── drizzle.config.ts      # Drizzle configuration
├── next.config.js         # Next.js configuration
├── package.json           # Scripts & dependencies
├── tailwind.config.js     # Tailwind configuration
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

---

## 🚦 CI/CD pipeline

### Continuous Integration
- ✅ ESLint & TypeScript
- ✅ Jest unit/API tests
- ✅ Playwright E2E tests
- ✅ Security scanning (Snyk, npm audit)
- ✅ Lighthouse CI performance budget

### Continuous Deployment
- ✅ Automatic deploys from `main` → Production (Vercel)
- ✅ Preview deploys for pull requests
- ✅ Environment variable management through Vercel
- ✅ Health and performance checks post-deploy

---

## 🔒 Security highlights

- Row-Level Security policies enforced in Postgres
- RBAC applied across server routes
- Zod validation at the edge for all API payloads
- Rate limiting for write-heavy endpoints
- Input sanitisation and hardened headers

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m "Add amazing feature"`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a pull request and request review

Please run `npm run test:all` before submitting and include screenshots for notable UI changes.

---

## 📄 License

MIT © UiQ Community Platform contributors

---

**Built with ❤️ for the Ugandan community in Queensland, Australia.**
