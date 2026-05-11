# Memory: Kumon Iligan Ops

## Project
Mobile-first tuition payment ops platform for Mrs. Nina Quijano's Kumon franchise in Iligan City. pnpm monorepo: `apps/web/` (Next.js) + `apps/api/` (NestJS). Supabase Postgres. Auth: NextAuth v5 + Google OAuth. Prod: `https://kumon-iligan.symph.co`. Repo: `SymphonyAgents/kumon-iligan-ops`.

## Active Context
- Latest tag: `v0.1.4`, revision: `kumon-iligan-frontend-00014-g97` (May 11, URL-synced filters, sidebar badge, receipt uploads)
- Roles: superadmin | admin | teacher
- All secrets in `kumon-iligan-ops` Secret Manager (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET)

## Decisions & Conventions
- pnpm workspace packages: `apps/web` (name: `frontend`) and `apps/api` (name: `backend`). Filters use package name, not dir path.
- All amounts: bigint scaled integers via `toScaled`/`fromScaled`. API returns pesos, do NOT re-scale on the frontend.
- Roles in code: `USER_TYPE.SUPERADMIN | ADMIN | TEACHER`
- OAuth callback: `https://kumon-iligan.symph.co/api/auth/callback/google` registered in GCP Console.

## Lessons Learned
- **useUrlParam (useSearchParams) requires Suspense on every page**: Any page using `useUrlParam` (or any hook wrapping `useSearchParams()`) must wrap its content in `<Suspense>`. Pattern: rename `XxxPage` → `XxxContent`, add `export default function XxxPage() { return <Suspense><XxxContent /></Suspense>; }`. Without this, Next.js 15 throws a hard build error during static prerendering. Affected pages: families, staff, sdc, payments, students, recordings, payment-periods, audit. *(May 11, v0.1.4 build failure)*
- **PLACEHOLDER substitution defaults are deploy blockers**: grep ALL `cloudbuild*.yaml` files for `PLACEHOLDER` before tagging. `_APP_URL` baked into Docker image at build time via `ARG`; if left as placeholder, auth redirects to a nonexistent domain. *(May 10, v0.1.0 failure)*
- **`build/` gitignore trap**: Next.js gitignores `build/` as compiled output. Top-level `build/` for pipeline artifacts must be exempted with specific subdirectory exclusions (`apps/web/build/`, `apps/api/build/`). *(May 10)*
- **Manifest syntax error in console is non-blocking**: Recurring `Manifest: Line: 1, column: 1, Syntax error` in smoke tests is a missing PWA manifest file, not a code regression. *(May 11)*
