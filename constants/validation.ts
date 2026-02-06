// Validation rules for forms
export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  PASSWORD: {
    minLength: 8,
    message: 'Password must be at least 8 characters',
  },
  PHONE: {
    pattern: /^\d{10,}$/,
    message: 'Please enter a valid phone number',
  },
} as const;
