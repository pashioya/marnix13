import { Footer } from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import { AppLogo } from '~/components/app-logo';
import appConfig from '~/config/app.config';

export function SiteFooter() {
  return (
    <Footer
      logo={<AppLogo className="w-[85px] md:w-[95px]" />}
      description={<Trans i18nKey="marketing:footerDescription" />}
      copyright={
        <Trans
          i18nKey="marketing:copyright"
          values={{
            product: appConfig.name,
            year: new Date().getFullYear(),
          }}
        />
      }
      sections={[
        {
          heading: 'Get Started',
          links: [
            {
              href: '/auth/sign-in',
              label: <Trans i18nKey="auth:signIn" />,
            },
            {
              href: '/auth/sign-up',
              label: <Trans i18nKey="auth:signUp" />,
            },
          ],
        },
      ]}
    />
  );
}
