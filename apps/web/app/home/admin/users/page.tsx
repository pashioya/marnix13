import { PageBody, PageHeader } from '@kit/ui/page';

import { UserManagement } from './_components/user-management';

export default function UsersPage() {
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
