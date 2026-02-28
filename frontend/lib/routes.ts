export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  SERVICES: '/services',
  PROMOS: '/promos',
  EXPENSES: '/expenses',
  AUDIT: '/audit',
  BRANCHES: '/branches',
  USERS: '/users',
  ONBOARDING: '/onboarding',
} as const;

export const PROTECTED_ROUTES: string[] = [
  ROUTES.TRANSACTIONS,
  ROUTES.SERVICES,
  ROUTES.PROMOS,
  ROUTES.EXPENSES,
  ROUTES.DASHBOARD,
  ROUTES.AUDIT,
  ROUTES.BRANCHES,
  ROUTES.USERS,
  ROUTES.ONBOARDING,
];

export const AUTH_ROUTES: string[] = [ROUTES.LOGIN];
