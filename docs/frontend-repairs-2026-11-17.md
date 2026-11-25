# Frontend repair increment — 17 November 2026

Scope: repair existing connected web journeys against the [unified decisions](../../docs/DECISIONS.md), particularly D03 (authentication continuity), D11 (capabilities) and D13 (foreground notification refresh). Existing permission/MFA work in this checkout is preserved; this report does not claim that work as part of this increment.

## Observed gaps and changes

| Journey | Before | This increment / evidence |
| --- | --- | --- |
| Activity → sign-in → forgotten password → callback → activity | Partial: recovery and password update discarded the safe return destination; expired links also lost it. | Implemented return-link repair in [navigation](../src/lib/navigation.ts), [auth API](../src/app/api/auth/route.ts) and [callback](../src/app/auth/callback/route.ts). Recovery token links always reach password reset; expired links retain the safe destination when requesting another link. External redirects remain rejected. |
| Scoped notifications → header → dashboard | Partial: fixed polling lacked offline/reconnect handling and failure backoff; “Retry” only navigated. | [Notification controls](../src/components/notification-controls.tsx) now use [foreground refresh](../src/lib/foreground-refresh.ts): 30-second success cadence, 60/120/240/300-second failure backoff, hidden/offline pause, focus/reconnect refresh, single in-flight request, abort on unmount, stop after 401/403. Separate accessible retry button; English/Arabic service guidance. Mark-read refreshes the header count. |
| Finance-only staff → workspace | Partial: payment readers without booking permissions fell back to parent home. | [Operator navigation](../src/lib/permissions.ts) now chooses the already authorized operations page. Backend permissions are unchanged. |

Notification reads continue through the cookie-backed `/api/backend` proxy to `/v1/notifications`; server recipient/capability filtering remains the access boundary. Mark-read uses the existing scoped endpoint. No Socket.IO connection, notification sending, payment action or database migration was added.

## Verification

- `npm test`: 36 passing tests, including six new [frontend repair regression tests](../test/frontend-repairs.test.ts). Network/services are mocked; no email or real booking was sent.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- Editor diagnostics: no source errors.
- `git diff --check`: passed (existing line-ending notices only).
- `npm run build`: passed; all 28 pages generated. Sandbox test/build attempts encountered Windows `spawn EPERM`; both completed successfully after escalation.
- Follow-up on bundled Node 24.22.2: backend `npm test` (35/35), `npm run typecheck` and `npm run build` passed; web `npm test` (36/36) and `npm run build` passed. The local Next/API permission smoke test also passed with synthetic Supabase Auth and isolated PGlite, covering ordinary-admin denial, finance step-up, invalid code, session refresh and the authorized verification path. No hosted account or database was contacted by that smoke test.

## Remaining verification and Phase 1 work

- Real password-reset email delivery, Supabase callback allowlists, authenticated browser flows, mobile/RTL layout and native devices were not exercised in this increment.
- The Node 24 local checks do not replace a migration rehearsal or real Supabase AAL2 and browser/device checks on an identified isolated staging project.
- Return-link repair is not a seven-day booking draft implementation. Session/participant intent persistence, phone verification, complete booking clocks, payment evidence and remaining Phase 1 backend contracts remain separate work.
- Production configuration/access and UAT remain required under the unified decisions. No workflow decision was invented or reopened, and no production-readiness claim is made.

Next: Phase 1 — browser/RTL regression coverage and complete booking-intent continuity against the approved backend contracts. Future enhancements — keep gateway automation, Socket.IO and marketing integrations deferred.
