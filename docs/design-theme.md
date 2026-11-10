# Approved 360 Kids UI reference

The user identified **360Kids_Reference_Based_UIUX_Proposal_Kit.zip** as the decided UI on 8 November 2026. This replaces the earlier inferred green theme and the later Squibbly-derived pink theme. Do not invent another direction or use the raw Squibbly screenshots in preference to this kit.

Source ZIP SHA-256: `5190708B9211B4DCECABE5B631D90DEBF141BEBC5F6B812F1D8D0FAE9044D486`.

The kit was inspected as reference material: its design tokens, written design system and screen plan, and Boards 01, 02, 04 and 05. Its generated photos, prices, dates, names and operational counts are illustrative, not approved catalogue facts or business rules. Visual approval does not authorize the optional commercial concepts in Board 06.

## Tokens

The original token file is retained at `public/brand/design-tokens.json`. The matching CSS variables live in `src/app/globals.css`.

| Token | Value |
| --- | --- |
| Background | `#FFFCF8` |
| Surface | `#FFFFFF` |
| Text | `#172B3A` |
| Supporting text | `#52616B` |
| Primary action | `#F5A300`, with dark text |
| Secondary / links | `#087F8C` |
| Pale aqua | `#E5F7F6` |
| Pale pink | `#FCEAF3` |
| Border | `#DFE6E9` |
| Control radius | 12px |
| Card radius | 20px |
| Body text baseline | 16px |
| Control target | At least 44px |

Use rounded readable sans-serif headings and regular sans-serif body text. Use the original logo supplied in the kit, not its generated simplified wordmark. Warm gradients are decorative banner treatments; primary controls are orange and secondary controls are teal outlines. Category tiles are rounded rectangles, not circular pink chips. Titles, age, area, request mode, and price units remain readable below card imagery.

## Board mapping in the current preview

| Kit board | Current implementation |
| --- | --- |
| 01 Discovery | `/`: shared header, photo collage, activity/age/area search, six category tiles, photographic activity cards |
| 02 Activities and filters | `/parent/activities`: working sample search and age/area/category filters, count and empty state |
| 04 Family account | `/parent`: compact family banner, request status tabs/rows, children and saved panels; dedicated bookings, saved and profile routes |
| 05 Provider workspace | `/partner`: request queue, status tabs, review selection and detail panel; `/partner/programs`: sample listings |
| 05 Admin workspace | `/admin`: review queue and listing detail panel; `/admin/partners`: provider review preview |
| 03 Booking request | Not implemented as a live journey; request, offer, payment and confirmation remain separate concepts |
| 06 Optional membership | Not enabled; no credit, membership, gift-card or subscription behavior is implied |

Mobile parent navigation follows **Explore, Saved, Bookings, Profile**. Desktop parent screens have sidebar navigation; operational screens use a table and detail panel. Operational tables scroll within their containers on smaller displays; detail panels move beneath the queue. Current photography comes from the project website, not copied fragments of the raster boards.

## Public image provenance

| Asset | Source |
| --- | --- |
| `public/brand/360-kids-logo.webp` | `brand/360_Kids_Logo_Supplied.webp` from the approved kit |
| `public/activities/discovery.jpg` | `https://360kidsactivity.com/wp-content/uploads/2023/02/teacher.jpg` |
| `public/activities/movement.jpg` | `https://360kidsactivity.com/wp-content/uploads/2023/02/trainer-for-children.jpg` |
| `public/activities/creativity.jpg` | `https://360kidsactivity.com/wp-content/uploads/2023/02/kids-party.jpg` |

All current activity, household and review records are fictional. Prices with no approved facts say **Ask provider**. Review and add-child actions remain disabled until authorized backend endpoints exist. Inspiration saves store only sample activity IDs in the current browser tab.

## Existing implementation branches

The main branch contains the original scaffold. Connected application work was found in web PR #1 (`feature/phase1-booking-core`) and companion backend PR #1. This local visual implementation does not merge or replace those branches. Preserve their API and business logic when reconciling work.

## Connected implementation update — 8 November 2026

All current web routes now use the backend. Board 03 is implemented as a development request journey: activity/session selection, child selection, accepted policy, provider response/offer, parent acceptance and cancellation. Payment collection remains disabled; a submitted request is never shown as confirmed. Saves persist to the signed-in account, child/profile forms and authorized review/publishing actions are enabled, and displayed catalogue amounts come from PostgreSQL. Earlier preview-only descriptions above document the design increment and are superseded by this update.

Parent mobile navigation retains Explore, Saved, Bookings and Profile. Desktop workspaces retain sidebars; partner/admin request queues use tables with separate request detail pages. Growing lists and pickers are server-paginated. The approved palette, logo, imagery, spacing and rounded controls remain the design source.
