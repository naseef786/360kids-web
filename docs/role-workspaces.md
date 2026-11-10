# Role workspace foundation

## Routes

| Role | Overview | Collection preview |
| --- | --- | --- |
| Parent | `/parent` | `/parent/activities` |
| Partner | `/partner` | `/partner/programs` |
| Superadmin | `/admin` | `/admin/partners` |

Additional parent preview routes are `/parent/bookings`, `/parent/saved`, and `/parent/profile`. The approved visual source is recorded in `design-theme.md`. Provider and admin queues support local row selection and status filtering, not live decisions.

The public home page links to all three previews. These are publicly reachable development screens, not protected portals. Existing `noindex` metadata remains in place. No real account, child, enrollment, partner, or transaction records are loaded.

The shared `Workspace` component provides responsive navigation and fictional sample content. Filters and disclosures operate locally. Parent inspiration saves use browser-tab session storage, surviving navigation and reloads. Only sample activity IDs are written, with no child or account details. If storage is blocked, an in-memory fallback supports client navigation; a full reload can reset those fallback saves. Saving inspiration has no booking or payment effect.

## Production boundaries

Keep the existing repositories: `360kids-web` for web experiences, `360kids-backend` for shared permissions and business rules, and `360kids-mobile` for the native client. Do not duplicate booking transitions or database rules in either client.

An authenticated account may be both a parent and a partner staff member. Partner permissions should come from active organization memberships, rather than a single client-selected role. The backend must verify the relevant organization, guardian relationship, resource, and operation on every protected request. A role-specific URL or hidden button does not enforce access.

Parents should see children linked through authorized guardian relationships. Partner staff should see their organization's programs and authorized enrollments. Superadmin permissions should be explicitly provisioned, with sensitive support access and administrative changes audited. Browsing the admin preview does not create an administrator account.

## Next milestone

1. Document the backend identity, membership, and guardian relationship contract.
2. Implement backend authorization, including cross-organization and unrelated-child denial tests.
3. Connect authenticated role routes with server-side session and access handling.
4. Connect the catalog and request-to-book journey to the shared API. A submitted request does not reserve a place or confirm a booking.
5. Add partner publishing and review actions only when protected backend endpoints and audit events exist.

Reference: [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), particularly default-deny and per-request permission validation.
