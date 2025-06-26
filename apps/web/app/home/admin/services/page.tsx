import { PageBody, PageHeader } from '@kit/ui/page';

import { ServiceSettings } from './_components/service-settings';

export default function ServicesPage() {
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
