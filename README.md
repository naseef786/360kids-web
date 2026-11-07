# 360 Kids Web

Next.js + TypeScript foundation for the family website, provider portal and admin dashboard.

## Status

A static development preview is implemented. Authentication, catalog data, dashboards, booking APIs, payments and WhatsApp management screens are not implemented. The preview deliberately prevents indexing and takes no real bookings.

## Windows / PowerShell setup

Install Node.js 24 (tested with 24.22.1), then:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Run the backend separately on port 4000 when API integration begins.

```powershell
npm run lint
npm run typecheck
npm run build
```

## Repository boundaries

- Web: https://github.com/naseef786/360kids-web
- Backend/API, SQL migrations, jobs and integration contracts: https://github.com/naseef786/360kids-backend
- Native Expo app: https://github.com/naseef786/360kids-mobile

The backend is the source of truth for permissions, prices, booking transitions and API contracts. Future versioned API types should be generated from that contract for both clients. Do not create a separate database or booking rules inside the web app.

## Next milestone

Build the role layouts, authentication, catalog and request-to-book flow against a documented backend contract. WhatsApp contact imports, permissions, templates and campaign management will be restricted admin features; no sending is wired into this starter.

Environment files are ignored. Values prefixed NEXT_PUBLIC_ are public. Never put server keys, customer lists or private documents in this repository.
