'use client';

import { useState } from 'react';

import { Check, Clock, User, X } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Mock data - replace with actual data from Supabase
const mockPendingUsers: PendingUser[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    requestedAt: '2024-01-15T10:30:00Z',
    status: 'pending',
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    requestedAt: '2024-01-14T15:45:00Z',
    status: 'pending',
  },
  {
    id: '3',
    email: 'bob.wilson@example.com',
    name: 'Bob Wilson',
    requestedAt: '2024-01-12T09:15:00Z',
    status: 'approved',
  },
];

export function UserManagement() {
  const [users, setUsers] = useState<PendingUser[]>(mockPendingUsers);

  const handleApproveUser = async (userId: string) => {
    // TODO: Implement actual approval logic with Supabase and service provisioning
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: 'approved' as const } : user,
      ),
    );

    // This would trigger:
    // 1. Update user status in Supabase
    // 2. Create Jellyfin account via API
    // 3. Create Nextcloud account via API
    // 4. Send welcome email

    console.log(
      `Approving user ${userId} - would provision accounts in Jellyfin and Nextcloud`,
    );
  };

  const handleRejectUser = async (userId: string) => {
    // TODO: Implement actual rejection logic
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: 'rejected' as const } : user,
      ),
    );

    console.log(`Rejecting user ${userId}`);
  };

  const pendingUsers = users.filter((user) => user.status === 'pending');
  const approvedUsers = users.filter((user) => user.status === 'approved');

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
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
            <p className="text-muted-foreground text-xs">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedUsers.length}</div>
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
                      {new Date(user.requestedAt).toLocaleDateString()}
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
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectUser(user.id)}
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
                      {new Date(user.requestedAt).toLocaleDateString()}
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
    </div>
  );
}
