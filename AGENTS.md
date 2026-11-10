# Development conventions

Use TypeScript and the existing repository conventions. Keep changes focused and test the normal flow and relevant failures.

This is a development implementation; production readiness is tracked in docs/IMPLEMENTATION_STATUS.md. Mark sample data and unfinished functionality clearly. Do not collect real child data, accept payments, or send messages from this scaffold.

Business permissions, amounts, deadlines and booking status changes belong in the backend. A submitted request is not confirmed. Keep booking, payment, refund and subscription records separate.

Never commit credentials, customer contact lists, child details, receipts or private project documents. Treat NEXT_PUBLIC_* and EXPO_PUBLIC_* variables as public.

WhatsApp transport is not implemented. Before adding delivery, use the official Business Platform, confirm sender ownership and permission evidence, enforce opt-outs at dispatch, validate webhooks and separate marketing from operational messages. Do not automate WhatsApp Web.

Use npm with the committed lockfile. Keep commands Windows-friendly. Read README.md before working and run the documented checks. Record remaining limitations honestly.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
