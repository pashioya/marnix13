'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { LogOut, Menu } from 'lucide-react';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';

import { navigationConfig } from '~/config/navigation.config';
import { filterAdminRoutes } from '~/lib/navigation/filter-admin-routes';

/**
 * Mobile navigation for the home page
 * @constructor
 */
export function HomeMobileNavigation() {
  const signOut = useSignOut();
  const client = useSupabase();
  const [_isAdmin, setIsAdmin] = useState(false);
  const [filteredConfig, setFilteredConfig] = useState(navigationConfig);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();

        if (userError || !user) {
          setIsAdmin(false);
          return;
        }

        const { data: account, error: _accountError } = await client
          .from('accounts')
          .select('account_type')
          .eq('id', user.id)
          .single();

        const adminStatus = account?.account_type === 'admin';
        setIsAdmin(adminStatus);

        // Filter navigation routes based on admin status
        const filteredRoutes = filterAdminRoutes(
          navigationConfig.routes,
          adminStatus,
        );
        setFilteredConfig({
          ...navigationConfig,
          routes: filteredRoutes,
        });
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [client]);

  const Links = filteredConfig.routes.map((item, index) => {
    if ('children' in item) {
      return item.children.map((child) => {
        return (
          <DropdownLink
            key={child.path}
            Icon={child.Icon}
            path={child.path}
            label={child.label}
          />
        );
      });
    }

    if ('divider' in item) {
      return <DropdownMenuSeparator key={index} />;
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Menu className={'h-9'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={10} className={'w-screen rounded-none'}>
        <DropdownMenuGroup>{Links}</DropdownMenuGroup>

        <DropdownMenuSeparator />

        <SignOutDropdownItem onSignOut={() => signOut.mutateAsync()} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownLink(
  props: React.PropsWithChildren<{
    path: string;
    label: string;
    Icon: React.ReactNode;
  }>,
) {
  return (
    <DropdownMenuItem asChild key={props.path}>
      <Link
        href={props.path}
        className={'flex h-12 w-full items-center space-x-4'}
      >
        {props.Icon}

        <span>
          <Trans i18nKey={props.label} defaults={props.label} />
        </span>
      </Link>
    </DropdownMenuItem>
  );
}

function SignOutDropdownItem(
  props: React.PropsWithChildren<{
    onSignOut: () => unknown;
  }>,
) {
  return (
    <DropdownMenuItem
      className={'flex h-12 w-full items-center space-x-4'}
      onClick={props.onSignOut}
    >
      <LogOut className={'h-6'} />

      <span>
        <Trans i18nKey={'common:signOut'} defaults={'Sign out'} />
      </span>
    </DropdownMenuItem>
  );
}
