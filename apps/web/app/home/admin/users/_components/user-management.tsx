'use client';

import { useEffect, useState } from 'react';

import { Check, Clock, User, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

import {
  approveUserAction,
  getApprovalStatisticsAction,
  getApprovedUsersAction,
  getPendingUsersAction,
} from '../_actions/user-approval.actions';
import { RejectUserDialog } from './reject-user-dialog';

// Types matching the database schema
interface PendingUser {
  id: string;
  name: string;
  email: string;
  requested_at: string;
  approval_status: 'pending';
  picture_url: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface ApprovedUser {
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

interface ApprovalStatistics {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export function UserManagement() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [statistics, setStatistics] = useState<ApprovalStatistics>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(
    new Set(),
  );
  const [rejectUser, setRejectUser] = useState<PendingUser | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const emptyFormData = new FormData();

      const [pendingResult, approvedResult, statsResult] = await Promise.all([
        getPendingUsersAction(emptyFormData),
        getApprovedUsersAction(emptyFormData),
        getApprovalStatisticsAction(emptyFormData),
      ]);

      if (pendingResult.success && pendingResult.data) {
        setPendingUsers(pendingResult.data);
      }

      if (approvedResult.success && approvedResult.data) {
        setApprovedUsers(approvedResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStatistics(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setProcessingUsers((prev) => new Set(prev).add(userId));
    try {
      const formData = new FormData();
      formData.append('userId', userId);

      await approveUserAction(formData);

      toast.success('User approved successfully');

      // Reload data to get updated state
      await loadData();
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to approve user',
      );
    } finally {
      setProcessingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectUser = (user: PendingUser) => {
    setRejectUser(user);
  };

  const handleRejectDialogClose = () => {
    setRejectUser(null);
    // Reload data when dialog closes (rejection completed)
    loadData().catch((error) => {
      console.error('Failed to reload data after dialog close:', error);
    });
  };

  if (isLoading) {
    return <LoadingOverlay fullPage={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
            <p className="text-muted-foreground text-xs">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.approved}</div>
            <p className="text-muted-foreground text-xs">
              With access to services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Auto Provisioning
            </CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-muted-foreground text-xs">
              Jellyfin & Nextcloud ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending User Requests</CardTitle>
            <CardDescription>
              Review and approve new user registrations. Approved users will
              automatically receive accounts in Jellyfin and Nextcloud.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={processingUsers.has(user.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {processingUsers.has(user.id)
                          ? 'Processing...'
                          : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectUser(user)}
                        disabled={processingUsers.has(user.id)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>
            Users with approved access to the home server services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Services</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.approved_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          Jellyfin
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Nextcloud
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              No active users yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject User Dialog */}
      {rejectUser && (
        <RejectUserDialog
          isOpen={!!rejectUser}
          onClose={handleRejectDialogClose}
          user={rejectUser}
        />
      )}
    </div>
  );
}
