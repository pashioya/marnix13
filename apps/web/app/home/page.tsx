import { PageBody, PageHeader } from '@kit/ui/page';

import { ServicesPortal } from './_components/services-portal';

export default function HomePage() {
  return (
    <>
      <PageHeader 
        title="Welcome to Marnix 13"
        description="Your unified home server portal - Access all your self-hosted services from one place"
      />

      <PageBody>
        <ServicesPortal />
      </PageBody>
    </>
  );
}
