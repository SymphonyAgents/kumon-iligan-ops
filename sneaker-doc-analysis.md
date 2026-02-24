# SneakerPOS - Architecture Documentation

> Analysis for POC rebuild reference. Generated from codebase inspection.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database Schema](#database-schema)
6. [Services and Integrations](#services-and-integrations)
7. [Real-time Strategy](#real-time-strategy)
8. [Multi-device Sync](#multi-device-sync)
9. [Environment Configuration](#environment-configuration)
10. [Dev Tooling and Deployment](#dev-tooling-and-deployment)
11. [Tech Stack Summary](#tech-stack-summary)
12. [Database Migration Analysis](#database-migration-analysis-mysql--postgresqlsupabase--drizzle)
13. [POC Rebuild Notes](#poc-rebuild-notes)

---

## Project Overview

SneakerPOS is a point-of-sale and admin management system for a sneaker cleaning/repair shop. It supports:

- Transaction intake at the POS (walk-in customers, shoe services)
- Real-time admin monitoring and reporting
- Multi-device POS support with server-side sync
- Expense and promotional code management
- Audit logging for all actions

**Business Domain:** Philippine sneaker cleaning/repair shop (currency: Philippine Peso ₱)

---

## Project Structure

```
sneakerpos/
├── server.js                  # Main Express server (~1,293 lines, single file)
├── package.json               # Dependencies
├── package-lock.json
├── .env                       # Environment config (gitignored)
├── .env.example               # Template with placeholders
├── ecosystem.config.js        # PM2 config (development)
├── ecosystem.config.cjs       # PM2 config (production)
├── public/                    # Admin dashboard
│   ├── admin.html
│   ├── admin.js               # Admin JavaScript (~3,447 lines)
│   ├── admin.css
│   └── api/                   # Legacy PHP files (unused)
│       ├── db.php
│       ├── transactions.php
│       └── next_txn.php
├── public_pos/                # POS application
│   ├── index.html
│   ├── script.js              # POS JavaScript (~4,709 lines)
│   ├── style.css
│   ├── Images/
│   │   └── Logo.png
│   └── vendor/
│       └── jsQR.js            # QR code reading library
└── public_root/               # Landing page
    ├── index.html
    ├── script.js
    ├── style.css
    └── assets/
        ├── fonts/
        ├── Images/
        └── Videos/
```

**Architecture type:** Monolith — single Express server, no monorepo.

---

## Backend Architecture

### Framework and Runtime

| Property | Value |
|----------|-------|
| Language | JavaScript (CommonJS) |
| Runtime | Node.js |
| Framework | Express.js v4.22.1 |
| Entry Point | `server.js` |
| API Style | RESTful JSON |

### Authentication

- **Admin routes:** HTTP Basic Auth via `express-basic-auth`
- **Credentials source:** Environment variables (`ADMIN_USER`, `ADMIN_PASS`)
- **Public routes:** No auth (services list, promos list, health check)
- **No JWT, no sessions, no refresh tokens**

### API Routes

**Public (no auth):**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/services` | Fetch service catalog |
| GET | `/api/promos` | Fetch active promos |
| GET | `/api/next_txn?peek=1` | Peek next transaction number |
| POST | `/api/next_txn` | Reserve next transaction number |
| POST | `/api/transactions` | Upsert transaction (POS sync) |
| GET | `/api/transactions` | Fetch all transactions |
| DELETE | `/api/transactions/:id` | Delete transaction |
| POST | `/api/history/log` | Log a client-side action |
| GET/POST/PUT/DELETE | `/api/expenses` | Expense CRUD |
| GET | `/api/expenses/summary` | Daily expense totals |

**Admin (basic auth required):**

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/transactions` | List/search/filter transactions |
| GET | `/api/admin/history` | Audit log with filters |
| GET/POST/PUT/DELETE | `/api/admin/services` | Service CRUD |
| GET/POST/PUT/DELETE | `/api/admin/promos` | Promo CRUD |
| GET | `/api/admin/stream` | SSE real-time event stream |
| GET | `/api/admin/reports/payment-moves` | Payment reporting |

### Database Layer

- **Database:** MySQL
- **Driver:** `mysql2/promise` v3.11.5
- **ORM:** None — raw parameterized SQL queries only
- **Connection:** Connection pool (10 connections, keep-alive enabled)
- **Conflict resolution:** `ON DUPLICATE KEY UPDATE` with `updated_ts` timestamp comparison

### Key Backend Logic

- **Transaction number reservation:** Atomic DB locking to prevent race conditions across POS devices
- **SSE broadcast:** On any transaction change, broadcast to all connected admin clients
- **Audit logging:** Every mutation is written to `history_log` with source, action, and JSON details
- **Payload limit:** 50MB JSON/URL-encoded body limit configured

---

## Frontend Architecture

### Applications

There are three separate frontend applications, all vanilla — no framework.

#### 1. POS Application (`/POS/`)

- **Language:** Vanilla JavaScript (~4,709 lines in `script.js`)
- **Styling:** Custom vanilla CSS (`style.css`)
- **QR scanning:** `jsQR.js` vendor library (client-side, no external API call)
- **State:** In-memory JS objects; MySQL via server is source of truth

**Key UI Sections:**
- Dashboard — real-time sales metrics and transaction summary
- Master List — view all transactions
- Upcoming — pickup date queue
- Expenses — daily expense tracking
- Transaction Form — customer intake, item entry, service selection, payment tracking
- Mobile-responsive sidebar navigation

#### 2. Admin Dashboard (`/admin`, basic auth protected)

- **Language:** Vanilla JavaScript (~3,447 lines in `admin.js`)
- **Styling:** Custom vanilla CSS (`admin.css`)
- **Real-time:** SSE connection to `/api/admin/stream`

**Key UI Sections:**
- Sales View — transaction search, date filtering, pagination, PDF export
- Reports View — monthly financial summary, payment method breakdown
- Services View — service CRUD with modal
- Promos View — promotional code management
- History View — audit log with advanced filters
- Dashboard View — placeholder (not implemented)

#### 3. Landing Page (`/`)

- Static page with hero video (auto-loop with recovery)
- CTA linking to Facebook page
- No dynamic data fetching

### Data Fetching

- Native `fetch()` API — no axios or any HTTP client library
- All requests use `cache: 'no-store'` headers to prevent Cloudflare caching
- No polling — admin uses SSE for real-time push
- No SWR, React Query, or similar — direct fetch on demand

### Styling

- Plain CSS, no preprocessor (no Sass/Less/Tailwind)
- Flexbox-based responsive layout
- Mobile-first breakpoints
- Separate CSS file per application

### Routing

| URL | Application | Auth |
|-----|------------|------|
| `/` | Landing page | None |
| `/POS` | POS app | None |
| `/admin` | Admin dashboard | Basic Auth |

---

## Database Schema

### `transactions`

| Column | Type | Notes |
|--------|------|-------|
| `number` | VARCHAR | Primary key, 4-digit zero-padded (e.g., `0001`) |
| `data` | LONGTEXT | Full transaction object stored as JSON string |
| `updated_ts` | TIMESTAMP | Used for conflict resolution on sync |
| `created_ts` | TIMESTAMP | Creation time |
| `last_activity_ts` | TIMESTAMP | Last modification |
| `date_key` | DATE | Date index for filtering |

### `txn_counter`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT | Primary key |
| `last_txn` | INT | Current counter value |

### `history_log`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `ts` | TIMESTAMP | Event timestamp |
| `action` | VARCHAR | Action type (e.g., `create`, `status_change`) |
| `ref_type` | VARCHAR | Reference type (e.g., `transaction`, `expense`) |
| `ref_id` | VARCHAR | Reference ID |
| `source` | VARCHAR | Origin: `pos` or `admin` |
| `details` | LONGTEXT | JSON payload with action specifics |

### `services`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `name` | VARCHAR UNIQUE | Service name |
| `type` | VARCHAR | `Primary` or `Add On` |
| `price` | DECIMAL | Service price |
| `created_ts` | TIMESTAMP | |
| `updated_ts` | TIMESTAMP | |

### `promos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `name` | VARCHAR | Display name |
| `code` | VARCHAR UNIQUE | Promo code |
| `percent` | DECIMAL | Discount percentage |
| `date_from` | DATE | Validity start |
| `date_to` | DATE | Validity end |
| `is_active` | TINYINT | Active flag |
| `created_ts` | TIMESTAMP | |
| `updated_ts` | TIMESTAMP | |

### `expenses`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT AUTO_INCREMENT | Primary key |
| `date_key` | DATE | Date of expense |
| `category` | VARCHAR | Expense category |
| `note` | VARCHAR | Description |
| `amount` | DECIMAL | Amount in PHP |
| `created_ts` | TIMESTAMP | |

### Transaction Data Model (JSON stored in `transactions.data`)

```json
{
  "number": "0001",
  "customerName": "string",
  "status": "string",
  "items": [
    {
      "shoe": "string",
      "service": "string",
      "itemStatus": "string"
    }
  ],
  "total": 0,
  "paid": 0,
  "balance": 0,
  "pickupDate": "string",
  "claimPayments": [
    {
      "method": "cash | gcash | card | bank_deposit",
      "amount": 0
    }
  ]
}
```

---

## Services and Integrations

### Installed npm Packages

| Package | Version | Purpose | Used? |
|---------|---------|---------|-------|
| `express` | 4.22.1 | HTTP server | Yes |
| `mysql2` | 3.11.5 | MySQL driver | Yes |
| `express-basic-auth` | 1.2.1 | Admin authentication | Yes |
| `dotenv` | 16.5.0 | Environment variables | Yes |
| `@sendgrid/mail` | 8.1.6 | Email sending | Installed, not used |
| `nodemailer` | 7.0.12 | Email sending | Installed, not used |

### External Services

| Service | Type | Status |
|---------|------|--------|
| MySQL database | Database | Active |
| SendGrid | Email | Installed, not integrated |
| Facebook | Social link from landing page | Passive |
| Cloudflare | CDN/Proxy (inferred from no-cache headers) | Likely in production |

### Payment Methods Tracked (no processor integration)

- Cash
- GCash (Philippine e-wallet)
- Card (Debit/Credit)
- Bank Deposit

No Stripe, PayPal, or any payment gateway API is integrated. Payments are tracked manually.

### QR Code

- `jsQR.js` bundled as vendor file
- Used client-side only for scanning purposes
- No external QR API calls

---

## Real-time Strategy

The admin dashboard receives live updates using **Server-Sent Events (SSE)**:

1. Admin connects to `GET /api/admin/stream`
2. Server keeps connection open, adds client to an in-memory `adminClients` array
3. On any transaction mutation (POST/DELETE), server broadcasts an SSE event to all connected admins
4. Admin JS listens for events and refreshes relevant UI sections
5. No WebSockets — one-directional server-to-client push only

---

## Multi-device Sync

Multiple POS devices sync to the same MySQL database:

1. Each POS device holds transactions in memory
2. On change, device POSTs to `POST /api/transactions`
3. Server runs `INSERT ... ON DUPLICATE KEY UPDATE` with timestamp comparison
4. Only updates if the incoming `updated_ts` is newer than the stored one
5. Prevents older data from overwriting newer data across devices

Transaction number reservation uses DB locking to prevent two devices from getting the same transaction number.

---

## Environment Configuration

### Required Variables

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sneakerpos
DB_USER=sneakerpos
DB_PASSWORD=your_password
ADMIN_USER=your_admin_user
ADMIN_PASS=your_admin_password
```

### PM2 Process Manager

Two PM2 config files:
- `ecosystem.config.js` — development (local)
- `ecosystem.config.cjs` — production (`/var/www/sneakerpos`)

App name in PM2: `sneakerdoctor`

---

## Dev Tooling and Deployment

| Tool | Value |
|------|-------|
| Package manager | npm |
| Process manager | PM2 |
| Bundler | None (no build step) |
| Linter | None |
| Formatter | None |
| Test framework | None |
| Transpiler | None (plain CJS JavaScript) |

**Deployment target:** Linux server, Node.js on port 5000, MySQL local instance.

Start command: `node server.js`

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend framework | Express.js 4.22.1 |
| Language | JavaScript (CommonJS, no TypeScript) |
| Database | MySQL |
| DB driver | mysql2/promise 3.11.5 |
| ORM | None (raw SQL) |
| Authentication | HTTP Basic Auth |
| Real-time | Server-Sent Events (SSE) |
| Frontend | Vanilla JS (no framework) |
| Styling | Vanilla CSS |
| QR scanning | jsQR.js (client-side) |
| Email | SendGrid + Nodemailer (unused) |
| Process manager | PM2 |
| Build tooling | None |

---

## Database Migration Analysis (MySQL → PostgreSQL/Supabase + Drizzle)

### Migration Complexity: Low-Medium

The schema is only 5 tables, so the raw migration is not complex. The main decision point is whether to normalize the transaction data or keep the JSON approach with an upgrade.

### Type Mapping

| MySQL (current) | PostgreSQL (target) | Notes |
|-----------------|---------------------|-------|
| `VARCHAR` | `TEXT` or `VARCHAR` | Trivial |
| `LONGTEXT` (JSON string) | `JSONB` | Big upgrade — enables indexing and querying |
| `TINYINT` (is_active) | `BOOLEAN` | Trivial |
| `DECIMAL` | `NUMERIC` | Trivial |
| `INT AUTO_INCREMENT` | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` | Trivial |
| `TIMESTAMP` | `TIMESTAMPTZ` | Use timezone-aware in Postgres |
| `DATE` | `DATE` | Trivial |

### Is the Current DB Production Standard? No.

**1. Transactions are fully denormalized JSON blobs**
The entire transaction — items, payments, customer info — is stored as a single JSON string in `data LONGTEXT`. This means:
- You can't query `WHERE item.status = 'done'` efficiently
- No referential integrity — items have no table
- Reporting requires pulling and parsing every row in application code

**2. No foreign keys anywhere**
Nothing enforces relationships. `expenses`, `history_log`, etc. are all disconnected. Data integrity is entirely app-level.

**3. `txn_counter` is a manual sequence**
A separate table to track transaction numbers is fragile. Concurrent inserts can cause issues even with locking (the current locking is app-level, not DB-level).

**4. No indexes beyond PKs and UNIQUE constraints**
`date_key` on `transactions` and `history_log` has no index, so date range queries do full table scans as data grows.

**5. No timezone handling**
MySQL `TIMESTAMP` with no explicit timezone — risky for any future multi-timezone use.

---

### Migration Option A — Keep JSON, Upgrade to JSONB (Easier)

Same shape, but PostgreSQL `JSONB` lets you index and query inside the blob.

```ts
// Drizzle schema
export const transactions = pgTable('transactions', {
  number: varchar('number', { length: 10 }).primaryKey(),
  data: jsonb('data').$type<TransactionData>().notNull(),
  updatedTs: timestamp('updated_ts', { withTimezone: true }).notNull(),
  createdTs: timestamp('created_ts', { withTimezone: true }).defaultNow(),
  lastActivityTs: timestamp('last_activity_ts', { withTimezone: true }),
  dateKey: date('date_key'),
});
```

**Complexity:** Low. Dump MySQL, transform JSON strings to parsed JSONB on insert, done.

---

### Migration Option B — Normalize Properly (Recommended)

Better for reporting, filtering, and long-term maintainability.

```ts
// Drizzle schema
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  number: varchar('number', { length: 10 }).unique().notNull(),
  customerName: varchar('customer_name', { length: 255 }),
  status: varchar('status', { length: 50 }),
  pickupDate: date('pickup_date'),
  total: numeric('total', { precision: 10, scale: 2 }),
  paid: numeric('paid', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export const transactionItems = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  shoe: varchar('shoe', { length: 255 }),
  serviceId: integer('service_id').references(() => services.id),
  status: varchar('status', { length: 50 }),
});

export const claimPayments = pgTable('claim_payments', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  method: varchar('method', { length: 50 }), // cash | gcash | card | bank_deposit
  amount: numeric('amount', { precision: 10, scale: 2 }),
});
```

**Complexity:** Medium. Write a one-time migration script that reads every row from MySQL, parses the `data` JSON blob, and inserts into the normalized tables. Given the data volume of a single-shop POS (likely hundreds to low thousands of rows), a one-off Node script handles this in seconds.

---

### Replace `txn_counter` with a Postgres Sequence

```sql
CREATE SEQUENCE txn_number_seq START 1;
```

Or use `GENERATED ALWAYS AS IDENTITY` on the number column and format it in app code (e.g., pad to 4 digits).

---

### Migration Summary

| Question | Answer |
|----------|--------|
| Overall complexity | Low-medium — 5 simple tables, small data volume |
| Hardest part | Parsing `transactions.data` JSON blob if normalizing |
| Is the current DB production standard? | No — denormalized blobs, no FK constraints, no indexes, manual counter |
| Recommended approach | Option B (normalize) — worth the extra time; pays off at reporting time |
| JSONB in Supabase/Postgres | Massive upgrade even if staying with Option A |
| Drizzle ORM compatibility | All of this maps cleanly to Drizzle's `pgTable` API |

---

## POC Rebuild Notes

Key decisions to make when rebuilding this in a modern stack:

- **Backend framework:** Consider NestJS or Hono for structure; replace raw SQL with an ORM (Drizzle/Prisma)
- **Frontend:** React/Next.js would replace the large vanilla JS files; break into components
- **Auth:** Replace Basic Auth with JWT or session-based auth; consider role-based access
- **Real-time:** SSE can be kept or upgraded to WebSockets depending on bidirectional needs
- **Database:** MySQL schema is simple and can be migrated directly; consider adding indexes on `date_key` and `updated_ts`
- **State management:** The in-memory POS state maps well to React state or Zustand
- **TypeScript:** The transaction data model (stored as JSON) should be typed with Zod or similar
- **QR scanning:** jsQR can be replaced with a React-compatible library or kept as-is wrapped in a component
- **Payment tracking:** Architecture is already agnostic; easy to add real payment processor integration later
