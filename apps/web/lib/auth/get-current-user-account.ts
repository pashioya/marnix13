import { getSupabaseServerClient } from '@kit/supabase/server-client';

export type AccountType = 'user' | 'admin' | 'moderator';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserAccountData {
  id: string;
  email: string;
  name: string;
  account_type: AccountType;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  picture_url: string | null;
}

/**
 * Get the current user's account data including account type and approval status
 * Returns null if user is not authenticated or account not found
 */
export async function getCurrentUserAccount(): Promise<UserAccountData | null> {
  try {
    const client = getSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Get the user's account data
    const { data: account, error: accountError } = await client
      .from('accounts')
      .select(
        'id, email, name, account_type, approval_status, approved_at, picture_url',
      )
      .eq('id', user.id)
      .single();

    if (accountError || !account) {
      return null;
    }

    return account as UserAccountData;
  } catch (error) {
    console.error('Error getting user account data:', error);
    return null;
  }
}

/**
 * Check if the current user has admin privileges
 * Returns true if user is admin, false otherwise
 */
export async function getCurrentUserAdminStatus(): Promise<boolean> {
  const account = await getCurrentUserAccount();
  return account?.account_type === 'admin' || false;
}

/**
 * Check if the current user has moderator or admin privileges
 * Returns true if user is moderator or admin, false otherwise
 */
export async function getCurrentUserModeratorStatus(): Promise<boolean> {
  const account = await getCurrentUserAccount();
  return (
    account?.account_type === 'admin' ||
    account?.account_type === 'moderator' ||
    false
  );
}

/**
 * Check if the current user is approved
 * Returns true if user is approved, false otherwise
 */
export async function getCurrentUserApprovalStatus(): Promise<boolean> {
  const account = await getCurrentUserAccount();
  return account?.approval_status === 'approved' || false;
}
