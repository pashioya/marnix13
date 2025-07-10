import { PageBody, PageHeader } from '@kit/ui/page';

import { requireAdminAccess } from '~/lib/auth/require-admin-access';

import { ServiceSettings } from './_components/service-settings';

export default async function ServicesPage() {
  // Ensure only admin users can access this page
  await requireAdminAccess();

  return (
    <>
      <PageHeader
        title="Service Settings"
        description="Configure your self-hosted services and monitor their status"
      />

      <PageBody>
        <ServiceSettings />
      </PageBody>
    </>
  );
}
