import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Check if the current user is an admin based on their account_type
 */
export async function getCurrentUserAdminStatus(): Promise<boolean> {
  try {
    const client = getSupabaseServerClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return false;
    }

    // Check the user's account type
    const { data: account, error: accountError } = await client
      .from('accounts')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (accountError || !account) {
      return false;
    }

    return account.account_type === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
