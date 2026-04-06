# User Flow: Teacher SDC (Source Data Capture) — Payment Recording

## 1. Overview

SDC (Source Data Capture) is the mobile-first form teachers use to record tuition payments from parents into the Kumon Iligan Operations Platform. In the current workflow, parents pay via bank transfer or GCash, then send a receipt screenshot to their teacher through group chat. The teacher currently forwards this to an admin email, and the admin manually transcribes it into a spreadsheet. SDC eliminates the email forwarding and manual transcription steps entirely — the teacher records the payment directly in the system, and it appears in the admin's verification queue within seconds.

---

## 2. Step-by-Step Flow

### Step 1: Teacher Opens App

- **Sees:** Login screen (if not already authenticated) or student list (if session is active).
- **Does:** Opens the app URL in their mobile browser. Authenticates via Google OAuth if prompted.
- **System:** Validates the teacher's Supabase auth session. Resolves their `branchId` and loads their assigned student list.

### Step 2: Teacher Sees Assigned Student List

- **Sees:** A list of all students assigned to them via `student_teacher_assignments` (active only). Each student row shows: student name, family guardian name, Kumon level, and a color-coded payment status indicator for the current period (green/yellow/red/gray — see Section 4).
- **Does:** Scans the list to find the student whose payment they need to record. Can sort or filter by status to prioritize unpaid students.
- **System:** Queries `student_teacher_assignments` WHERE `teacherId` = current user AND `isActive` = true. Joins `students`, `families`, and the current `payment_periods` record for each student to compute the status indicator.

### Step 3: Teacher Selects a Student

- **Sees:** Search bar at the top of the student list. Results filter as they type.
- **Does:** Taps a student row directly, or types 2-3 characters of the student's first or last name to narrow the list, then taps the matching row.
- **System:** Filters the student list client-side. On tap, navigates to the payment recording form for that student.

### Step 4: System Auto-Fills Student and Period Information

- **Sees:** The payment recording form with pre-filled fields: student name, guardian name, guardian phone, current period (e.g. "April 2026"), expected amount, current payment status for this period, and outstanding balance (expectedAmount - paidAmount).
- **Does:** Reviews the auto-filled information for accuracy. Does not edit these fields.
- **System:** Loads the student's `families` record, the active `payment_periods` record for the current month/year, and computes outstanding balance. Sets `expectedAmountSnapshot` from `payment_periods.expectedAmount`.

### Step 5: System Shows Sibling Indicator

- **Sees:** If the student's family has other enrolled students (siblings), a banner appears: "N siblings enrolled" with a toggle to "Record payment for multiple students."
- **Does:** If the parent paid for multiple children in one transaction, taps the banner to enter multi-sibling mode (see Section 5). Otherwise, continues with single-student flow.
- **System:** Queries `students` WHERE `familyId` = selected student's family AND `status` = 'active' AND `id` != current student. If count > 0, shows the sibling banner.

### Step 6: Teacher Fills Payment Details

- **Sees:** Manual input fields below the auto-filled section:
  - Reference number (text input)
  - Amount paid (numeric input, pre-populated with expected amount as placeholder)
  - Payment method (dropdown: Bank Transfer, GCash, Cash, Other)
  - Payment date (date picker, defaults to today)
  - Receipt screenshot (camera/file upload button)
  - Notes (optional text area)
- **Does:** Enters the reference number from the receipt, the amount paid, selects the payment method, confirms or adjusts the payment date, uploads the receipt screenshot, and optionally adds notes.
- **System:** Validates inputs in real-time (see Section 7). Uploads the receipt image to Supabase Storage and stores the URL.

### Step 7: Multi-Sibling Input (Conditional)

- **Sees:** If multi-sibling mode was activated in Step 5, the form expands to show each selected sibling as a sub-section. Each sibling section shows their auto-filled period info (name, expected amount, outstanding balance) and has its own amount paid and reference number fields. The receipt screenshot and payment date are shared across all siblings.
- **Does:** Enters the amount and reference number for each sibling. May use the same reference number if the parent made one lump payment, or different reference numbers if payments were separate.
- **System:** Validates each sibling's fields independently. See Section 5 for the full multi-sibling sub-flow.

### Step 8: Teacher Reviews Summary

- **Sees:** A summary screen showing all the data that will be submitted:
  - Student name(s) and period(s)
  - Amount(s) paid vs. expected
  - Payment method, reference number(s), payment date
  - Receipt screenshot thumbnail
  - Notes (if any)
  - A warning banner if any amount differs from expected by more than 10%
- **Does:** Reviews for accuracy. Taps "Submit" to confirm, or "Back" to edit.
- **System:** No writes yet. This is a confirmation gate.

### Step 9: System Records Payment

- **Sees:** A brief loading spinner, then a success screen with a confirmation message and the auto-generated payment number (e.g. "PAY-0042").
- **Does:** Acknowledges the confirmation. Can tap "Record Another" to return to the student list, or close the app.
- **System:** Creates one `payments` record per student (multiple records if multi-sibling). Sets:
  - `recordedBy` = authenticated teacher's user ID
  - `branchId` = teacher's assigned branch
  - `periodId` = the active payment period for the student
  - `status` = `pending_review`
  - `createdAt` = server timestamp
  - `expectedAmountSnapshot` = copied from `payment_periods.expectedAmount`
  - Writes an `audit_log` entry with `auditType` = `payment_recorded` for each payment created.

### Step 10: Payment Appears in Admin Queue

- **Sees:** (Admin view, not teacher view) The new payment(s) appear in the admin's pending review list, grouped by family if multiple siblings were included. Each entry shows: student name, amount, reference number, receipt thumbnail, teacher who recorded it, and timestamp.
- **Does:** (Admin) Reviews and verifies, flags, or rejects the payment — this is a separate admin flow, not part of the teacher SDC.
- **System:** The payment sits at `pending_review` until an admin acts on it. No changes to `payment_periods.paidAmount` occur until the payment is `verified`.

---

## 3. Manual vs. Automatic Fields

### Fields the Teacher Manually Enters

| Field | Input Type | Required | Notes |
|-------|-----------|----------|-------|
| Reference number | Text | Yes | Bank transfer or GCash reference from the receipt |
| Amount paid | Numeric | Yes | Actual amount the parent paid. Placeholder shows expected amount. |
| Payment method | Dropdown | Yes | Options: bank_transfer, gcash, cash, other |
| Payment date | Date picker | Yes | Defaults to today. Cannot be a future date. |
| Receipt screenshot | Camera/file upload | Yes | Photo of the payment receipt or GCash confirmation. Max 5MB. |
| Notes | Text area | No | Optional context: "parent says will pay remaining next week", etc. |

### Fields the System Fills Automatically

| Field | Source | Notes |
|-------|--------|-------|
| `recordedBy` | Authenticated user session | Teacher's `users.id` from Supabase Auth |
| `recorded_at` / `createdAt` | Server timestamp | Set at write time, not editable |
| `branchId` | Teacher's `users.branchId` | Teacher's assigned branch |
| `periodId` | Current active `payment_periods` record | Matched by `studentId` + current month/year |
| `status` | Default value | Always `pending_review` on creation |
| `expectedAmountSnapshot` | `payment_periods.expectedAmount` | Frozen at recording time for audit trail |
| `familyId` | `students.familyId` | Denormalized from the student record |
| `number` | Auto-generated sequence | Format: PAY-NNNN |

---

## 4. Payment Status Indicators (Student List)

The student list uses color-coded status indicators so teachers can see at a glance which students have paid for the current period.

| Color | Meaning | Condition |
|-------|---------|-----------|
| Green | Paid this month | `payment_periods.status` = `paid` (paidAmount >= expectedAmount) |
| Yellow | Partial payment | `payment_periods.status` = `partial` (some verified payment, but paidAmount < expectedAmount) |
| Red | Unpaid — approaching or past due | `payment_periods.status` = `pending` or `overdue`, AND the period's `dueDate` is within 7 days or has passed |
| Gray | Not yet due | No `payment_periods` record exists for the current month, OR the period exists but `dueDate` is more than 7 days away and status is `pending` |

Notes:
- Status reflects **verified** payments only. A payment at `pending_review` does not change the indicator — only once an admin marks it `verified` does `paidAmount` update.
- Teachers cannot change these indicators directly. They are computed from `payment_periods` data.

---

## 5. Multi-Sibling Flow

When a parent pays for multiple children in one transaction, the teacher can record all payments in a single flow instead of repeating the process per child.

### Sub-Flow

1. Teacher selects the first student from the list and opens the payment form.
2. System detects siblings: queries `students` with the same `familyId`, `status` = active, excluding the current student. If siblings exist, a banner appears: **"2 siblings enrolled — Record payment for multiple students?"**
3. Teacher taps the banner. A sibling selection screen appears showing each sibling's name, Kumon level, current period status, and expected amount.
4. Teacher checks the siblings they want to include in this batch and confirms.
5. The form expands. Each student (including the original) gets a sub-section with:
   - Auto-filled: student name, period, expected amount, outstanding balance
   - Manual: amount paid, reference number (may differ per sibling if parent made separate transfers)
6. Shared fields across all siblings: receipt screenshot, payment date, payment method, notes. These are entered once and apply to the entire batch.
7. Teacher reviews the summary (one combined summary screen showing all students).
8. On submit: the system creates **N separate `payments` records** (one per student), each linked to its own `periodId` and `studentId`. All records share the same `receiptImageUrl`. Each gets its own `number` (e.g. PAY-0042, PAY-0043).
9. All N payments are created with `status` = `pending_review`.
10. In the admin view, these payments are visually grouped by family, with a "batch" indicator showing they were recorded together.

### Design Rationale

- Separate `payments` records per student (not one combined record) because each student has their own `payment_periods` entry and may have different expected amounts.
- Shared receipt image URL avoids forcing the teacher to upload the same screenshot multiple times.
- Reference numbers may differ per sibling if the parent made separate GCash transfers for each child, or may be identical if one lump sum covered all children.

---

## 6. Status State Diagram

```
[Teacher records payment]
        |
        v
  pending_review
        |
   +----+----+-----------+
   |         |           |
   v         v           v
verified   flagged     rejected
             |
             v
      (teacher or admin
       provides clarification)
             |
        +----+----+
        |         |
        v         v
     verified   rejected
```

### State Definitions

| Status | Description | Who Triggers |
|--------|-------------|-------------|
| `pending_review` | Payment has been recorded by a teacher and is awaiting admin review. No effect on `paidAmount` yet. | System (automatic on creation) |
| `verified` | Admin has confirmed the payment is valid. The `amount` is added to `payment_periods.paidAmount` and the period status recalculates. | Admin |
| `flagged` | Admin has flagged the payment for clarification — amount mismatch, unreadable receipt, duplicate suspicion, etc. Teacher or admin can provide additional context, after which the payment moves to `verified` or `rejected`. | Admin |
| `rejected` | Admin has determined the payment is invalid — duplicate entry, fraudulent receipt, incorrect student, etc. No effect on `paidAmount`. | Admin |

---

## 7. Validation Rules

| Field | Rule | Error Message | Severity |
|-------|------|---------------|----------|
| Reference number | Required; non-empty after trim | "Reference number is required" | Error (blocks submit) |
| Reference number | Check for duplicates across all `payments` in the system | "This reference number has already been used (PAY-NNNN). Please verify this is not a duplicate entry." | Error (blocks submit) |
| Amount | Required; must be a positive number | "Amount must be greater than zero" | Error (blocks submit) |
| Amount | Warn if differs from `expectedAmountSnapshot` by more than 10% | "Amount differs from expected (PHP X,XXX) by more than 10%. Please verify." | Warning (allows submit) |
| Receipt image | Required; must upload at least one image | "Receipt screenshot is required" | Error (blocks submit) |
| Receipt image | Max file size 5MB | "File exceeds 5MB limit. Please upload a smaller image." | Error (blocks submit) |
| Student | Required; must belong to teacher's assigned branch | "Student is not in your assigned branch" | Error (system-enforced, not user-facing under normal use) |
| Payment date | Required; cannot be a future date | "Payment date cannot be in the future" | Error (blocks submit) |
| Payment date | Warn if more than 30 days in the past | "Payment date is more than 30 days ago. Please verify this is correct." | Warning (allows submit) |
| Payment method | Required; must be one of: bank_transfer, gcash, cash, other | "Please select a payment method" | Error (blocks submit) |

---

## 8. Mapping to sneaker-doc-pos Transaction Flow

| sneaker-doc-pos | kumon-iligan-ops | Notes |
|----------------|-----------------|-------|
| Transaction creation | Payment recording | Teacher is the staff; student lookup replaces phone lookup |
| Item status (pending/done) | Payment status (pending_review/verified) | Simpler — no item-level status, one status per payment |
| Staff assignment | Teacher-student assignment | Fixed class list vs walk-in customer |
| Receipt/photo capture | Receipt screenshot upload | Same Supabase Storage pattern |
| Branch scoping (`scopedBranchId`) | Branch scoping (`branchId`) | Direct reuse |
| `claimPayments.referenceNumber` | `payments.referenceNumber` | Same field, same purpose |
| `claimPayments.amount` | `payments.amount` | Scaled integer, same `toScaled`/`fromScaled` |
| `transactions.staffId` | `payments.recordedBy` | Who recorded the entry |
| `AuditModule` | `AuditModule` | Global module, direct reuse |
| Customer phone lookup | Student name search (2-3 keystrokes) | Different lookup key; same quick-search UX pattern |
| Single transaction per customer | Multi-sibling batch per family | Net-new capability; sneaker-doc-pos has no equivalent |
| No verification workflow | Admin verify/flag/reject flow | Net-new; sneaker-doc-pos transactions are final on creation |
