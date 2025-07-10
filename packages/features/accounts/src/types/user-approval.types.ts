import type { Database } from '@kit/supabase/database';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface UserApprovalData {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
  approvalStatus: ApprovalStatus;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
  pictureUrl?: string | null;
  emailConfirmedAt?: string | null;
  lastSignInAt?: string | null;
}

export interface PendingUser extends UserApprovalData {
  approvalStatus: 'pending';
}

export interface ApprovedUser extends UserApprovalData {
  approvalStatus: 'approved';
  approvedAt: string;
  approvedBy: string;
  approvedByEmail?: string;
}

export interface RejectedUser extends UserApprovalData {
  approvalStatus: 'rejected';
  rejectedAt: string;
  rejectedBy: string;
  rejectionReason?: string;
}

export interface ApprovalActionParams {
  userId: string;
  reason?: string;
}

export interface ApprovalActionResult {
  success: boolean;
  error?: string;
}

// Database row types
export type AccountRow = Database['public']['Tables']['accounts']['Row'];
export type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
export type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

// Extended account type with approval fields
export interface AccountWithApproval extends AccountRow {
  approval_status: ApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
}

// View types for database views
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
