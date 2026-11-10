# 360 Kids Web

Connected Next.js website for Parent, Partner and Superadmin workspaces. Uses the approved 360 Kids proposal kit, Supabase Auth and the companion backend. Development only: use fictional family/contact data. Payment collection and external message delivery remain disabled.

## Working journeys

- Public activity discovery, search, age/area/category filters, activity details and paginated sessions.
- Email/password sign-in, registration, email callback, password recovery, password change, session restoration and sign-out. Sessions use server-managed HttpOnly cookies; backend permissions are checked on every protected request.
- Parent child profiles (age or exact birth date), saved activities, policy acceptance, request submission, offer acceptance, cancellation and booking details.
- Partner application/status, organization-scoped request responses, revised offers, draft listings, correction requests and owner-managed existing-account staff access.
- Superadmin provider review, catalogue creation/editing, additional sessions, publishing/unpublishing, booking review, correction review, paginated audit and operational lists. Contact validation/import and campaign drafts send no messages.
- Every growing list uses server-side pagination, including selection lists. Lists return `{items,total,page,pageSize,pages}`. Filters apply before counting and paging; page sizes are capped at 100. This is a standing rule in AGENTS.md.

## Local setup

Use Node.js 24 (verified with 24.22.2).

```powershell
npm ci
Copy-Item .env.example .env.local
# Set API_URL, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
npm run dev
```

Start the backend on port 4000 and its expiry worker separately. Open http://localhost:3000. The web server calls the backend through server-side requests and `/api/backend`; no database credential or privileged Supabase key belongs in this repository. Keep the two repositories together only for the optional development E2E fixture workflow.

In Supabase Auth URL Configuration, set the intended website origin and allow its `/auth/callback` URL, including the password recovery redirect. The callback supports PKCE codes and supported `token_hash` links. Use HTTPS in hosted environments. The signup/recovery mail delivery configuration and actual inbox delivery still require staging verification. No email was sent during our automated checks.

## Validation

```powershell
npm run lint
npm run typecheck
npm run build
```

For the connected development check, configure the backend's development-only Supabase secret/database environment, then run in the backend checkout:

```powershell
node --import tsx scripts/prepare-web-e2e.ts --development-only
```

With both servers running, run in this checkout:

```powershell
npm run test:e2e
```

This creates fictional records, uses real Supabase sign-in and recovery links without emailing them, and checks all three role journeys, authorization failures, pagination, idempotency, cancellation and simultaneous acceptance of the last place. Credentials/results stay in ignored files in the backend checkout. The preparation script is an operator-only development tool, never a public API or production account-provisioning workflow. Do not run it against production.

## Design and repositories

The approved UI source is `360Kids_Reference_Based_UIUX_Proposal_Kit.zip`; see [design-theme.md](docs/design-theme.md). Preserve the supplied logo, orange actions, teal accents, navy text, warm background and card/control radii. Public photography is illustrative; published prices and policies come from the database.

- Web: https://github.com/naseef786/360kids-web
- Backend: https://github.com/naseef786/360kids-backend
- Native app: https://github.com/naseef786/360kids-mobile (not changed in this web/backend increment)

See [end-to-end-status.md](docs/end-to-end-status.md) for verification and release limits. This local implementation does not constitute a production deployment.

The optional confirmation/refund simulation is documented in [end-to-end-status.md](docs/end-to-end-status.md). It checks financial records with fictional references on separate loopback-only instances, then shuts those instances down; the normal app keeps collection disabled.
