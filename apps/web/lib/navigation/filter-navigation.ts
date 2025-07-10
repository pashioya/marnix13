import { getCurrentUserAdminStatus } from '~/lib/auth/get-current-user-account';

/**
 * Filter navigation configuration based on user access level
 * Removes admin-only routes if user is not an admin
 */
export async function filterNavigationByAccess<T extends { path?: string }>(
  navigationItems: T[],
): Promise<T[]> {
  const isAdmin = await getCurrentUserAdminStatus();

  if (isAdmin) {
    // Admin users can see all navigation items
    return navigationItems;
  }

  // Non-admin users: filter out admin routes
  return navigationItems.filter((item) => {
    if (!item.path) return true;
    return !item.path.startsWith('/home/admin');
  });
}
