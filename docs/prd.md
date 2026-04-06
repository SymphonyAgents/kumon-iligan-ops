# Kumon Tuition Management -- Product Requirements Document

## 1. Overview

Kumon Tuition Management is the first feature module of the Kumon Iligan Operations Platform (kumon-iligan-ops). It covers tuition payment recording, admin verification, and payment reporting for Mrs. Nina Quijano's Kumon franchise center in Iligan.

The system replaces a three-hop manual workflow: parents send payment screenshots to teachers via group chat, teachers forward these to a central admin email inbox, and one admin manually transcribes every receipt into a spreadsheet. This module eliminates the email forwarding and manual transcription steps entirely. Teachers record payments directly in the app; admins review and verify from a consolidated queue.

**What this module covers:** payment recording by teachers, admin verification/rejection workflow, payment period tracking, consolidated spreadsheet view, visual dashboards, missing payment detection, student and family management, and CSV import/export for migration.

**What this module does NOT cover:** attendance tracking, payroll, student progress tracking, franchise operations management, and parent-facing portals. These are future modules within kumon-iligan-ops.

---

## 2. Background

- **Client:** Mrs. Nina Quijano, Kumon franchise owner (Iligan City)
- **Discovery call:** April 3, 2026 (36 min 07 sec)
- **Transcript:** [Fireflies recording](https://app.fireflies.ai/view/Discovery-Call-Mrs-Ms-Quijano::01KN69QDQ6HTGGG067QCJ84F2N)
- **Referred by:** Steve (SneakerDoc client -- warm lead)
- **Product owner:** Vins (vince.tapdasan@symph.co)
- **Urgency:** High. Nina took the discovery call during holiday week, indicating strong motivation to move fast.
- **Current pain:** Approximately 15 teachers each email receipts to one central inbox. One admin manually transcribes every receipt into spreadsheets. There is no automated detection of missing payments, duplicate references, or payment discrepancies.

---

## 3. Value Proposition

The current spreadsheet workflow has structural limitations that no amount of diligence can fix:

- **Missing payment detection is manual.** Admin must visually scan rows and columns to spot students who have not paid. The system will flag every missing payment automatically by comparing expected vs. received per student per period.
- **Duplicate reference numbers are invisible.** If a parent resubmits the same receipt or a teacher double-enters, nothing catches it. The system validates reference numbers against all existing records in real time.
- **No dashboards.** Payment consistency, collection rates, and irregularity patterns require manual calculation. The system generates these automatically.
- **Receipt images are disconnected from records.** Screenshots live in email threads. The system ties each receipt image directly to the payment record it supports.
- **Family linkage does not exist.** Admin cannot easily see all payments from one family across multiple children. The system links students to families and supports multi-sibling batch recording.

**Honest framing:** The parent experience does not change -- they still send screenshots to teachers via group chat. Teacher effort is roughly equivalent but structured (form input instead of email forwarding). The primary beneficiary is the admin, whose role shifts from data entry to review-and-approve.

---

## 4. Users and Roles

| Role | Count | Description |
|------|-------|-------------|
| Teacher | ~15 | Records payments from parents. Views only their assigned students. Cannot verify or manage data. |
| Admin | 2-3 | Verifies, flags, or rejects payments. Manages students, families, and payment periods. Views dashboards and consolidated reports. |
| Superadmin | 1 | Full system access across all branches. Manages users, branches, and system configuration. |

This is an internal-only tool. There is no parent portal and no public-facing access. All users authenticate via Google OAuth through Supabase.

---

## 5. Technical Foundation

| Dimension | Choice | Notes |
|-----------|--------|-------|
| Base codebase | Fork of [sneaker-doc-pos](https://github.com/SymphonyAgents/sneaker-doc-pos) | Reuse monorepo structure, RBAC, audit logging, branch scoping, receipt handling, scaled integer money pattern |
| Monorepo | pnpm workspaces | Same as sneaker-doc-pos |
| Frontend | Next.js (App Router) + TypeScript | |
| UI | shadcn/ui + Tailwind CSS | |
| State | TanStack Query | |
| Backend | NestJS + TypeScript | |
| ORM | Drizzle ORM | |
| Database | Supabase (Postgres) | RLS for branch scoping |
| Auth | Supabase Google OAuth + JWT | |
| Money | Scaled integers (bigint) | Reuse `toScaled`/`fromScaled` helpers from sneaker-doc-pos |
| Platform | Mobile-first web app | Primary usage is teachers on phones |
| Multi-branch | Yes | Franchise locations, branch-scoped data |

---

## 6. Data Model Summary

The full ERD with column definitions, constraints, and design rationale is in `discovery/erd.md`. This section provides a structural overview.

### 6.1 Entities

| Entity | Purpose | Origin |
|--------|---------|--------|
| `branches` | Franchise locations. All data is scoped to a branch. | Direct reuse from sneaker-doc-pos |
| `users` | Teachers, admins, superadmins. Auth linked to Supabase. | Adapted -- `staff` role renamed to `teacher` |
| `families` | Parent/guardian records. The paying unit. | Net-new -- split from sneaker-doc-pos `customers` |
| `students` | Enrolled children. Linked to a family and a branch. | Net-new -- split from sneaker-doc-pos `customers` |
| `student_teacher_assignments` | Links each student to one active teacher. Historical assignments preserved. | Net-new |
| `payment_periods` | Monthly billing cycles per student. Tracks expected vs. paid amounts. | Net-new |
| `payments` | Individual payment records with verification workflow. | Adapted -- merged from sneaker-doc-pos `transactions` + `claim_payments` |
| `audit_log` | System-wide mutation audit trail. | Direct reuse from sneaker-doc-pos |

### 6.2 Core Data Flow

```
Family (guardian)
  +-- Student (child)
        +-- student_teacher_assignments --> Teacher (user)
        +-- payment_periods (monthly billing)
        |     +-- payments (recorded by teacher, verified by admin)
        +-- Branch (scoping)
```

### 6.3 Key Relationships

A family has one or more students. Each student belongs to exactly one family and one branch. Each student has one active teacher assignment at a time (enforced by a partial unique index). Payment periods are created per student per month, tracking the expected tuition amount and running total of verified payments. Individual payment records link a student, a period, and a receipt together. Payments start at `pending_review` and progress through admin verification. Only verified payments update the period's paid amount.

### 6.4 Dropped from sneaker-doc-pos

| Table | Reason |
|-------|--------|
| `transaction_items` | Replaced by per-student payment records (one payment per student per period) |
| `card_banks` | No card fee management in Kumon |
| `services` | No service catalog -- Kumon has a single service (tutoring) |
| `promos` | No promotional codes |
| `expenses` | Out of PoC scope |
| `deposits` | Out of PoC scope |
| `staff_documents` | Out of PoC scope |

---

## 7. Feature Requirements

### 7.1 Teacher Payment Recording (SDC)

The full 10-step user flow is documented in `discovery/user-flow-teacher-sdc.md`. Key requirements:

**Student list and selection:**
- Teacher sees only their assigned students (filtered by active `student_teacher_assignments`).
- Each student row shows: name, guardian name, Kumon level, and a color-coded payment status indicator for the current period (green = paid, yellow = partial, red = unpaid/overdue, gray = not yet due).
- Search bar filters by student first or last name with 2-3 keystrokes.

**Auto-fill and context:**
- On student selection, the form pre-fills: student name, guardian name, guardian phone, current period, expected amount, outstanding balance.
- `expectedAmountSnapshot` is frozen from `payment_periods.expectedAmount` at recording time.

**Manual input fields:**
- Reference number (required)
- Amount paid (required, placeholder shows expected amount)
- Payment method (required: bank_transfer, gcash, cash, other)
- Payment date (required, defaults to today, cannot be future)
- Receipt screenshot (required, max 5MB)
- Notes (optional)

**Multi-sibling batch recording:**
- If the student's family has other enrolled siblings, a banner offers batch mode.
- Teacher selects which siblings to include. Each sibling gets its own amount and reference number fields. Receipt image, payment date, method, and notes are shared.
- System creates N separate `payments` records (one per student), each linked to its own period. All share the same receipt image URL.

**Confirmation and submission:**
- Summary screen shows all data before submit, with a warning if any amount differs from expected by more than 10%.
- On submit, each payment is created with `status = pending_review`. An `audit_log` entry is written for each.

### 7.2 Admin Verification Workflow

- Admin sees all `pending_review` payments in a consolidated queue.
- Filterable by branch, teacher, family, date range, and status.
- For each payment: receipt image, amount vs. expected, reference number, teacher who recorded it, timestamp.
- Actions per payment:
  - **Verify** -- confirms payment is valid. Amount is added to `payment_periods.paidAmount`. Period status recalculates.
  - **Flag** -- marks for clarification (amount mismatch, unclear receipt, duplicate suspicion). Teacher or admin provides additional context.
  - **Reject** -- marks as invalid (duplicate, fraudulent, wrong student). No effect on `paidAmount`.
- Multi-sibling batch payments are visually grouped by family in the admin queue.

**Status state machine:**

```
pending_review --> verified
pending_review --> flagged --> verified
pending_review --> flagged --> rejected
pending_review --> rejected
```

### 7.3 Admin Spreadsheet View

- Grid layout: students as rows, months as columns.
- Each cell shows: expected amount, paid amount, and a status indicator.
- Filterable by branch, teacher, family, and payment status.
- CSV export for the transition period (admin can continue using spreadsheets in parallel).
- CSV import for initial data migration from Nina's existing spreadsheet.

### 7.4 Visual Dashboards

- Payment consistency graphs: monthly collection rates over time.
- Irregularity flags: students with repeated partial payments, overdue patterns.
- Monthly payer counts: how many students paid, partially paid, or missed each month.
- Branch-level comparison (when multiple branches are active).
- Missing payment detection: students with no payment record for the current period, surfaced prominently.

### 7.5 Payment Period Management

- Admin creates and manages payment periods per student (monthly billing cycles).
- Each period specifies: expected amount and due date.
- Period status auto-computes based on verified payments:
  - `pending` -- no verified payments, not past due.
  - `partial` -- some verified payment, but less than expected.
  - `paid` -- paid in full (paidAmount >= expectedAmount).
  - `overdue` -- past due date and not fully paid.
- Bulk period generation: create periods for all active students for a given month in one action.

### 7.6 Student and Family Management

- CRUD operations for families: guardian name, phone (primary lookup key), email, address, notes.
- CRUD operations for students: linked to family and branch, with level, enrollment date, and status (active/inactive/withdrawn).
- Teacher assignment management: assign or reassign students to teachers. Historical assignments are preserved.
- CSV import for initial migration from Nina's existing student and family spreadsheet.

---

## 8. Validation Rules

All validation rules apply to the teacher payment recording form. Sourced from the user flow document, Section 7.

| # | Field | Rule | Message | Severity |
|---|-------|------|---------|----------|
| 1 | Reference number | Required; non-empty after trim | "Reference number is required" | Error (blocks submit) |
| 2 | Reference number | No duplicates across all payments in the system | "This reference number has already been used (PAY-NNNN). Please verify this is not a duplicate entry." | Error (blocks submit) |
| 3 | Amount | Required; must be a positive number | "Amount must be greater than zero" | Error (blocks submit) |
| 4 | Amount | Warn if differs from expected by more than 10% | "Amount differs from expected (PHP X,XXX) by more than 10%. Please verify." | Warning (allows submit) |
| 5 | Receipt image | Required; at least one image | "Receipt screenshot is required" | Error (blocks submit) |
| 6 | Receipt image | Max file size 5MB | "File exceeds 5MB limit. Please upload a smaller image." | Error (blocks submit) |
| 7 | Student | Must belong to teacher's assigned branch | "Student is not in your assigned branch" | Error (system-enforced) |
| 8 | Payment date | Required; cannot be a future date | "Payment date cannot be in the future" | Error (blocks submit) |
| 9 | Payment date | Warn if more than 30 days in the past | "Payment date is more than 30 days ago. Please verify this is correct." | Warning (allows submit) |
| 10 | Payment method | Required; must be a valid option | "Please select a payment method" | Error (blocks submit) |

---

## 9. RBAC Matrix

| Feature | Teacher | Admin | Superadmin |
|---------|---------|-------|------------|
| Record payment | Own students only | All students | All students, all branches |
| View student list | Own assigned students | All students in branch | All students, all branches |
| Verify/flag/reject payments | No | Yes (own branch) | Yes (all branches) |
| View payment history | Own recordings only | All in branch | All, all branches |
| Manage students and families | No | Yes (own branch) | Yes (all branches) |
| Manage payment periods | No | Yes (own branch) | Yes (all branches) |
| View dashboards | No | Yes (own branch) | Yes (all branches) |
| Manage branches | No | No | Yes |
| Manage users | No | No | Yes |
| Import/export CSV | No | Yes (own branch) | Yes (all branches) |
| Reassign students to teachers | No | Yes (own branch) | Yes (all branches) |

---

## 10. Non-Functional Requirements

- **Mobile-first responsive design.** Primary usage is teachers recording payments on their phones. All core flows must be usable on a 390px viewport.
- **Performance.** Page load under 2 seconds on 4G connections. Student list and payment form must feel instant.
- **Receipt image handling.** Upload with client-side compression. Max 5MB per image. Stored in Supabase Storage.
- **Row-level security.** Supabase RLS policies enforce branch scoping. Teachers see only their assigned students. Admins see only their branch. Superadmins see everything.
- **Audit trail.** All mutations are logged via the AuditModule (reused from sneaker-doc-pos). Every payment creation, verification, rejection, student change, and data import is recorded.
- **Scale.** The system supports approximately 15-20 concurrent users. This is a single-franchise tool, not a SaaS platform. Infrastructure should be right-sized accordingly.
- **Availability.** Standard web app availability. No SLA requirements for the PoC. Teachers can retry if the app is briefly unavailable.

---

## 11. Migration Strategy

Nina's center currently runs on spreadsheets. The migration plan:

1. **Student and family CSV import.** Admin uploads Nina's existing student roster. The import script creates `families` and `students` records, linking students to families by guardian name or phone number.
2. **Teacher assignment.** After student import, admin assigns each student to their teacher through the UI or a bulk assignment CSV.
3. **Historical payment data (optional).** If Nina has structured payment history in her spreadsheets, a CSV import can populate `payment_periods` and `payments` records for past months. This is useful for the dashboard but not required for go-live.
4. **Payment period seeding.** Before go-live, admin generates payment periods for the current month for all active students (bulk generation feature from Section 7.5).
5. **Day-one experience.** Teachers open the app and see their assigned students already populated with current period information. No manual setup required by teachers.

---

## 12. Open Design Questions

These need client confirmation before build:

1. **Family-student relationship model.** The current ERD enforces a hard one-to-many: each student belongs to exactly one family. If Nina has cross-family guardianship edge cases (shared custody, grandparent pickups with separate billing), this needs discussion. The schema can accommodate it, but the UI and billing logic would need adjustments.

2. **Tuition rate management.** Payment periods are per-student, not per-Kumon-level. Each student's expected amount is set individually on their period record. If Nina wants a single tuition rate per Kumon level that auto-applies to all students at that level, that is a future enhancement -- not in the initial build. For the PoC, admins set the expected amount when creating periods (or during bulk generation).

---

## 13. Out of Scope

The following are future modules within the kumon-iligan-ops platform. They are not part of kumon-tuition-management:

- **Attendance tracking** -- daily student attendance records
- **Payroll** -- teacher compensation and payroll management
- **Student progress tracking** -- Kumon level advancement and worksheet completion
- **Franchise operations management** -- cross-branch analytics and operational tools
- **Parent portal** -- parent-facing access to payment history or student progress

The platform is designed to accommodate these modules. The data model (branches, users, families, students) is shared infrastructure that future modules will build on.

---

## 14. Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Admin time on payment data entry | 90% reduction | From manual transcription to review-only. Measured by comparing hours spent pre/post launch. |
| Missing payment detection | 100% visibility | System flags every student with no payment for the current period. Zero missed students. |
| Payment recording time per teacher | Under 30 seconds per payment | Measured from student selection to submission. |
| Data accuracy | Zero transcription errors | Direct entry by teachers replaces admin copy-from-email. Errors shift from transcription to input validation. |
| Duplicate reference detection | 100% catch rate | System blocks duplicate reference numbers at submission time. |

---

## 15. References

- **Discovery call transcript:** [Fireflies recording](https://app.fireflies.ai/view/Discovery-Call-Mrs-Ms-Quijano::01KN69QDQ6HTGGG067QCJ84F2N) (April 3, 2026, 36:07)
- **Entity Relationship Diagram:** `discovery/erd.md`
- **Teacher SDC user flow:** `discovery/user-flow-teacher-sdc.md`
- **Pipeline repo:** https://github.com/SymphonyAgents/product-kumon-iligan-ops
- **Base codebase:** https://github.com/SymphonyAgents/sneaker-doc-pos
- **App repo (to be created at build phase):** https://github.com/SymphonyAgents/kumon-iligan-ops
