# L1 Support Status Generator

A mobile app (iOS & Android) for L1 support teams to quickly build, edit, and share formatted status update reports — ready to paste directly into WhatsApp.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — Postgres connection string (not currently used)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- State: React Context + AsyncStorage (local persistence, no backend needed)
- API: Express 5 (scaffolded, not yet used by the mobile app)
- DB: PostgreSQL + Drizzle ORM (scaffolded, not yet used)
- Build: esbuild (CJS bundle for API server)

## Where things live

- `artifacts/l1-status-app/` — Expo mobile app
- `artifacts/l1-status-app/context/StatusContext.tsx` — all app state, actions, and text generation logic
- `artifacts/l1-status-app/components/EditorComponents.tsx` — SystemCard, IssueCard, SectionCard, LineItem
- `artifacts/l1-status-app/app/(tabs)/index.tsx` — main screen (Editor + Preview tabs)
- `artifacts/l1-status-app/constants/colors.ts` — design tokens (light + dark)

## Architecture decisions

- Frontend-only: All state stored in AsyncStorage, no backend API calls needed for this use case.
- Single screen app: A custom Editor/Preview tab switcher replaces the standard tab bar.
- Text generation is pure functional: `generateStatusText(state)` in StatusContext, mirrors the original HTML's `toText()` logic.
- The template state (Murex + Operations Apps) is the default on first launch; AsyncStorage persists subsequent edits.

## Product

- Add/remove systems with name and components
- Per-system: ongoing issues (with supporting person), status sections with numbered or bulleted lines
- Highlight any line with an amber warning indicator
- Preview formatted WhatsApp-ready text with bold markers (*text*)
- Copy to clipboard or share natively (opens share sheet for WhatsApp, Slack, etc.)
- "Set now" button populates current date/time
- Reset to the standard L1 template at any time

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `useColors` hook was simplified to `scheme === "dark" ? colors.dark : colors.light` because the original cast broke when `colors.ts` added a `dark` key.
- `expo-clipboard` must be pinned to `~8.0.8` (not latest 56.x) for compatibility with Expo SDK 54.
- The Expo workflow may show "FAILED" status briefly during Metro startup but IS running once "Web is waiting on http://localhost:<PORT>" appears in logs.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
