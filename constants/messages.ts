// API error messages
export const API_MESSAGES = {
  SUCCESS: 'Operation successful',
  ERROR: 'An error occurred',
  LOADING: 'Loading...',
  INVALID_EMAIL: 'Please enter a valid email',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
} as const;

// UI messages
export const UI_MESSAGES = {
  CONFIRM: 'Are you sure?',
  CANCEL: 'Cancel',
  DELETE: 'Delete',
  SAVE: 'Save',
  SIGN_OUT: 'Sign Out',
} as const;
