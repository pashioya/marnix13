import type { User } from '@supabase/supabase-js';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
} from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import { getCurrentUserAdminStatus } from '~/lib/auth/get-current-user-account';
import { Tables } from '~/lib/database.types';
import { filterAdminRoutes } from '~/lib/navigation/filter-admin-routes';

export async function HomeSidebar(props: {
  account?: Tables<'accounts'>;
  user: User;
}) {
  // Check if the current user is an admin
  const isAdmin = await getCurrentUserAdminStatus();

  // Filter navigation routes based on admin status
  const filteredRoutes = filterAdminRoutes(navigationConfig.routes, isAdmin);
  const filteredConfig = {
    ...navigationConfig,
    routes: filteredRoutes,
  };

  return (
    <Sidebar collapsible={'icon'}>
      <SidebarHeader className={'h-16 justify-center'}>
        <div className={'flex items-center justify-between space-x-2'}>
          <div>
            <AppLogo className={'max-w-full'} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavigation config={filteredConfig} />
      </SidebarContent>

      <SidebarFooter>
        <ProfileAccountDropdownContainer
          user={props.user}
          account={props.account}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
