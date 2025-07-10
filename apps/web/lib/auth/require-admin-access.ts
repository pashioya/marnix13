import { redirect } from 'next/navigation';

import { getCurrentUserAdminStatus } from '~/lib/auth/get-current-user-account';

/**
 * Ensures that only admin users can access the protected route.
 * Redirects non-admin users to the home page.
 */
export async function requireAdminAccess() {
  const isAdmin = await getCurrentUserAdminStatus();

  if (!isAdmin) {
    // Redirect non-admin users to home page
    redirect('/home');
  }
}
