'use server';

import { revalidatePath } from 'next/cache';

import { createEmailNotificationService } from '@kit/accounts/email-notification';
import {
  ApprovalActionParamsSchema,
  RejectUserFormSchema,
  createUserApprovalService,
} from '@kit/accounts/user-approval';
import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import appConfig from '~/config/app.config';

/**
 * Helper function to fetch user account data
 */
async function fetchUserAccountData(
  adminClient: Parameters<typeof createUserApprovalService>[0],
  userId: string,
) {
  const { data: accountData, error: accountError } = await adminClient
    .from('accounts')
    .select('name, email')
    .eq('id', userId)
    .single();

  return { accountData, accountError };
}

/**
 * Server action to get pending users
 */
export const getPendingUsersAction = enhanceAction(
  async (formData: FormData, user) => {
    const ctx = { name: 'getPendingUsersAction', userId: user.id };

    try {
      // Check if the current user is an admin using regular client
      const userClient = getSupabaseServerClient();
      const { data: userAccount, error: userError } = await userClient
        .from('accounts')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (userError || !userAccount) {
        console.error(ctx, 'Failed to get user account:', userError);
        throw new Error('Failed to verify user permissions');
      }

      if (userAccount.account_type !== 'admin') {
        console.error(ctx, 'User is not an admin:', userAccount.account_type);
        throw new Error('Access denied: Admin privileges required');
      }

      // User is verified as admin, now use admin client to get data
      const adminClient = getSupabaseServerAdminClient();
      const approvalService = createUserApprovalService(adminClient);

      const pendingUsers = await approvalService.getPendingUsers();

      console.log(ctx, `Retrieved ${pendingUsers.length} pending users`);
      return { success: true, data: pendingUsers };
    } catch (error) {
      console.error(ctx, 'Failed to get pending users:', error);
      throw error;
    }
  },
  {},
);

/**
 * Server action to get approved users
 */
export const getApprovedUsersAction = enhanceAction(
  async (formData: FormData, user) => {
    const ctx = { name: 'getApprovedUsersAction', userId: user.id };

    try {
      // Check if the current user is an admin using regular client
      const userClient = getSupabaseServerClient();
      const { data: userAccount, error: userError } = await userClient
        .from('accounts')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (userError || !userAccount) {
        console.error(ctx, 'Failed to get user account:', userError);
        throw new Error('Failed to verify user permissions');
      }

      if (userAccount.account_type !== 'admin') {
        console.error(ctx, 'User is not an admin:', userAccount.account_type);
        throw new Error('Access denied: Admin privileges required');
      }

      // User is verified as admin, now use admin client to get data
      const adminClient = getSupabaseServerAdminClient();
      const approvalService = createUserApprovalService(adminClient);

      const approvedUsers = await approvalService.getApprovedUsers();

      console.log(ctx, `Retrieved ${approvedUsers.length} approved users`);
      return { success: true, data: approvedUsers };
    } catch (error) {
      console.error(ctx, 'Failed to get approved users:', error);
      throw error;
    }
  },
  {},
);

/**
 * Server action to get approval statistics
 */
export const getApprovalStatisticsAction = enhanceAction(
  async (formData: FormData, user) => {
    const ctx = { name: 'getApprovalStatisticsAction', userId: user.id };

    try {
      // Check if the current user is an admin using regular client
      const userClient = getSupabaseServerClient();
      const { data: userAccount, error: userError } = await userClient
        .from('accounts')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (userError || !userAccount) {
        console.error(ctx, 'Failed to get user account:', userError);
        throw new Error('Failed to verify user permissions');
      }

      if (userAccount.account_type !== 'admin') {
        console.error(ctx, 'User is not an admin:', userAccount.account_type);
        throw new Error('Access denied: Admin privileges required');
      }

      // User is verified as admin, now use admin client to get data
      const adminClient = getSupabaseServerAdminClient();
      const approvalService = createUserApprovalService(adminClient);

      const statistics = await approvalService.getApprovalStatistics();

      console.log(ctx, 'Retrieved approval statistics', statistics);
      return { success: true, data: statistics };
    } catch (error) {
      console.error(ctx, 'Failed to get approval statistics:', error);
      throw error;
    }
  },
  {},
);

/**
 * Server action to approve a user
 */
export const approveUserAction = enhanceAction(
  async (formData: FormData, user) => {
    const ctx = { name: 'approveUserAction', adminUserId: user.id };

    try {
      const data = Object.fromEntries(formData.entries());
      const result = ApprovalActionParamsSchema.safeParse(data);

      if (!result.success) {
        console.error(ctx, 'Invalid form data:', result.error.issues);
        throw new Error('Invalid form data');
      }

      const { userId } = result.data;

      console.log(ctx, 'Approving user:', userId);

      const adminClient = getSupabaseServerAdminClient();
      const approvalService = createUserApprovalService(adminClient);

      const approvalResult = await approvalService.approveUser(
        { userId },
        user.id,
      );

      if (!approvalResult.success) {
        console.error(ctx, 'Failed to approve user:', approvalResult.error);
        throw new Error(approvalResult.error || 'Failed to approve user');
      }

      console.log(ctx, 'User approved successfully:', userId);

      // Send approval notification email
      try {
        const { accountData, accountError } = await fetchUserAccountData(
          adminClient,
          userId,
        );

        if (accountError || !accountData) {
          console.error(
            ctx,
            'Failed to get account data for notification:',
            accountError,
          );
        } else {
          const emailService = createEmailNotificationService(
            adminClient,
            appConfig.url,
          );
          if (!accountData.email) {
            console.error(
              ctx,
              'Cannot send notification: user email is missing',
            );
            return;
          }
          await emailService.sendApprovalNotification({
            id: userId,
            name: accountData.name || 'User',
            email: accountData.email || '',
          });
          console.log(ctx, 'Approval notification sent successfully');
        }
      } catch (emailError) {
        console.error(ctx, 'Failed to send approval notification:', emailError);
        // Don't fail the approval if email fails
      }

      // Revalidate the admin users page
      revalidatePath('/home/admin/users');

      return { success: true };
    } catch (error) {
      console.error(ctx, 'Error in approveUserAction:', error);
      throw error;
    }
  },
  {},
);

/**
 * Server action to reject a user
 */
export const rejectUserAction = enhanceAction(
  async (formData: FormData, user) => {
    const ctx = { name: 'rejectUserAction', adminUserId: user.id };

    try {
      const data = Object.fromEntries(formData.entries());
      const result = RejectUserFormSchema.safeParse(data);

      if (!result.success) {
        console.error(ctx, 'Invalid form data:', result.error.issues);
        throw new Error('Invalid form data');
      }

      const { userId, reason } = result.data;

      console.log(ctx, 'Rejecting user:', { userId, reason });

      const adminClient = getSupabaseServerAdminClient();
      const approvalService = createUserApprovalService(adminClient);

      const rejectionResult = await approvalService.rejectUser(
        { userId, reason },
        user.id,
      );

      if (!rejectionResult.success) {
        console.error(ctx, 'Failed to reject user:', rejectionResult.error);
        throw new Error(rejectionResult.error || 'Failed to reject user');
      }

      console.log(ctx, 'User rejected successfully:', userId);

      // Send rejection notification email
      try {
        const { accountData, accountError } = await fetchUserAccountData(
          adminClient,
          userId,
        );

        if (accountError || !accountData) {
          console.error(
            ctx,
            'Failed to get account data for notification:',
            accountError,
          );
        } else {
          const emailService = createEmailNotificationService(
            adminClient,
            appConfig.url,
          );
          await emailService.sendRejectionNotification(
            {
              id: userId,
              name: accountData.name || 'User',
              email: accountData.email || '',
            },
            reason,
          );
          console.log(ctx, 'Rejection notification sent successfully');
        }
      } catch (emailError) {
        console.error(
          ctx,
          'Failed to send rejection notification:',
          emailError,
        );
        // Don't fail the rejection if email fails
      }

      // Revalidate the admin users page
      revalidatePath('/home/admin/users');

      return { success: true };
    } catch (error) {
      console.error(ctx, 'Error in rejectUserAction:', error);
      throw error;
    }
  },
  {},
);
