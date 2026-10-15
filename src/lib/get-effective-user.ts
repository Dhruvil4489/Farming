import { getAuthenticatedUser } from './auth';

/**
 * Returns the currently authenticated user's ID.
 * In a secure production environment, unauthenticated visitors must NOT
 * impersonate other users or demo accounts.
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const authUser = await getAuthenticatedUser();
  if (authUser) {
    return authUser.id;
  }

  return null;
}
