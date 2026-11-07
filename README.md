# 360 Kids Web

Next.js + TypeScript web application with responsive family, provider and admin workspaces. Uses the shared Express API and Supabase browser authentication.

## Setup (PowerShell)

Node.js 24.22.1:

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill the public Supabase URL/key and API URL.
npm run dev
```

Open http://localhost:3000. Start `360kids-backend` separately on port 4000. No sample activity data is presented as a real catalog. Missing service configuration is shown as a recoverable error.

```powershell
npm run lint
npm run typecheck
npm run build
```

## Routes

- `/`, `/activities`, `/activities/:id`: discovery, search/category filter, session selection, cancellation terms and multi-child booking requests.
- `/sign-in`: email/password sign-in and account creation via Supabase. Email/password is an implementation assumption pending the final login-method decision. Configure confirmation emails in Supabase. Recovery/social login remain outstanding.
- `/account`, `/account/bookings`, `/account/children`, `/account/settings`: family overview, booking tracking, revised-price approval, children and account details.
- `/become-a-provider`, `/provider/*`: applications, own published activities/corrections, incoming requests and booking actions.
- `/admin/*`: booking operations, provider review, activity publishing, payment/refund review, contacts, campaign drafts and audit events.

Server permissions remain authoritative. Hiding a button is not authorization. Payment submission/verification is disabled by default until finance rules are configured. The subscription screen explicitly records the pending commercial decision rather than offering invented plans.

The catch-all route currently handles application navigation. Unknown paths, SEO/server-rendered catalog content, richer filtering and route-specific code splitting require follow-up. Robots indexing remains disabled for the development build.

## Project status

See `docs/IMPLEMENTATION_STATUS.md`. This is an implemented development increment, not a production-ready complete platform. No browser visual or real-device QA has been performed. Legal/support content is pending client approval, not invented legal text.

All `NEXT_PUBLIC_*` configuration is included in browser bundles. Do not put server keys, database URLs or customer records in these variables or this repository.
