# AGENTS.md — Kumon Iligan Operations Platform

## Project Overview

Kumon Iligan Operations Platform is a mobile-first web app for Mrs. Nina Quijano's Kumon franchise in Iligan City. Phase 1 feature: **kumon-tuition-management** — replaces the manual parent screenshot → teacher email → admin spreadsheet flow.

pnpm monorepo with two packages:
- `backend/` — NestJS + Drizzle ORM + Supabase Auth
- `frontend/` — Next.js App Router + TanStack Query + shadcn/ui + Tailwind CSS

Database is Supabase Postgres. Auth is Supabase (Google OAuth + JWT).

## Quick Start

```bash
pnpm install          # from root — installs both packages
pnpm dev              # frontend on :3000
pnpm backend          # backend on :3001 (watch mode)
```

Env files required (not committed):
- `backend/.env` — see `backend/.env.example`
- `frontend/.env` (or `.env.local`) — see `frontend/.env.example`

## Forked From

sneaker-doc-pos (SymphonyAgents/sneaker-doc-pos). Reuses: monorepo structure, RBAC guards, branch scoping, audit logging, receipt/photo handling, scaled integer money pattern (toScaled/fromScaled), TanStack Query mutation pattern, toast error handling, design system (zinc palette, Geist Sans).

## Key Schema Changes vs sneaker-doc-pos

- `customers` → split into `families` + `students`
- `transactions` + `claim_payments` → merged into `payments` (with verification workflow)
- `staff assignment` → `student_teacher_assignments` (fixed class list, not walk-in)
- Net-new: `payment_periods` (monthly billing cycles per student)
- Dropped: card_banks, services, promos, transaction_items, expenses, deposits, staff_documents

## Docs

- `docs/prd.md` — Product Requirements Document (kumon-tuition-management)
- `docs/erd.md` — Full ERD with entity mapping from sneaker-doc-pos
- `docs/user-flow-teacher-sdc.md` — Teacher payment recording flow
- `OPEN-QUESTIONS.md` — Critical design questions for client (read before build)
- `product.yaml` — Product registry metadata

## Repo

- App: https://github.com/SymphonyAgents/kumon-iligan-ops
- Product owner: Vins (vince.tapdasan@symph.co)
