# Responsive layout update

This change is a source/CSS audit followed by lint, TypeScript and build validation. It is not a claim of completed browser, emulator or real-device visual testing.

## Fixes

- Family bottom navigation on viewports up to 767 px: Home, Explore, Bookings, Children, Account. Active destination uses aria-current; icon graphics are decorative. Hidden for provider/admin workspaces and authentication forms.
- Safe-area padding and reserved page space keep the fixed navigation from covering the footer or final form controls.
- A native details/summary Menu restores public navigation below the desktop breakpoint. Links remain keyboard accessible; changing route closes the menu.
- Tablet and mobile workspace navigation stays reachable without a full-height sidebar on small screens. Parent contextual links retain Settings, Help and Sign out, while primary destinations use the bottom bar.
- Zero-minimum grid tracks and flexible children contain long text and forms. Text wraps rather than hiding page overflow.
- Single-column content at phone sizes, one-column filters and stacked statistics at 380 px and below, constrained detail panels and wrapping heading/actions.
- Form controls use 16 px text on phones; navigation and controls retain practical touch targets.

## Verification still needed

In a real browser, test 320, 375, 430, 768, 1024 and 1440 px widths plus phone landscape. Check horizontal page overflow, bottom-bar active states, footer clearance, keyboard focus, 200% zoom, virtual-keyboard interaction, long names/emails, empty/error states and iPhone safe areas. Verify authenticated family/provider/admin screens using synthetic staging data. Supabase project access is required for the connected authenticated journeys.

The viewport widths above define the manual test matrix, not measurements already executed. No credentials or real family data are used in this change.

## Audit additions — 10 November 2026

Verify workspace-scoped family navigation for provider/admin users acting as parents, draft listing previews, the main-content skip link, Escape dismissal of notifications, route loading, expired-action notices and form resets when changing activity/account. Automated checks do not replace this interactive matrix.
