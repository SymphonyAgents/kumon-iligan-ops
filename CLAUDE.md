# Kumon Iligan Operations Platform — Project Context

> Auto-maintained by Aria. Last updated: 2026-05-09 10:24 PHT.
> See also: AGENTS.md for quick-start and schema overview.

## Active Context

- Student list payloads now include `guardianPhone` for both teacher and admin/superadmin queries so payment CSV import can disambiguate duplicate student names.
- `PaymentImportDialog` validates `paymentMethod` through a typed guard aligned with `PAYMENT_METHOD` values, keeping CSV parsing type-safe.
- Local workspace installs create `.pnpm-store/`, which is intentionally gitignored at the app root.

## Project Overview

Mobile-first tuition payment operations platform for Mrs. Nina Quijano's Kumon franchise in Iligan City. Phase 1 feature: kumon-tuition-management.

- **Slug**: kumon-iligan-ops
- **Type**: Client product (Vins — vince.tapdasan@symph.co)
- **Agency Phase**: Build
- **Repo**: SymphonyAgents/kumon-iligan-ops (forked from SymphonyAgents/sneaker-doc-pos)

## Tech Stack

- **Monorepo**: pnpm workspaces (`frontend/` + `backend/`)
- **Frontend**: Next.js (App Router) + shadcn/ui + Tailwind CSS + TanStack Query + TypeScript
- **Backend**: NestJS + Drizzle ORM + TypeScript
- **Database**: Supabase Postgres | **Auth**: Supabase Google OAuth + JWT | **Storage**: Supabase
- **Package Manager**: pnpm

## Architecture Overview

pnpm monorepo. Frontend (Next.js) calls backend (NestJS) via REST at `NEXT_PUBLIC_API_URL`. Supabase handles auth (Google OAuth + JWT); frontend gets JWT, passes as Bearer token; NestJS guard validates via Supabase JWT secret. Drizzle ORM against Supabase Postgres. RBAC enforced in NestJS guards (roles: superadmin, admin, teacher).

## Key Patterns (inherited from sneaker-doc-pos)

- `scopedBranchId` helper for branch-scoped queries
- `AuditModule` is global — use it for all mutations
- `toScaled` / `fromScaled` for all monetary values (bigint, no floats)
- TanStack Query `useMutation` + `invalidateQueries` pattern
- `ApiError` class for toast error handling
- Drizzle relations defined in schema.ts

## Domain-Specific Notes

- Roles: superadmin | admin | teacher (was: superadmin | admin | staff)
- customers → families (guardians) + students (enrolled children)
- transactions → payments (with period linkage + verification status)
- student_teacher_assignments: fixed class list, partial unique index on (studentId) WHERE isActive = true
- payment_periods: one per student per month, expectedAmount vs paidAmount
- All amounts: bigint scaled integers

## Read Before Building

- `OPEN-QUESTIONS.md` — critical schema decisions needing client sign-off
- `docs/prd.md` — full product requirements
- `docs/erd.md` — full entity definitions and relationships
