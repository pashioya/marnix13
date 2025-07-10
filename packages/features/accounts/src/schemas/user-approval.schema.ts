import { z } from 'zod';

export const ApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const ApprovalActionParamsSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

export const UserApprovalFormSchema = z.object({
  action: z.enum(['approve', 'reject']),
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

export const RejectUserFormSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required for rejection'),
});

export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export type ApprovalActionParams = z.infer<typeof ApprovalActionParamsSchema>;
export type UserApprovalFormData = z.infer<typeof UserApprovalFormSchema>;
export type RejectUserFormData = z.infer<typeof RejectUserFormSchema>;
