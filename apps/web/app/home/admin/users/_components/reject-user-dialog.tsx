'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Textarea } from '@kit/ui/textarea';

import { rejectUserAction } from '../_actions/user-approval.actions';

const RejectUserSchema = z.object({
  reason: z.string().min(1, 'Reason is required for rejection'),
});

type RejectUserFormData = z.infer<typeof RejectUserSchema>;

interface RejectUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function RejectUserDialog({
  isOpen,
  onClose,
  user,
}: RejectUserDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<RejectUserFormData>({
    resolver: zodResolver(RejectUserSchema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = async (data: RejectUserFormData) => {
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('reason', data.reason);

      await rejectUserAction(formData);

      toast.success(`${user.name} has been rejected with the provided reason.`);

      onClose();
      form.reset();
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error('Failed to reject user. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject User Registration</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject the registration for{' '}
            <strong>{user.name}</strong> ({user.email})? Please provide a reason
            for rejection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for rejection</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a reason for rejecting this user..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? 'Rejecting...' : 'Reject User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
