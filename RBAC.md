# RBAC — SneakerPOS

Role-Based Access Control for the SneakerPOS monorepo (NestJS backend + Next.js frontend).

---

## 1. Permission Model

Simple role hierarchy. No fine-grained resource/action permissions — roles map directly to
access tiers. All enforcement runs server-side before the request reaches the service layer.

```
superadmin  ──►  all routes + branch/user management
admin       ──►  all routes except branch management
staff       ──►  transactions (read/write), expenses (create only)
```

`superadmin` bypasses all role checks in `RolesGuard` — it is an implicit wildcard.

---

## 2. Roles

Defined in `backend/src/db/constants.ts`:

```typescript
export const USER_TYPE = {
  ADMIN: 'admin',
  STAFF: 'staff',
  SUPERADMIN: 'superadmin',
} as const;

export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];
```

Stored in `users.user_type` (varchar 20, default `'staff'`).

---

## 3. Database Schema

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY,           -- mirrors auth.users.id
  email       VARCHAR(255) NOT NULL,
  user_type   VARCHAR(20) DEFAULT 'staff' NOT NULL,  -- admin | staff | superadmin
  branch_id   INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);
```

No separate roles or permissions tables. Role lives directly on the user row.

---

## 4. Backend Enforcement

### Layer 1 — Authentication: `SupabaseAuthGuard`

File: `backend/src/auth/auth.guard.ts`

- Extracts `Bearer <token>` from `Authorization` header
- Calls `supabase.auth.getUser(token)` — validates against Supabase Auth
- Attaches verified user object to `request.user`
- Throws `401 UnauthorizedException` if token is missing or invalid

### Layer 2 — Authorization: `RolesGuard`

File: `backend/src/auth/roles.guard.ts`

- Reads `@Roles(...)` metadata set by the decorator
- Looks up `users` table by `request.user.id` to get `user_type`
- `superadmin` bypasses all role checks unconditionally
- Throws `403 ForbiddenException` if role is not in the allowed list
- No-ops (returns `true`) if no `@Roles(...)` metadata is set on the handler

### `@Roles` Decorator

File: `backend/src/auth/roles.decorator.ts`

```typescript
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
```

### DI Requirement

`RolesGuard` depends on `UsersService`. Any module that uses `RolesGuard` must import `UsersModule`:

```typescript
@Module({
  imports: [DbModule, AuthModule, UsersModule],  // UsersModule required for RolesGuard
  ...
})
```

---

## 5. Route Protection Matrix

### Public (no auth required)

| Method | Route | Reason |
|--------|-------|--------|
| GET | `/services` | POS catalog reads |
| GET | `/services/:id` | POS catalog reads |
| GET | `/promos` | POS promo lookup |
| GET | `/promos/code/:code` | POS promo lookup |
| GET | `/promos/:id` | POS promo lookup |
| GET | `/branches` | Branch list for onboarding/POS |
| GET | `/branches/:id` | Branch lookup |

### Auth required — any authenticated user

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/transactions/*` | All transaction reads |
| POST | `/transactions` | Staff creates transactions |
| PATCH | `/transactions/:id` | Status/detail updates |
| PATCH | `/transactions/:id/items/:itemId` | Item status updates |
| POST | `/transactions/:id/payments` | Payment recording |
| DELETE | `/transactions/:id` | Soft delete |
| GET | `/expenses` | Date-filtered expense reads |
| GET | `/expenses/summary` | Daily summary |
| POST | `/expenses` | Staff logs expense from POS |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me/onboard` | Staff branch selection |
| GET | `/customers/by-phone/:phone` | Customer lookup |

### Admin + Superadmin only (`@Roles('admin', 'superadmin')`)

| Method | Route |
|--------|-------|
| POST | `/services` |
| PATCH | `/services/:id` |
| DELETE | `/services/:id` |
| POST | `/promos` |
| PATCH | `/promos/:id` |
| DELETE | `/promos/:id` |
| GET | `/expenses/monthly` |
| PATCH | `/expenses/:id` |
| DELETE | `/expenses/:id` |

### Superadmin only (`@Roles('superadmin')`)

| Method | Route |
|--------|-------|
| POST | `/branches` |
| PATCH | `/branches/:id` |

---

## 6. Frontend Enforcement

Frontend guards are **not a security boundary** — they are UX conveniences.
All real enforcement happens on the backend. Frontend guards exist to prevent
accidental navigation and provide appropriate redirects.

### Layer 1 — Session gate: Next.js Middleware

File: `frontend/proxy.ts` (re-exported from `middleware.ts`)

Runs on the Edge before the page is served. Checks for a Supabase session cookie.
No role check — session presence only.

Protected prefixes (redirect to `/login` if no session):
```
/transactions, /services, /promos, /expenses,
/dashboard, /audit, /branches, /onboarding
```

### Layer 2 — Role gate: Layout-level Client Components

Wrap protected route subtrees in `app/(app)/*/layout.tsx`.
Each component makes one API call (`GET /users/me`) to verify user type,
then redirects if the role is insufficient.

| Component | File | Allowed roles | Redirect target |
|-----------|------|---------------|-----------------|
| `RequireAdmin` | `components/auth/RequireAdmin.tsx` | `admin`, `superadmin` | `/transactions` |
| `RequireSuperadmin` | `components/auth/RequireSuperadmin.tsx` | `superadmin` | `/transactions` |
| `OnboardingCheck` | `components/auth/OnboardingCheck.tsx` | staff with null `branchId` | `/onboarding` |

### Layer 3 — Sidebar nav filtering

File: `components/layout/sidebar.tsx`

Nav items tagged `superadminOnly` only render for `userType === 'superadmin'`.
This is cosmetic — backend enforces the actual restriction.

### Route → Guard mapping

| Route | Middleware | Layout guard |
|-------|------------|--------------|
| `/transactions/*` | Session | `OnboardingCheck` only |
| `/services/*` | Session | `RequireAdmin` |
| `/promos/*` | Session | `RequireAdmin` |
| `/expenses/*` | Session | `RequireAdmin` |
| `/audit/*` | Session | `RequireAdmin` |
| `/dashboard/*` | Session | `OnboardingCheck` only |
| `/branches/*` | Session | `RequireSuperadmin` |
| `/onboarding` | Session | Self-guards (redirects non-staff away) |

---

## 7. Request Flow

```
Client Request
     │
     ▼
[Next.js Edge Middleware] ── no session ──► redirect /login
     │ session present
     ▼
[Next.js Page Served]
     │
     ▼
[Layout Component] ── wrong role ──► redirect /transactions
     │ role OK
     ▼
[Page renders, calls API]
     │
     ▼
[NestJS: SupabaseAuthGuard] ── no/invalid token ──► 401
     │ token valid, user attached
     ▼
[NestJS: RolesGuard] ── insufficient role ──► 403
     │ role OK (or no @Roles decorator)
     ▼
[Service layer executes]
```

---

## 8. Extending RBAC

### Add a new admin-only endpoint

```typescript
// 1. Ensure the module imports UsersModule
@Module({ imports: [DbModule, AuthModule, UsersModule], ... })

// 2. Decorate the handler
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Post()
create(...) { ... }
```

### Add a new protected frontend route

```typescript
// app/(app)/new-route/layout.tsx
import { RequireAdmin } from '@/components/auth/RequireAdmin';
export default function Layout({ children }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
```

Add the route prefix to `protectedPrefixes` in `frontend/proxy.ts`.

### Promote a user to admin

```sql
UPDATE users SET user_type = 'admin' WHERE email = 'user@example.com';
```

---

## 9. File Reference

```
backend/src/
  auth/
    auth.guard.ts          SupabaseAuthGuard — JWT validation
    auth.module.ts         Exports SupabaseAuthGuard
    roles.guard.ts         RolesGuard — DB role lookup + enforcement
    roles.decorator.ts     @Roles(...roles) decorator
  db/
    constants.ts           USER_TYPE enum, UserType type
    schema.ts              users table definition
  services/
    services.module.ts     imports UsersModule for RolesGuard
    services.controller.ts @Roles('admin','superadmin') on mutations
  promos/
    promos.module.ts       imports UsersModule for RolesGuard
    promos.controller.ts   @Roles('admin','superadmin') on mutations
  expenses/
    expenses.module.ts     imports UsersModule for RolesGuard
    expenses.controller.ts @Roles('admin','superadmin') on PATCH/DELETE/monthly
  branches/
    branches.module.ts     imports UsersModule for RolesGuard
    branches.controller.ts @Roles('superadmin') on POST/PATCH

frontend/
  proxy.ts                 Edge middleware — session gate
  middleware.ts            Re-exports proxy
  components/auth/
    RequireAdmin.tsx        Layout guard — admin + superadmin
    RequireSuperadmin.tsx   Layout guard — superadmin only
    OnboardingCheck.tsx     Redirect staff with no branch to /onboarding
  app/(app)/
    services/layout.tsx    wraps with RequireAdmin
    promos/layout.tsx      wraps with RequireAdmin
    expenses/layout.tsx    wraps with RequireAdmin
    audit/layout.tsx       wraps with RequireAdmin
    branches/layout.tsx    wraps with RequireSuperadmin
```
