export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/',
  TRANSACTIONS: '/transactions',
  UPCOMING_PICKUPS: '/upcoming-pickups',
  SERVICES: '/services',
  PROMOS: '/promos',
  EXPENSES: '/expenses',
  AUDIT: '/audit',
  BRANCHES: '/branches',
  STAFF: '/staff',
  CUSTOMERS: '/customers',
  REPORTS: '/reports',
  CARD_BANKS: '/card-banks',
  ONBOARDING: '/onboarding',
} as const;

// '/' (dashboard) is protected by NextAuth middleware — not here, since startsWith('/') matches everything
export const PROTECTED_ROUTES: string[] = [
  ROUTES.TRANSACTIONS,
  ROUTES.UPCOMING_PICKUPS,
  ROUTES.SERVICES,
  ROUTES.PROMOS,
  ROUTES.EXPENSES,
  ROUTES.AUDIT,
  ROUTES.BRANCHES,
  ROUTES.STAFF,
  ROUTES.CUSTOMERS,
  ROUTES.REPORTS,
  ROUTES.CARD_BANKS,
  ROUTES.ONBOARDING,
];

export const AUTH_ROUTES: string[] = [ROUTES.LOGIN];
