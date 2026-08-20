# Beauty App

A salon discovery and booking platform for South African beauty businesses: customers
find salons, view services, and book appointments with a deposit paid up front;
salon owners onboard their business, manage services/hours/pricing, get paid out
automatically, and track bookings and revenue from a dashboard.

Built on Convex (reactive backend + database) and Clerk (auth), with Paystack handling
real payments — deposits collected on booking, then split and paid out to each
business's own subaccount.

## Core features

- **Discovery & booking** — geospatial "near me" salon search (`@convex-dev/geospatial`),
  category browsing, live availability computed from each business's hours and existing
  bookings, deposit-based checkout via Paystack
- **Business dashboard** — onboarding, service catalog (pricing/duration/visibility),
  business hours, booking management, revenue/analytics, subscription tiers,
  verification badge, banking details for payouts
- **Payments** — Paystack integration: deposit collection, commission-capped splits to
  business subaccounts, webhook-driven payment status updates, automatic cancellation of
  orphaned/abandoned bookings
- **Notifications** — in-app notifications plus SMS via Twilio (booking confirmations,
  reminders)
- **Reviews & favorites**
- **Scheduled jobs** — Convex crons for cleaning up expired holds/orphaned bookings and
  sending reminders

## Tech stack

- **Frontend:** Next.js 16, React 19, TanStack Query (via `@convex-dev/react-query`)
  + TanStack Form, Zod, Tailwind
- **Backend:** [Convex](https://convex.dev) — reactive database, server functions
  (queries/mutations/actions), scheduled crons, HTTP actions for webhooks
- **Auth:** [Clerk](https://clerk.com), synced into Convex via a `clerk-users` webhook
- **Payments:** [Paystack](https://paystack.com) — deposits, subaccount splits, webhook
  verification
- **Notifications:** Twilio (SMS)

## Architecture

```
convex/         Server-side logic — this is the backend, not a separate service.
  schema.ts       Table definitions (users, business, service, booking, bookingPayment,
                  paymentSplits, notifications, reviews, favorites, businessBanking, ...)
  http.ts         Webhook endpoints: /clerk-users (user sync), /api/paystack/notify
  paystack/       Split calculation, signature verification, Paystack API calls
  booking/        Availability computation, slot locking, booking lifecycle
  business/       Onboarding, business admin operations
  crons.ts        Scheduled cleanup (orphaned bookings) and reminders

app/            Next.js App Router frontend — talks to Convex directly via
                generated hooks/`@convex-dev/react-query`, no custom REST layer.
proxy.ts        Clerk middleware (route protection)
```

## Running it locally

### Prerequisites

- Node.js 20+ and npm
- A [Convex](https://dashboard.convex.dev) project
- A [Clerk](https://dashboard.clerk.com) application (configured as a Convex JWT
  template — see [Convex's Clerk guide](https://docs.convex.dev/auth/clerk))
- A [Paystack](https://dashboard.paystack.com) account (test keys are fine)
- A Google Maps API key (Places autocomplete + geocoding)
- Optional: a Twilio account for SMS notifications

### Setup

```bash
npm install
npx convex dev   # provisions/links your Convex deployment, watches convex/
```

In a separate terminal, set the following in `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=            # from `npx convex dev`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=           # Clerk Frontend API URL, also set on the Convex dashboard
CLERK_WEBHOOK_SECRET=              # from the Clerk webhook pointed at <convex-url>/clerk-users
GOOGLE_MAPS_API_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_URL=https://api.paystack.co
SPLIT_MAX=                         # commission cap for business payout splits
APP_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=                # optional — SMS notifications
TWILIO_AUTH_TOKEN=                 # optional
```

Then:

```bash
npm run dev
```

Open http://localhost:3000. In the Clerk dashboard, point a webhook at
`<your-convex-url>/clerk-users` (user sync) and in Paystack, point a webhook at
`<your-convex-url>/api/paystack/notify` (payment events).

## The Go rebuild

There's a second version of this app in a separate repo, rebuilt on a **self-built Go
REST API** instead of Convex + Clerk — same product, same frontend, different backend
philosophy:

**https://github.com/Jiexi-Ash/beauty-app-with-go-server**

That version exists to demonstrate designing and building backend infrastructure
directly (schema design, migrations, auth, REST API) rather than composing
backend-as-a-service and auth providers, which is what this repo does. It's a smaller
slice of the feature set here — payments, notifications, and geospatial search aren't
ported — but everything it does implement talks to a real Postgres-backed API written
from scratch.
