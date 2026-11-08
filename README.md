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
- `/sign-in`: email/password sign-in and account creation via Supabase. Email/password is an implementation assumption pending the final login-method decision. Configure confirmation and password recovery emails in Supabase. Social login remains outstanding.
- `/account`, `/account/bookings`, `/account/children`, `/account/settings`: family overview, booking tracking, revised-price approval, children and account details.
- `/become-a-provider`, `/provider/*`: applications, own published activities/corrections, incoming requests and booking actions.
- `/admin/*`: booking operations, provider review, activity publishing, payment/refund review, contacts, campaign drafts and audit events.

Server permissions remain authoritative. Hiding a button is not authorization. Payment submission/verification is disabled by default until finance rules are configured. The subscription screen explicitly records the pending commercial decision rather than offering invented plans.

The catch-all route handles the supported application paths and returns a not-found page for unknown paths. SEO/server-rendered catalog content, server-side catalog filtering and route-specific code splitting require follow-up. Robots indexing remains disabled for the development build.

## Project status

See `docs/IMPLEMENTATION_STATUS.md`. This is an implemented development increment, not a production-ready complete platform. No browser visual or real-device QA has been performed. Legal/support content is pending client approval, not invented legal text.

All `NEXT_PUBLIC_*` configuration is included in browser bundles. Do not put server keys, database URLs or customer records in these variables or this repository.

## Base platform update

Families can edit their display name, edit/archive eligible children, request an account deletion review, recover/reset a password and open private support requests. Providers can view their unpublished listings and track correction requests. Admins can edit/publish/hide listings, add sessions, complete correction reviews, publish reviewed page text and respond to support tickets. The app supports alternative-session offers with explicit parent approval.

Additional screens: `/account/support`, `/provider/support`, `/admin/support`, `/admin/corrections`, `/admin/content`, `/reset-password`. Configure Supabase recovery redirects before testing account recovery. Full account erasure is a reviewed process and is not automatically executed by a deletion request.

Catalog filtering now includes age, area, maximum price and activity date. These operate on the catalog loaded by the API; server-side pagination and search optimization remain needed for a larger catalog. Run the backend migrations before opening the updated workspaces.

## Live dashboard updates

Signed-in families, partners and admins have a notification menu with saved updates, unread counts, mark-read controls and older-page loading. Socket.IO signals refresh booking/workspace data without a manual page reload. Reconnect and tab focus fetch current records, including changes missed while offline. A visible connection indicator and retry action explain connection failures.

Set `NEXT_PUBLIC_API_URL` to the backend origin without `/v1`. Use the matching backend version and apply all three migrations. Its persistent Node host/proxy must support `/socket.io` WebSocket and HTTP polling traffic; see the backend `docs/REALTIME.md`. There is no socket credential or client-selected recipient setting. Supabase tokens are supplied at connection time and refreshed on reconnect. This is dashboard notification support; browser system notifications, email and mobile push delivery are separate work.
