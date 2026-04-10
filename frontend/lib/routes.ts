export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  PENDING: '/pending',
  ONBOARDING: '/onboarding',
  // Core — Tuition Ops
  DASHBOARD: '/',
  SDC: '/sdc',
  PAYMENTS: '/payments',
  PAYMENT_NEW: '/payments/new',
  PAYMENT_PERIODS: '/payment-periods',
  FAMILIES: '/families',
  STUDENTS: '/students',
  // Admin
  REPORTS: '/reports',
  AUDIT: '/audit',
  USERS: '/users',
  BRANCHES: '/branches',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export const PROTECTED_ROUTES: string[] = [
  ROUTES.SDC,
  ROUTES.PAYMENTS,
  ROUTES.PAYMENT_PERIODS,
  ROUTES.FAMILIES,
  ROUTES.STUDENTS,
  ROUTES.REPORTS,
  ROUTES.AUDIT,
  ROUTES.USERS,
  ROUTES.BRANCHES,
  ROUTES.ONBOARDING,
];

export const AUTH_ROUTES: string[] = [ROUTES.LOGIN];
