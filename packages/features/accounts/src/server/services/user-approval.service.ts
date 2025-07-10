import type { SupabaseClient } from '@supabase/supabase-js';

import { getLogger } from '@kit/shared/logger';

// Types for approval system (will be updated when DB types are regenerated)
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalActionParams {
  userId: string;
  reason?: string;
}

export interface ApprovalActionResult {
  success: boolean;
  error?: string;
}

export interface PendingUserView {
  id: string;
  name: string;
  email: string;
  requested_at: string;
  approval_status: 'pending';
  picture_url: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

export interface ApprovedUserView {
  id: string;
  name: string;
  email: string;
  requested_at: string;
  approval_status: 'approved';
  approved_at: string;
  approved_by: string;
  picture_url: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  approved_by_email: string | null;
}

export class UserApprovalService {
  private readonly namespace = 'UserApprovalService';

  constructor(private readonly adminClient: SupabaseClient) {}

  /**
   * Get all pending users awaiting approval
   */
  async getPendingUsers(): Promise<PendingUserView[]> {
    const logger = await getLogger();
    const ctx = { name: this.namespace };

    try {
      // Use raw SQL query to access the view
      const { data, error } = await this.adminClient.rpc('get_pending_users');

      if (error) {
        logger.error({ ...ctx, error }, 'Failed to fetch pending users');
        throw new Error('Failed to fetch pending users');
      }

      return (data as PendingUserView[]) || [];
    } catch (error) {
      logger.error({ ...ctx, error }, 'Error fetching pending users');
      throw error;
    }
  }

  /**
   * Get all approved users
   */
  async getApprovedUsers(): Promise<ApprovedUserView[]> {
    const logger = await getLogger();
    const ctx = { name: this.namespace };

    try {
      // Use raw SQL query to access the view
      const { data, error } = await this.adminClient.rpc('get_approved_users');

      if (error) {
        logger.error({ ...ctx, error }, 'Failed to fetch approved users');
        throw new Error('Failed to fetch approved users');
      }

      return (data as ApprovedUserView[]) || [];
    } catch (error) {
      logger.error({ ...ctx, error }, 'Error fetching approved users');
      throw error;
    }
  }

  /**
   * Approve a user account
   */
  async approveUser(
    params: ApprovalActionParams,
    adminUserId: string,
  ): Promise<ApprovalActionResult> {
    const logger = await getLogger();
    const ctx = { 
      name: this.namespace, 
      userId: params.userId, 
      adminUserId 
    };

    try {
      logger.info(ctx, 'Approving user account');

      const { error } = await this.adminClient.rpc('approve_account', {
        account_id: params.userId,
        admin_user_id: adminUserId,
      });

      if (error) {
        logger.error({ ...ctx, error }, 'Failed to approve user');
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(ctx, 'User account approved successfully');

      return { success: true };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Error approving user');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reject a user account
   */
  async rejectUser(
    params: ApprovalActionParams,
    adminUserId: string,
  ): Promise<ApprovalActionResult> {
    const logger = await getLogger();
    const ctx = { 
      name: this.namespace, 
      userId: params.userId, 
      adminUserId,
      reason: params.reason,
    };

    try {
      logger.info(ctx, 'Rejecting user account');

      const { error } = await this.adminClient.rpc('reject_account', {
        account_id: params.userId,
        admin_user_id: adminUserId,
        reason: params.reason || null,
      });

      if (error) {
        logger.error({ ...ctx, error }, 'Failed to reject user');
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info(ctx, 'User account rejected successfully');

      return { success: true };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Error rejecting user');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get approval status for a specific user
   */
  async getUserApprovalStatus(userId: string): Promise<{
    approvalStatus: ApprovalStatus;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
  } | null> {
    const logger = await getLogger();
    const ctx = { name: this.namespace, userId };

    try {
      const { data, error } = await this.adminClient.rpc('get_user_approval_status', {
        user_id: userId,
      });

      if (error) {
        logger.error({ ...ctx, error }, 'Failed to fetch user approval status');
        return null;
      }

      return data as {
        approvalStatus: ApprovalStatus;
        approvedAt?: string | null;
        rejectedAt?: string | null;
        rejectionReason?: string | null;
      } | null;
    } catch (error) {
      logger.error({ ...ctx, error }, 'Error fetching user approval status');
      return null;
    }
  }

  /**
   * Check if a user is approved
   */
  async isUserApproved(userId: string): Promise<boolean> {
    const status = await this.getUserApprovalStatus(userId);
    return status?.approvalStatus === 'approved';
  }

  /**
   * Get statistics about user approvals
   */
  async getApprovalStatistics(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const logger = await getLogger();
    const ctx = { name: this.namespace };

    try {
      const { data, error } = await this.adminClient.rpc('get_approval_statistics');

      if (error) {
        logger.error({ ...ctx, error }, 'Failed to fetch approval statistics');
        throw new Error('Failed to fetch approval statistics');
      }

      return (data as {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
      }) || { pending: 0, approved: 0, rejected: 0, total: 0 };
    } catch (error) {
      logger.error({ ...ctx, error }, 'Error fetching approval statistics');
      throw error;
    }
  }
}

/**
 * Factory function to create UserApprovalService instance
 */
export function createUserApprovalService(adminClient: SupabaseClient) {
  return new UserApprovalService(adminClient);
}
