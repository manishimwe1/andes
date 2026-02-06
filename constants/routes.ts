// Centralized route constants for type safety
export const ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  
  // Auth routes (hidden in URL with (features))
  SIGN_IN: '/sign-in',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  
  // Onboarding
  JOINING_PROCESS: '/joining-process',
  OCCUPATION: '/occupation',
  ANTI_FRAUD: '/anti-fraud',
  
  // Transactions
  DEPOSIT: '/deposit',
  WITHDRAW: '/withdraw',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
