import { PageBody, PageHeader } from '@kit/ui/page';

import { ServicesPortal } from './_components/services-portal';

export default function HomePage() {
  return (
    <>
      <PageHeader 
      />

      <PageBody>
        <ServicesPortal />
      </PageBody>
    </>
  );
}
