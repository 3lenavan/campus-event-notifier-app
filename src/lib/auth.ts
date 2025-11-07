import type { AuthError } from '@supabase/supabase-js';

export type AuthActionContext = 'signin' | 'signup' | 'update-email' | 'update-password';

const DEFAULT_MESSAGES: Record<AuthActionContext, string> = {
  signin: 'Authentication failed.',
  signup: 'Account creation failed.',
  'update-email': 'Failed to update email.',
  'update-password': 'Failed to update password.',
};

export const mapSupabaseAuthError = (
  error: AuthError | null | undefined,
  context: AuthActionContext
): string => {
  if (!error) {
    return DEFAULT_MESSAGES[context];
  }

  const message = error.message?.toLowerCase() ?? '';

  if (message.includes('already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (message.includes('password should be at least')) {
    return 'Password should be at least 6 characters long.';
  }

  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }

  if (message.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }

  if (message.includes('invalid password')) {
    return 'Incorrect password. Please try again.';
  }

  if (message.includes('same as the old password')) {
    return 'New password must be different from your current password.';
  }

  if (message.includes('session not found')) {
    return 'Session expired. Please sign in again.';
  }

  if (message.includes('token has expired')) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 429) {
    return 'Too many attempts. Please try again later.';
  }

  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || DEFAULT_MESSAGES[context];
};

