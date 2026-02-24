---
paths:
  - "frontend/**/*.tsx"
  - "frontend/**/*.ts"
---

# Frontend Code Style (Next.js + React)

## Component Patterns

### Component Structure

```tsx
import { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps extends ComponentProps<'div'> {
  title: string;
  variant?: 'default' | 'primary' | 'secondary';
  isLoading?: boolean;
}

export function MyComponent({
  title,
  variant = 'default',
  isLoading = false,
  className,
  children,
  ...props
}: MyComponentProps) {
  return (
    <div
      className={cn(
        'base-styles rounded-lg p-4',
        {
          'bg-zinc-100': variant === 'default',
          'bg-blue-500 text-white': variant === 'primary',
          'bg-zinc-950 text-white': variant === 'secondary',
          'opacity-50 pointer-events-none': isLoading,
        },
        className
      )}
      {...props}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}
```

**Key Patterns**:
- **Props interface extends `ComponentProps<'element'>`** - Inherits native HTML attributes
- **Default prop values in destructuring** - `variant = 'default'`
- **Use `cn()` from `@/lib/utils`** for className merging
- **Spread remaining props** - `...props` for flexibility
- **Export as named export** - `export function` not `export default`

---

## Service Layer Pattern

**File**: `frontend/lib/api.ts`

All API calls live in `lib/api.ts` organized by domain namespace.

```typescript
import { Transaction, Service, Promo, Expense } from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  transactions: {
    list: (params?: Record<string, string>) => req<Transaction[]>(...),
    get: (id: string) => req<Transaction>(`/transactions/${id}`),
    create: (body: unknown) => req<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => req<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  services: {
    list: () => req<Service[]>('/services'),
    create: (body: unknown) => req<Service>('/services', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => req<Service>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => req<void>(`/services/${id}`, { method: 'DELETE' }),
  },
};
```

**Key Patterns**:
- **All calls go through `api.{domain}.{action}()`**
- **Shared `req<T>()` helper** - handles base URL, headers, credentials, error throwing
- **Import domain types from `@/lib/types`**
- **Throw on non-ok responses** - let query hooks handle errors

---

## React Query Integration

**File**: `frontend/hooks/use{Domain}Query.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Service } from '@/lib/types';

const SERVICES_KEY = 'services';

export function useServicesQuery() {
  return useQuery({
    queryKey: [SERVICES_KEY],
    queryFn: () => api.services.list(),
  });
}

export function useCreateServiceMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Service>) => api.services.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
      onSuccess?.();
    },
  });
}

export function useUpdateServiceMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      api.services.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
      onSuccess?.();
    },
  });
}

export function useDeleteServiceMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.services.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
      onSuccess?.();
    },
  });
}
```

**Key Patterns**:
- **Query keys as constants** - `const SERVICES_KEY = 'services'`
- **Invalidate on mutations** - keep data fresh
- **Optional `onSuccess` callback** - for modal close, redirect, etc.
- **Use `enabled` for conditional queries** - prevent unnecessary requests
- **Errors bubble up** - do not swallow in queryFn, let React Query handle

---

## Form Handling with React Hook Form + Zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be positive'),
});

type FormData = z.infer<typeof schema>;

interface ServiceFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function ServiceForm({ initialData, onSubmit, isLoading = false }: ServiceFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      price: initialData?.price ?? 0,
    },
  });

  async function handleSubmit(data: FormData) {
    await onSubmit(data);
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
        <input
          {...form.register('name')}
          className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-zinc-950 text-white rounded-md text-sm disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

**Key Patterns**:
- **Zod schema + `z.infer`** for type-safe validation
- **`zodResolver`** integrates Zod with React Hook Form
- **Disable submit while loading**
- **Reset after success**

---

## Type Definitions

**File**: `frontend/lib/types.ts`

All domain types are defined here. Never handwrite inline interfaces that duplicate these.

```typescript
// Always import from @/lib/types
import { Transaction, Service, Promo, Expense, AuditEntry } from '@/lib/types';
```

---

## Utility Functions

**File**: `frontend/lib/utils.ts`

```typescript
import { cn } from '@/lib/utils';          // className merging
import { formatPeso } from '@/lib/utils';  // ₱1,234.00
import { formatDate } from '@/lib/utils';  // Mar 1, 2025
import { formatDatetime } from '@/lib/utils'; // Mar 1, 2025 2:30 PM
import { today } from '@/lib/utils';       // YYYY-MM-DD string
```

---

## Styling with Tailwind

### Design System Tokens

- **Background**: `bg-zinc-950` (near-black), `bg-zinc-50` (off-white page bg)
- **Borders**: `border-zinc-200`
- **Text primary**: `text-zinc-950`
- **Text muted**: `text-zinc-400` / `text-zinc-500`
- **Accent / CTA**: `bg-blue-500` / `text-blue-500` — use sparingly
- **Active nav**: `bg-zinc-950 text-white`
- **Data rows**: `divide-y divide-zinc-100` — no card wrappers for table rows

### Use `cn()` for Conditional Classes

```tsx
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150',
    {
      'bg-zinc-950 text-white hover:bg-zinc-800': variant === 'primary',
      'border border-zinc-200 text-zinc-700 hover:bg-zinc-50': variant === 'ghost',
      'opacity-50 pointer-events-none': disabled,
    },
    className
  )}
>
  {children}
</button>
```

### Motion Rules
- Transitions: `150-200ms ease-out` only
- No infinite animations, no heavy entrance animations
- Use `transition-colors duration-150` for hover/active state changes

---

## Next.js Patterns

### Server Components (default — no directive needed)

```tsx
// app/dashboard/services/page.tsx
export default async function ServicesPage() {
  return <ServicesClient />;
}
```

### Client Components

```tsx
'use client';

import { useServicesQuery } from '@/hooks/useServicesQuery';

export function ServicesClient() {
  const { data: services, isLoading } = useServicesQuery();

  if (isLoading) return <div className="text-sm text-zinc-400">Loading...</div>;

  return (
    <div className="divide-y divide-zinc-100">
      {services?.map((s) => (
        <div key={s.id} className="py-3 text-sm text-zinc-950">{s.name}</div>
      ))}
    </div>
  );
}
```

---

## Anti-Patterns to Avoid

**Don't use `useState` for server data**
```typescript
// BAD
const [services, setServices] = useState([]);
useEffect(() => { fetch('/services').then(...) }, []);

// GOOD
const { data: services } = useServicesQuery();
```

**Don't handwrite API fetch calls in components**
```typescript
// BAD
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`);

// GOOD
const services = await api.services.list();
```

**Don't handwrite domain types**
```typescript
// BAD
interface Service { id: string; name: string; }

// GOOD
import { Service } from '@/lib/types';
```

**Don't use card wrappers on data rows**
```tsx
// BAD - card per row
<div className="rounded-lg border p-4 shadow-sm">...</div>

// GOOD - divide-y separator
<div className="divide-y divide-zinc-100">
  <div className="py-3">...</div>
</div>
```

---

## MOBILE FIRST — CRITICAL STANDARD

**Every component and page MUST be built mobile-first. No exceptions.**

### Breakpoint Strategy

Build from smallest screen up using Tailwind breakpoint prefixes:
- **Base (no prefix)**: Mobile — 0px+
- **`sm:`**: Small tablets — 640px+
- **`md:`**: Tablets / landscape — 768px+
- **`lg:`**: Desktop — 1024px+

### Required Patterns

**Grids — always start single column:**
```tsx
// BAD
<div className="grid grid-cols-4 gap-4">

// GOOD
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
```

**Tables — always wrap for horizontal scroll:**
```tsx
<div className="bg-white border border-zinc-200 rounded-lg overflow-hidden overflow-x-auto">
  <table className="w-full text-sm min-w-[600px]">
```

**Page layout — stack on mobile, row on sm+:**
```tsx
// PageHeader action stacks below title on mobile
<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
```

**Multi-column forms — single column on mobile:**
```tsx
// BAD
<div className="grid grid-cols-3 gap-4">

// GOOD
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

**Spacing — tighter on mobile:**
```tsx
className="px-4 py-6 md:px-8 md:py-8"
className="mb-4 md:mb-8"
className="gap-3 md:gap-6"
```

**Navigation — sidebar hidden on mobile, use drawer/bottom nav:**
- Sidebar is `hidden md:flex` on desktop
- Mobile gets a hamburger trigger + slide-in drawer

---

## Dedicated Files Rule

**ALL hooks and constants MUST live in dedicated files — never inline in components.**

### Query Hooks → `frontend/hooks/use{Domain}Query.ts`

```typescript
// frontend/hooks/useServicesQuery.ts
export const SERVICES_KEY = ['services'] as const;

export function useServicesQuery() { ... }
export function useUpdateServiceMutation(onSuccess?: () => void) { ... }
export function useDeleteServiceMutation() { ... }
```

- One file per domain (services, expenses, promos, transactions)
- Export query key constants alongside hooks from the same file
- Pages import from `@/hooks/use{Domain}Query`

### Constants → co-locate with relevant hook file

Query keys, filter lists, and domain constants belong in the hook file for that domain, NOT in the component.

```typescript
// BAD — inline in page component
const { data } = useQuery({ queryKey: ['services'], queryFn: ... });

// GOOD — dedicated hook file
import { useServicesQuery } from '@/hooks/useServicesQuery';
const { data } = useServicesQuery();
```

### Form Components → `frontend/components/forms/{domain}-form.tsx`

Never define a form component inside the page file that uses it. Always create a dedicated `components/forms/` file.

---

## Best Practices

1. **TypeScript strictly** - avoid `any`
2. **Import types from `@/lib/types`** - never redeclare domain shapes
3. **All API calls via `@/lib/api`** - never raw fetch in components
4. **React Query for server state** - `useState` only for ephemeral UI state
5. **Zod + React Hook Form** for all forms
6. **Named exports only** - no `export default` for components
7. **Small, focused components** - split when a component exceeds ~100 lines
8. **Semantic HTML** - use `<button>`, `<nav>`, `<aside>`, `<main>` properly
9. **Mobile-first** - all layouts responsive with Tailwind
10. **Monospace for numbers/codes** - `font-mono` on transaction IDs and amounts
11. **Dedicated hooks files** - never define `useQuery`/`useMutation` inline in page components
12. **Dedicated form components** - never define form JSX inline in page files
