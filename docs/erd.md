# Kumon Iligan Operations Platform — Entity Relationship Diagram

## Overview

This schema supports a tuition payment tracking system for Mrs. Nina Quijano's Kumon franchise in Iligan. The core workflow is: parents pay tuition (bank transfer or GCash), send a receipt screenshot to their child's teacher, the teacher records the payment in the system, and admins verify and reconcile payments across all students and branches.

Key design decisions:

- **Family/Student split** — sneaker-doc-pos had a single `customers` table. Kumon requires a one-to-many relationship between guardians and enrolled students, so this becomes two entities (`families` and `students`).
- **Payment = Transaction + ClaimPayment merged** — sneaker-doc-pos separated the transaction record from the payment record. In Kumon, each payment is a single atomic event (parent pays, teacher records), so these are merged into one `payments` table with a verification workflow.
- **Scaled integers for money** — all monetary columns use `bigint` with the same `toScaled`/`fromScaled` helpers from sneaker-doc-pos. No floating point.
- **Payment periods** — Kumon bills monthly per student. The `payment_periods` table tracks expected vs. actual amounts per student per month, enabling the spreadsheet-like consolidated view admins need.
- **Multi-branch** — carried over from sneaker-doc-pos. All student, payment, and assignment data is scoped to a branch.

---

## Entities

### branches

Franchise locations. Direct reuse from sneaker-doc-pos.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| name | varchar(255) | NOT NULL | e.g. "Kumon Iligan - Tibanga" |
| streetName | varchar(255) | | |
| barangay | varchar(255) | | |
| city | varchar(255) | | |
| province | varchar(255) | | |
| country | varchar(255) | DEFAULT 'PH' | |
| phone | varchar(20) | | Branch contact number |
| isActive | boolean | DEFAULT true | Soft-disable branch |
| createdById | uuid | FK → users.id | Who created this branch |
| createdAt | timestamptz | DEFAULT now() | |

---

### users

Teachers, admins, and super-admins. Adapted from sneaker-doc-pos — role values changed from `superadmin | admin | staff` to `superadmin | admin | teacher`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, matches Supabase auth.users.id | Same pattern as sneaker-doc-pos |
| email | varchar(255) | UNIQUE, NOT NULL | Google OAuth email |
| nickname | varchar(100) | | Display name |
| fullName | varchar(255) | NOT NULL | |
| contactNumber | varchar(20) | | |
| birthday | date | | |
| address | text | | |
| emergencyContactName | varchar(255) | | |
| emergencyContactNumber | varchar(20) | | |
| userType | varchar(20) | NOT NULL, CHECK (userType IN ('superadmin', 'admin', 'teacher')) | Adapted: `staff` renamed to `teacher` |
| status | varchar(20) | NOT NULL, DEFAULT 'pending', CHECK (status IN ('active', 'pending', 'rejected')) | Approval workflow |
| branchId | uuid | FK → branches.id | Primary branch assignment |
| isActive | boolean | DEFAULT true | Soft-disable user |
| createdAt | timestamptz | DEFAULT now() | |

---

### families

Parent/guardian records. Net-new entity — split from sneaker-doc-pos `customers`.

In the Kumon workflow, a family is the paying unit. One guardian may have multiple students enrolled. Teachers and admins look up families by phone number (the guardian's GCash or contact number).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| guardianName | varchar(255) | NOT NULL | Parent or guardian full name |
| guardianPhone | varchar(20) | UNIQUE, NOT NULL | Primary lookup key (same pattern as sneaker-doc-pos customers.phone) |
| guardianEmail | varchar(255) | | Optional |
| streetName | varchar(255) | | |
| barangay | varchar(255) | | |
| city | varchar(255) | | |
| province | varchar(255) | | |
| country | varchar(255) | DEFAULT 'PH' | |
| notes | text | | Irregular cases: "pays two kids together", "usually late", etc. |
| branchId | uuid | FK → branches.id, NOT NULL | Primary branch (for scoping) |
| createdAt | timestamptz | DEFAULT now() | |
| updatedAt | timestamptz | DEFAULT now() | |

---

### students

Enrolled students. Net-new entity — split from sneaker-doc-pos `customers`.

Each student belongs to exactly one family and one branch. Students have a Kumon level that determines their curriculum track.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| familyId | uuid | FK → families.id, NOT NULL | Parent/guardian link |
| branchId | uuid | FK → branches.id, NOT NULL | Multi-branch scoping |
| firstName | varchar(100) | NOT NULL | |
| lastName | varchar(100) | NOT NULL | |
| level | varchar(50) | | Kumon level: "Pre-school", "Level 1", "Level 2A", "Level 2B", etc. Varchar because levels vary by franchise. |
| enrollmentDate | date | NOT NULL | When the student enrolled at this branch |
| status | varchar(20) | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'inactive', 'withdrawn')) | |
| createdAt | timestamptz | DEFAULT now() | |
| updatedAt | timestamptz | DEFAULT now() | |

---

### student_teacher_assignments

Links each student to their assigned teacher. Net-new entity.

Each student is assigned to exactly one active teacher at a time. When a reassignment happens, the existing record is soft-closed (`unassignedAt` is set, `isActive` flipped to false) and a new record is created. Historical assignments are preserved for audit purposes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| studentId | uuid | FK → students.id, NOT NULL | |
| teacherId | uuid | FK → users.id, NOT NULL | Must be a user with userType = 'teacher' |
| branchId | uuid | FK → branches.id, NOT NULL | Denormalized from student for query efficiency |
| isActive | boolean | DEFAULT true | Only one active assignment per student (enforced via partial unique index) |
| assignedAt | timestamptz | DEFAULT now() | When teacher was assigned |
| unassignedAt | timestamptz | | NULL = currently active; set when reassigned or student leaves |

**Partial unique index:** `UNIQUE (studentId) WHERE isActive = true` — ensures only one active teacher per student.

---

### payment_periods

Monthly billing cycles per student. Net-new entity.

One record per student per calendar month. Tracks the expected tuition amount and payment status for that period. This is the backbone of the admin's consolidated spreadsheet view.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| studentId | uuid | FK → students.id, NOT NULL | |
| periodMonth | smallint | NOT NULL, CHECK (periodMonth BETWEEN 1 AND 12) | Calendar month (1 = January) |
| periodYear | smallint | NOT NULL | e.g. 2026 |
| expectedAmount | bigint | NOT NULL | Tuition for this period, scaled integer |
| paidAmount | bigint | DEFAULT 0 | Running total of verified payments, scaled integer |
| dueDate | date | NOT NULL | Payment deadline for this period |
| status | varchar(20) | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'partial', 'paid', 'overdue')) | Computed/updated as payments come in |
| createdAt | timestamptz | DEFAULT now() | |
| updatedAt | timestamptz | DEFAULT now() | |

**Unique constraint:** `UNIQUE (studentId, periodMonth, periodYear)` — one period per student per month.

**Status logic:**
- `pending` — no verified payments yet, not past due date
- `partial` — verified payments exist but paidAmount < expectedAmount
- `paid` — paidAmount >= expectedAmount
- `overdue` — past dueDate and status is not `paid`

---

### payments

Individual payment records. Adapted from sneaker-doc-pos `transactions` + `claim_payments` (merged).

This is the core transactional entity. A teacher records a payment when a parent sends a receipt screenshot. An admin later verifies (or flags/rejects) it. The `expectedAmountSnapshot` preserves the tuition rate at the time of recording for audit purposes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| number | varchar(10) | UNIQUE, NOT NULL | Auto-generated reference, e.g. "PAY-0001" |
| studentId | uuid | FK → students.id, NOT NULL | Which student this payment is for |
| familyId | uuid | FK → families.id, NOT NULL | Denormalized for family-level queries |
| periodId | uuid | FK → payment_periods.id, NOT NULL | Which billing period this covers |
| amount | bigint | NOT NULL | Actual amount paid, scaled integer |
| expectedAmountSnapshot | bigint | NOT NULL | Snapshot of payment_periods.expectedAmount at time of recording |
| paymentMethod | varchar(20) | NOT NULL, CHECK (paymentMethod IN ('bank_transfer', 'gcash', 'cash', 'other')) | |
| referenceNumber | varchar(100) | | Bank/GCash reference number from receipt |
| receiptImageUrl | text | | URL to uploaded receipt screenshot |
| paymentDate | date | NOT NULL | When the parent actually paid |
| status | varchar(20) | NOT NULL, DEFAULT 'pending_review', CHECK (status IN ('pending_review', 'verified', 'flagged', 'rejected')) | Verification workflow |
| note | text | | Teacher or admin notes |
| recordedBy | uuid | FK → users.id, NOT NULL | Teacher who entered the payment |
| verifiedBy | uuid | FK → users.id | Admin who verified/flagged/rejected |
| verifiedAt | timestamptz | | When verification action was taken |
| branchId | uuid | FK → branches.id, NOT NULL | Denormalized for branch-scoped queries |
| createdAt | timestamptz | DEFAULT now() | |
| updatedAt | timestamptz | DEFAULT now() | |

**Status flow:** `pending_review` → `verified` | `flagged` | `rejected`

- Teacher records payment → status = `pending_review`
- Admin reviews → sets to `verified` (amount rolls into payment_periods.paidAmount), `flagged` (needs clarification), or `rejected` (invalid)

---

### audit_log

System-wide audit trail. Direct reuse from sneaker-doc-pos, with audit types adapted for the Kumon domain.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default gen_random_uuid() | |
| createdAt | timestamptz | DEFAULT now() | |
| action | varchar(50) | NOT NULL | e.g. "create", "update", "delete", "verify", "reject" |
| auditType | varchar(50) | NOT NULL | See AUDIT_TYPES constants below |
| entityType | varchar(50) | NOT NULL | Table name: "payments", "students", "families", etc. |
| entityId | uuid | NOT NULL | PK of the affected row |
| source | varchar(50) | | "web", "import", "system" |
| performedBy | uuid | FK → users.id | Who performed the action |
| branchId | uuid | FK → branches.id | Branch context |
| details | jsonb | | Freeform payload: old values, new values, metadata |

---

## Constants

### USER_TYPE

| Value | Description |
|-------|-------------|
| `superadmin` | Full system access across all branches |
| `admin` | Branch-level admin: verifies payments, manages students and teachers |
| `teacher` | Records payments, views assigned students only |

### PAYMENT_METHOD

| Value | Description |
|-------|-------------|
| `bank_transfer` | Bank deposit or online transfer |
| `gcash` | GCash mobile payment |
| `cash` | In-person cash payment |
| `other` | Any other method |

### PAYMENT_STATUS

| Value | Description |
|-------|-------------|
| `pending_review` | Teacher recorded, awaiting admin verification |
| `verified` | Admin confirmed payment is valid |
| `flagged` | Admin flagged for clarification (amount mismatch, unclear receipt, etc.) |
| `rejected` | Admin rejected (duplicate, fraudulent, or invalid) |

### STUDENT_STATUS

| Value | Description |
|-------|-------------|
| `active` | Currently enrolled and attending |
| `inactive` | Temporarily not attending (on hold) |
| `withdrawn` | Formally withdrawn from Kumon |

### PERIOD_STATUS

| Value | Description |
|-------|-------------|
| `pending` | No verified payments, not yet overdue |
| `partial` | Some payment received, but less than expected amount |
| `paid` | Paid in full (paidAmount >= expectedAmount) |
| `overdue` | Past due date and not fully paid |

### AUDIT_TYPES

| Value | Description |
|-------|-------------|
| `payment_recorded` | Teacher recorded a new payment |
| `payment_verified` | Admin verified a payment |
| `payment_flagged` | Admin flagged a payment for review |
| `payment_rejected` | Admin rejected a payment |
| `student_enrolled` | New student added to the system |
| `student_status_changed` | Student status updated (active/inactive/withdrawn) |
| `student_reassigned` | Student reassigned to a different teacher |
| `family_created` | New family record created |
| `family_updated` | Family details updated |
| `period_created` | New payment period generated |
| `period_adjusted` | Expected amount or due date changed on a period |
| `user_created` | New user account created |
| `user_status_changed` | User approved, rejected, or deactivated |
| `branch_created` | New branch added |
| `data_imported` | Bulk data imported from spreadsheet |
| `data_exported` | Data exported to spreadsheet |

---

## Mapping from sneaker-doc-pos

| sneaker-doc-pos Table | kumon-iligan-ops Table | Status | Notes |
|----------------------|----------------------|--------|-------|
| branches | branches | Direct reuse | Same structure, same multi-branch pattern |
| users | users | Adapted | `userType` values changed: `staff` → `teacher` |
| customers | families + students | Adapted (split) | One customer concept becomes guardian + enrolled children |
| transactions | payments | Adapted (merged) | Combined with claim_payments; added period linkage, verification workflow |
| claim_payments | payments | Adapted (merged) | Payment method, reference number, amount merged into payments table |
| audit_log | audit_log | Direct reuse | Same structure, audit types adapted for Kumon domain |
| transaction_items | — | Dropped | Replaced by per-student payment records (one payment per student per period) |
| card_banks | — | Dropped | No card fee management in Kumon |
| services | — | Dropped | No service catalog; Kumon has a single service (tutoring) |
| promos | — | Dropped | No promotional codes |
| expenses | — | Dropped | Out of PoC scope |
| deposits | — | Dropped | Out of PoC scope |
| staff_documents | — | Dropped | Out of PoC scope |
| — | families | Net-new | Guardian/parent records split from customers |
| — | students | Net-new | Enrolled student records split from customers |
| — | student_teacher_assignments | Net-new | Fixed class list pattern (teacher sees only their students) |
| — | payment_periods | Net-new | Monthly billing cycle tracking per student |

---

## Relationships

### Entity Relationship Summary

- **branches → users** (one-to-many) — Each user belongs to a primary branch.
- **branches → families** (one-to-many) — Each family is associated with a primary branch.
- **branches → students** (one-to-many) — Each student is enrolled at a specific branch.
- **families → students** (one-to-many) — One guardian can have multiple enrolled children.
- **students → student_teacher_assignments** (one-to-many) — A student has one active assignment and zero or more historical assignments.
- **users (teacher) → student_teacher_assignments** (one-to-many) — A teacher can be assigned to multiple students.
- **students → payment_periods** (one-to-many) — One period record per student per month.
- **students → payments** (one-to-many) — A student can have multiple payment records across periods.
- **families → payments** (one-to-many) — Denormalized link for family-level payment queries.
- **payment_periods → payments** (one-to-many) — Multiple payments can apply to a single period (partial payments, corrections).
- **users (teacher) → payments.recordedBy** (one-to-many) — The teacher who entered the payment.
- **users (admin) → payments.verifiedBy** (one-to-many) — The admin who verified/flagged/rejected the payment.
- **users → audit_log.performedBy** (one-to-many) — Who performed the audited action.

### Core Data Flow

```
Family (guardian)
  └── Student (child)
        ├── student_teacher_assignments → Teacher (user)
        ├── payment_periods (monthly billing)
        │     └── payments (recorded by teacher, verified by admin)
        └── Branch (scoping)
```

---

## Design Decisions

### Why split customers into families + students?

sneaker-doc-pos has a flat `customers` table — one record per person who brings in shoes. Kumon's domain is fundamentally different: the paying entity (parent/guardian) is not the service recipient (student). One parent may have 2-3 children enrolled simultaneously, each with their own tuition schedule, level, and teacher assignment. A single flat table cannot model this without duplication or awkward self-referencing.

### Why merge transactions and claim_payments into a single payments table?

In sneaker-doc-pos, a transaction can have multiple items (shoes) and multiple payment events (deposit, final payment). Kumon payments are atomic: parent pays X amount for student Y's month Z. There is no multi-item concept and no split-payment workflow. Keeping two tables would add join complexity with no functional benefit.

### Why denormalize familyId and branchId on payments?

Payments are the most-queried table. Admins need to filter by family ("show me all payments from the Dela Cruz family") and by branch. While `familyId` is technically derivable via `payments → students → families`, the extra join on every admin dashboard query is unnecessary overhead. The denormalized FKs are maintained at write time (set from the student record) and are never independently updated.

### Why snapshot expectedAmount on payments?

Tuition rates can change. If an admin adjusts a period's `expectedAmount` after a payment was already recorded, the payment record should still reflect what was expected at the time of recording. This is critical for audit trails and dispute resolution. The `expectedAmountSnapshot` is set once at payment creation time and never updated.

### Why a partial unique index on student_teacher_assignments?

`UNIQUE (studentId) WHERE isActive = true` ensures at the database level that a student cannot have two active teachers simultaneously, while still allowing multiple historical (inactive) assignment records. This is the same soft-assignment pattern used in sneaker-doc-pos for staff assignments.

### Why payment_periods as a separate table?

The admin's primary view is a spreadsheet-like grid: students as rows, months as columns, with expected vs. paid amounts in each cell. This maps directly to `payment_periods` rows. Without this table, computing "how much does student X owe for March 2026?" would require aggregating all payments and comparing against a rate config — fragile and slow. The dedicated table makes the admin dashboard a straightforward query.
