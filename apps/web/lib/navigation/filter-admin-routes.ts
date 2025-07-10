import type { z } from 'zod';

import type { NavigationConfigSchema } from '@kit/ui/navigation-schema';

/**
 * Filter navigation routes based on admin status.
 * Removes admin-only routes for non-admin users.
 */
export function filterAdminRoutes(
  routes: z.infer<typeof NavigationConfigSchema>['routes'],
  isAdmin: boolean,
): z.infer<typeof NavigationConfigSchema>['routes'] {
  return routes
    .map((route) => {
      if ('children' in route) {
        // Check if this is the Administration section
        if (route.label === 'Administration') {
          // Only show Administration section for admins
          return isAdmin ? route : null;
        }

        // For other sections, filter out any admin-only children
        const filteredChildren = route.children.filter((child) => {
          // Check if this is an admin route by path
          if ('path' in child) {
            return !child.path.includes('/admin/') || isAdmin;
          }
          return true;
        });

        // If all children were filtered out, don't show the section
        if (filteredChildren.length === 0) {
          return null;
        }

        return {
          ...route,
          children: filteredChildren,
        };
      }

      // For direct routes, check if it's an admin route
      if ('path' in route && typeof route.path === 'string') {
        return !route.path.includes('/admin/') || isAdmin ? route : null;
      }

      // Keep dividers and other route types
      return route;
    })
    .filter(Boolean) as z.infer<typeof NavigationConfigSchema>['routes'];
}
