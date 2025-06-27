import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, Server, Shield, Users } from 'lucide-react';

import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div className={'container mx-auto'}>
        <Hero
          title={
            <>
              <span>Your Home Server,</span>
              <span>Simplified</span>
            </>
          }
          subtitle={
            <span>
              Marnix 13 provides a unified portal to access all of my
              self-hosted services. This allows me to manage users, provision
              accounts, and streamline access to Jellyfin, Nextcloud, and more
              from one secure dashboard.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <Image
              priority
              className={
                'dark:border-primary/10 rounded-2xl border border-gray-200'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`Marnix 13 Portal`}
            />
          }
        />
      </div>

      <div className={'container mx-auto'}>
        <div
          className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}
        >
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  Unified Home Server Management
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  Streamline access to all your self-hosted services with
                  centralized authentication and user management.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Server className="h-5" />
                <span>Home Server Portal</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'Centralized Dashboard'}
                description={`Access Jellyfin, Nextcloud, Radarr, Sonarr, and more from one beautiful interface.`}
              />

              <FeatureCard
                className={
                  'relative col-span-2 w-full overflow-hidden lg:col-span-1'
                }
                label={'User Management'}
                description={`Admin approval workflow with automatic account provisioning across services.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'Secure Authentication'}
                description={`Role-based access control with Supabase integration.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'Mobile Integration'}
                description={`One-click setup for Infuse and other mobile clients with your media servers.`}
              />
            </FeatureGrid>
          </FeatureShowcase>

          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  Seamless Service Integration
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  Automatically provision user accounts across your self-hosted
                  services when new users are approved.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Users className="h-5" />
                <span>Auto Provisioning</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'Jellyfin Integration'}
                description={`Automatic user creation in your Jellyfin media server.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'Nextcloud Sync'}
                description={`Provision cloud storage accounts automatically.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'Admin Dashboard'}
                description={`Review and approve new user registrations with built-in monitoring.`}
              />
            </FeatureGrid>
          </FeatureShowcase>

          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  Built for Self-Hosters
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  Designed specifically for home server enthusiasts who want
                  professional-grade user management.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Shield className="h-5" />
                <span>Self-Hosted First</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'Privacy Focused'}
                description={`Your data stays on your servers. No external dependencies beyond your chosen services.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'Open Source'}
                description={`Built on Makerkit with full source code access.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'Easy Deployment'}
                description={`Deploy on Vercel, Netlify, or self-host alongside your other services.`}
              />
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex space-x-4'}>
      <CtaButton>
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>Request Access</span>

            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'link'}>
        <Link href={'/contact'}>
          <Trans i18nKey={'common:contactUs'} />
        </Link>
      </CtaButton>
    </div>
  );
}
