# OPEN DESIGN QUESTIONS — Must Resolve Before Build

These items require clarification from Mrs. Nina Quijano before development begins. Building without answers here risks rework on core data structures.

---

## 1. Cross-Family Guardianship (CRITICAL)

**Current design:** Each student belongs to exactly one family. The `families` table represents one guardian, and `students.familyId` is a strict foreign key — one student, one family, no exceptions.

**The question:** Does the Kumon Iligan center have cases where a student is picked up, paid for, or managed by guardians from different families? Examples:

- Shared custody — two separated parents both pay tuition for the same child
- Step-families — a student's biological parent and step-parent both interact with the center
- Relatives — an aunt pays tuition some months, the parent pays other months

**Why this matters:** If any of these cases exist, the current one-to-many model (family → students) is too rigid. We would need a many-to-many relationship (a `student_guardians` junction table), which changes the payment recording flow, the admin view, and the multi-sibling logic.

**Impact if wrong:** Rework on 3 tables (families, students, payments) and the teacher recording flow. Easier to get right now than to migrate later.

**Action needed:** Confirm with Nina: "Does every student have exactly one paying guardian/family, or are there cases where multiple guardians share responsibility for one student?"

---

## 2. Tuition Rate by Kumon Level (IMPORTANT)

**Current design:** Each student's tuition is set individually via `payment_periods.expectedAmount`. When an admin creates a billing period, they set the expected amount per student.

**The question:** Does Kumon Iligan use a standard tuition rate per level? For example:

- Level 1 students all pay PHP 1,500/month
- Level 2A students all pay PHP 1,800/month
- Pre-school students all pay PHP 1,200/month

**Why this matters:** If rates are standardized by level, the current per-student approach forces the admin to manually set (or verify) the expected amount for every student every month. A `level_rates` table would let the system auto-fill the correct amount based on the student's Kumon level — less work for admin, fewer errors.

**Impact if wrong:** Not a data model break — this is additive. A `level_rates` table can be added later without reworking existing tables. But if Nina expects auto-filled rates from day one, it should be in the PoC scope.

**Action needed:** Ask Nina: "Is tuition the same for all students at the same Kumon level, or does it vary per student?"

---

## Timeline

These questions should be answered before the Build phase begins. The fork of sneaker-doc-pos and initial scaffolding can proceed in parallel, but the schema must be finalized before any migration scripts or seed data are written.
