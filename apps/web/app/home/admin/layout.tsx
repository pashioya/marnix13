import { requireAdminAccess } from '~/lib/auth/require-admin-access';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure only admin users can access any admin routes
  await requireAdminAccess();

  return <>{children}</>;
}
