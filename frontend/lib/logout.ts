import { signOut } from 'next-auth/react';
import { logger } from '@/lib/logger';

/**
 * Custom logout function that:
 * 1. Calls the backend to blacklist the JWT token
 * 2. Signs out the user from NextAuth session
 * 3. Preserves the frontend cart (localStorage persists)
 */
export async function logout() {
  try {
    // Call backend logout to blacklist the token
    const response = await fetch('/api/backend/customers/profile/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error('Backend logout failed:', await response.text());
      // Continue with NextAuth logout even if backend fails
    }
  } catch (error) {
    logger.error('Error during backend logout:', error);
    // Continue with NextAuth logout even if backend fails
  } finally {
    // Sign out from NextAuth (clear session)
    await signOut({ callbackUrl: '/' });
  }
}
