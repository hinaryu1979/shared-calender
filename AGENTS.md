<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

`shared-calendar` is a Next.js 16 (App Router, Turbopack) app that renders a FullCalendar-based shared calendar. Standard scripts live in `package.json`: `npm run dev`, `npm run build`, `npm run lint`. There is no automated test suite.

Key non-obvious behavior:

- **Runs without any secrets.** When `NEXT_PUBLIC_CALENDAR_ID` and `NEXT_PUBLIC_EDIT_TOKEN` are unset, the app falls back to a client-only, in-memory mode (see `isFirebaseCalendarConfigured` in `src/lib/publicCalendarConfig.ts`). Events created in the UI are stored only in browser state, not persisted. This mode is sufficient to run and demo the calendar (add/edit/delete events) with no Firebase/Google credentials.
- **Remote persistence + Google Sheets export are optional.** To enable them, put a one-line `FIREBASE_SERVICE_ACCOUNT_JSON` (Firebase service-account JSON) plus `NEXT_PUBLIC_CALENDAR_ID` / `NEXT_PUBLIC_EDIT_TOKEN` in `.env.local`, then run `npm run seed:calendar` to provision a calendar doc + tokens in Firestore. The API routes under `src/app/api/calendars/**` and the export panel require this. Without valid credentials these routes will throw at request time (the UI stays in local-only mode).
- `NEXT_PUBLIC_*` values are inlined at build/dev startup, so changing `.env.local` requires restarting the dev server to take effect.
