# Connected development verification

Verified on 8 November 2026 against the configured Supabase development database and local web/backend servers.

- Backend type checking, 16 automated test groups and build passed.
- Website lint, TypeScript and production build passed.
- Twelve connected HTTP checks passed across real Supabase Auth, Next.js and PostgreSQL, including 20 page render checks.
- Parent, Partner and Superadmin sign-in/authorization, provider application/approval, draft publication, family profiles, saved activities, request idempotency, provider offer/parent acceptance, stale-version rejection, cancellation and allocation release passed.
- Two real concurrent acceptance requests for a one-place session produced one success and one conflict. This proves that tested contention case, not a complete production load/concurrency assessment.
- A generated Supabase recovery link was consumed by the website callback; password update and subsequent sign-in passed without sending an email. Actual inbox delivery and emailed signup confirmation remain unverified.
- Browser checks verified sign-in, child creation, live catalogue and request submission with fictional records. Responsive layout checks cover representative desktop/mobile pages; this is not exhaustive accessibility or real-device certification.
- Migrations 001–005 applied to development. The web, API and expiry worker run separately. No production deployment, actual payment, contact broadcast or real child data was used.

## Remaining release work

Production/staging hosting and HTTPS, real initial administrator provisioning, production catalogue/media/policies, email sender/delivery checks, payment ownership/gateway/receipt storage and reconciliation, messaging provider/permission evidence/webhooks, retention/deletion/recovery policies, monitoring/backups/restore rehearsal, broader concurrency/load/device/accessibility checks and native mobile integration remain separate release work. Optional memberships and branch-specific staff capabilities are not enabled.

Every future growing list must follow the paginated API contract. Avoid adding a full-table read for a dashboard, picker or export; large exports need their own bounded/background workflow.

## Confirmation/refund simulation

A separate, temporary loopback-only website/API instance also passed the parent reference submission, Superadmin verification to Confirmed, cancellation, separate full-refund obligation and refund-completion journey. Only the prepared synthetic account IDs were allowed; references/evidence were explicitly fictional and no money moved. The temporary instances were stopped afterward. The main app's finance flag stayed disabled.

To repeat after normal E2E setup, start the backend helper `node --import tsx scripts/finance-e2e-server.ts --development-only` (port 4100), then a separate web process with `API_URL=http://127.0.0.1:4100` and `next start --hostname 127.0.0.1 --port 3100`; run `node scripts/e2e-finance.mjs`. Stop both temporary processes after testing. This helper is excluded from the backend production build and refuses production mode; it is not a real payment integration.
