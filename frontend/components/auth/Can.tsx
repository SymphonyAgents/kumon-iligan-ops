'use client';

import type { ReactNode } from 'react';
import { useCurrentUserQuery } from '@/hooks/useCurrentUserQuery';
import { USER_TYPE, type UserType } from '@/lib/constants';

/**
 * Role values used by `<Can>`. Aliased from the canonical USER_TYPE constant so
 * callers can import a single name (`ROLE`) when they want a role-shaped name
 * at the call site, e.g. `<Can role={ROLE.ADMIN}>`. Both `ROLE.ADMIN` and
 * `USER_TYPE.ADMIN` resolve to the same string.
 */
export const ROLE = USER_TYPE;
export type Role = UserType;

/**
 * Component-level role gate. Matches ml-asys's `<Can>` pattern but role-based,
 * so we don't need a full permission matrix.
 *
 * Hierarchy: superadmin > admin > teacher.
 *   - role={ROLE.ADMIN}      → admin OR superadmin
 *   - role={ROLE.SUPERADMIN} → superadmin only
 *   - role={ROLE.TEACHER}    → teacher only (admins/superadmins are NOT teachers)
 *   - roles={[...]}          → any of the listed roles satisfies (OR)
 *
 * While the user lookup is in flight, the wrapped content is hidden — this
 * avoids a flash of admin-only UI before the role resolves.
 *
 * Pair with `useRole()` for inline conditional logic.
 */
interface CanProps {
  role?: Role;
  roles?: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ role, roles, children, fallback = null }: CanProps) {
  const { allow } = useRole();
  const ok = role ? allow(role) : roles ? roles.some((r) => allow(r)) : false;
  return <>{ok ? children : fallback}</>;
}

interface UseRoleResult {
  /** Resolved role; null while loading or unauthenticated. */
  role: Role | null;
  isTeacher: boolean;
  /** True for admin OR superadmin. */
  isAdmin: boolean;
  isSuperadmin: boolean;
  /** True until the role lookup finishes. */
  isLoading: boolean;
  /** Predicate matching the same hierarchy as `<Can>`. */
  allow: (target: Role) => boolean;
}

export function useRole(): UseRoleResult {
  const { data: user, isLoading } = useCurrentUserQuery();
  const userType = user?.userType ?? null;
  const isSuperadmin = userType === ROLE.SUPERADMIN;
  const isAdminOrUp = userType === ROLE.ADMIN || isSuperadmin;
  const isTeacher = userType === ROLE.TEACHER;

  function allow(target: Role): boolean {
    if (!userType) return false;
    if (target === ROLE.SUPERADMIN) return isSuperadmin;
    if (target === ROLE.ADMIN) return isAdminOrUp;
    if (target === ROLE.TEACHER) return isTeacher;
    return false;
  }

  return {
    role: (userType as Role | null) ?? null,
    isTeacher,
    isAdmin: isAdminOrUp,
    isSuperadmin,
    isLoading,
    allow,
  };
}
