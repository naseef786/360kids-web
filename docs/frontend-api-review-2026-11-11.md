# Frontend/API integration review — 11 November 2026

## Scope and result

Reviewed the reachable public, family, partner and administrator routes, their forms, shared API clients, authentication handlers, pagination and backend contracts. Preserved existing uncommitted support/content work and the approved UI kit. The fixes below are implemented; this is not a guarantee that no undiscovered frontend defect remains or that the product is ready for production.

The active application uses server-rendered pages and a cookie-authenticated same-origin API proxy. Legacy client components still exist in the repository but are not the application entry points. Their old local-storage authentication/socket client was not wired into the current cookie-based application.

## Corrected issues

| Issue | Result |
| --- | --- |
| Notification API had no entry point in current workspaces | Added notifications pages for all three workspaces, unread header link, mark-one/mark-all controls, empty states and server pagination. Counts refresh on focus and every 30 seconds while visible; errors/revocation are handled |
| Legacy role-based notification links sent staff with a parent role to the wrong workspace | Use the server-provided notification workspace and canonical current routes; booking notices link to their detail when an ID is available |
| Saved buttons defaulted to unsaved after navigation | Catalogue and activity-detail queries return `is_saved` scoped in SQL to the verified caller. Public responses remain false. Server-rendered pages pass that state to keyed save controls; no full saved collection is downloaded |
| Arbitrary page URL parameters reached strict API endpoints | Whitelist endpoint-specific filters, validate page/pageSize, discard invalid filter values and retain valid filters in page links |
| Empty/out-of-range pages offered no useful recovery | Added a back-to-results link; an empty session-selection page can return to available sessions |
| Late team responses could appear under a different selected organization | Sequence checks, selected-organization guards, clearing stale member data, loading controls and selection reset when changing provider pages |
| Activity organization selection could retain an ID absent from the visible page | Disable actions while loading and reset the selection after a successful page change/create |
| Form submission could race before disabled state rendered | Synchronous submission lock for shared mutation and auth forms; await completion callbacks |
| Booking retry identity omitted children selected outside form fields | Include selected children, session and reviewed activity version in the intent fingerprint. Keep retry keys after uncertain failures and clear them after definitive rejections |
| Shared client assumed every response was valid JSON and had no timeout | Common bounded HTTP client handles JSON errors, HTML gateways, malformed success, empty 204, cancellation, timeout and network failure |
| Auth/proxy body size limits depended on declared lengths or full buffering | Stream bounded JSON bodies by byte count, reject malformed/non-object JSON, preserve useful 400/413/415/502 errors |
| Same-origin check compared the browser origin with Next's internal hostname | Compare the incoming browser Host and protocol; preserve cross-site rejection. Authentication callbacks use the same external request origin |
| Active sign-in return-path helper accepted some control characters | Reject control characters/backslashes and resolve destinations against a fixed origin before returning a local path |
| Recovery ignored provider errors | Return an actionable unavailable/rate-limit state instead of claiming a reset link was sent |
| Stale catalogue/child edit defaults survived refreshed server data | Key editors to their server revision/profile data; booking requests reset when reviewed activity version changes |
| Malformed detail IDs and unrelated query parameters caused avoidable API errors | Validate detail IDs before fetching and return 404; strip unrelated query parameters |
| Finance UI read an environment-derived flag | Consume the backend service's `financeEnabled` capability |
| Subscription rows used potentially duplicate names as React keys | Use the provider ID where the resource has no standalone ID |

The initial suspicion about an extra team-member payload field was disproved: `role: "staff"` is required by the backend and has been retained. The actual team issue was asynchronous stale data.

## Database integration

The configured development database lacked three existing migrations: `002_base_features.sql`, `003_notifications.sql`, and `004_private_access_indexes.sql`. Its readiness probe failed and provider creation returned 500 when transactional notification writes reached missing tables. Applied those pending migrations through the existing checksummed runner; no applied migration was edited. Synthetic connected checks subsequently passed.

The personalized catalogue adds optional bearer authentication for saved state while keeping anonymous discovery available. Catalogue API responses are private/no-store; the web proxy and server fetches also disable caching. Deploy matching web and backend versions.

## Verified

- Frontend: 18 automated tests pass, including the active cookie API client, body limits, pagination, origin checks, return-path safety and workspace notification links.
- Backend: 25 tests pass, including saved-state isolation and existing booking, authorization, notification and expiry regression checks.
- Web TypeScript, ESLint and production build pass. Final frontend tests and production build used Node 24.22.2.
- Frontend dependency audit reports zero vulnerabilities. The final focused backend HTTP test also passes the private/no-store catalogue-response assertion.
- Connected synthetic-account suite: all 12 checks pass, covering real Supabase sign-in, HttpOnly cookies, role restoration, provider application/approval, draft/publish, child updates, saved activities, idempotent booking requests, offers/acceptance, cancellation, finance disabled, concurrent last-place acceptance, corrections, audit paging, 20 page renders, sign-out and recovery/password update without email delivery.
- Additional connected verification: support creation/admin reply/authorization, filtered SQL pages, notification read state/page-size validation, 17 further page renders, malformed-ID 404 and personalized saved state pass.
- Browser: catalogue filter/page navigation retained filters and discarded unrelated tracking parameters. At the observed 375px mobile viewport, document width equalled scroll width and no loaded images were broken.

The page-render checks exercise server rendering and API responses. They do not establish exhaustive click-through, screen-reader or real-device coverage. No production deployment, external broadcasts, email delivery or payment collection was performed. Synthetic development records remain in the configured development environment.

## Reproduce

Use the repository's Node 24 runtime. Run backend typecheck/tests/build, and web `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

With the local API and web servers running and existing fictional fixtures prepared, run `npm run test:e2e`, then `node scripts/verify-frontend.mjs`. The latter is restricted to a loopback origin. `WEB_TEST_ORIGIN` may override the default `http://127.0.0.1:3000`. On this machine, `localhost:3000` also resolved to an unrelated IPv6 listener, so verification used the explicit IPv4 loopback address.

Payments, broadcast delivery, deletion processing and other unfinished backend workflows remain the release gaps described in the backend architecture review; this frontend work does not manufacture completed UI behavior for those missing capabilities.
