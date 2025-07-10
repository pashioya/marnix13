import { PageBody, PageHeader } from '@kit/ui/page';

import { requireAdminAccess } from '~/lib/auth/require-admin-access';

import { UserManagement } from './_components/user-management';

export default async function UsersPage() {
  // Ensure only admin users can access this page
  await requireAdminAccess();

  return (
    <>
      <PageHeader
        title="User Management"
        description="Review and approve new user registrations"
      />

      <PageBody>
        <UserManagement />
      </PageBody>
    </>
  );
}
