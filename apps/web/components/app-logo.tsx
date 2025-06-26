import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 32,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <svg
      width={width}
      className={cn(`w-[24px] lg:w-[32px]`, className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M10.0693 2.81984L3.1393 8.36989C2.3593 8.98989 1.85929 10.2999 2.02929 11.2799L3.35927 19.2399C3.59927 20.6599 4.95928 21.81 6.39928 21.81H17.5993C19.0293 21.81 20.3993 20.6499 20.6393 19.2399L21.9693 11.2799C22.1293 10.2999 21.6293 8.98989 20.8593 8.36989L13.9293 2.82985C12.8593 1.96985 11.1293 1.96984 10.0693 2.81984Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="stroke-primary dark:stroke-white"
      />
      <path 
        opacity="0.4" 
        d="M9.88086 14.3802C11.1509 13.1702 12.8508 13.1702 14.1208 14.3802" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="stroke-primary dark:stroke-white"
      />
      <path 
        opacity="0.4" 
        d="M16.24 12.2602C15.7 11.7302 15.1 11.3202 14.48 11.0202C12.89 10.2602 11.11 10.2602 9.51001 11.0202C8.89001 11.3202 8.3 11.7302 7.75 12.2602" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="stroke-primary dark:stroke-white"
      />
      <path 
        opacity="0.4" 
        d="M11.9955 16.5H12.0045" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="stroke-primary dark:stroke-white"
      />
    </svg>
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}
