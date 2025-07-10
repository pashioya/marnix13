/*
 * -------------------------------------------------------
 * Fix RLS Policies for User Approval System
 * This migration fixes the infinite recursion issue in RLS policies
 * and implements proper role-based access control using account_type
 * -------------------------------------------------------
 */

-- The admin_roles table system has been removed in favor of account_type column
-- No need to create admin_roles table anymore

-- Helper function to check if a user is an admin using account_type (updated version)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Allow service_role to act as admin (for server-side operations)
    IF current_setting('role') = 'service_role' THEN
        RETURN true;
    END IF;
    
    -- Return true if the user has admin account type
    RETURN EXISTS (
        SELECT 1 FROM public.accounts 
        WHERE id = user_id AND account_type = 'admin'
    );
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- No need for admin_roles RLS policies since we removed the table

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS accounts_read ON public.accounts;
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_approved_update ON public.accounts;
DROP POLICY IF EXISTS accounts_admin_read ON public.accounts;
DROP POLICY IF EXISTS accounts_admin_update ON public.accounts;

-- Create a unified policy for reading accounts
-- Users can read their own account OR admins can read any account
CREATE POLICY accounts_read ON public.accounts FOR SELECT
TO authenticated
USING (
    -- Users can read their own account
    (SELECT auth.uid()) = id
    OR
    -- Admins can read any account
    public.is_admin(auth.uid())
);

-- Create a unified policy for updating accounts
-- Users can update their own accounts OR admins can update any account
CREATE POLICY accounts_update ON public.accounts FOR UPDATE
TO authenticated
USING (
    -- Users can update their own account
    (SELECT auth.uid()) = id
    OR
    -- Admins can update any account
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- Same check for updates
    (SELECT auth.uid()) = id
    OR
    public.is_admin(auth.uid())
);

-- Create a policy for inserting accounts (for admins and new user creation)
CREATE POLICY accounts_insert ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can insert their own account
    (SELECT auth.uid()) = id
    OR
    -- Admins can insert any account
    public.is_admin(auth.uid())
);

-- Create a policy for deleting accounts (admin only)
CREATE POLICY accounts_delete ON public.accounts FOR DELETE
TO authenticated
USING (
    -- Only admins can delete accounts
    public.is_admin(auth.uid())
);

-- Create a separate policy for service_role (for server-side operations)
CREATE POLICY accounts_service_role ON public.accounts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Make sure the policies are enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Update the get_pending_users function to use proper admin role checking
CREATE OR REPLACE FUNCTION public.get_pending_users()
RETURNS TABLE(
    id uuid,
    name varchar(255),
    email varchar(320),
    requested_at timestamptz,
    approval_status text,
    picture_url varchar(1000),
    email_confirmed_at timestamptz,
    last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to view pending users';
    END IF;
    
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.email,
        a.created_at as requested_at,
        a.approval_status,
        a.picture_url,
        u.email_confirmed_at,
        u.last_sign_in_at
    FROM public.accounts a
    JOIN auth.users u ON a.id = u.id
    WHERE a.approval_status = 'pending'
    ORDER BY a.created_at DESC;
END;
$$;

-- Update the get_approved_users function to use proper admin role checking
CREATE OR REPLACE FUNCTION public.get_approved_users()
RETURNS TABLE(
    id uuid,
    name varchar(255),
    email varchar(320),
    requested_at timestamptz,
    approval_status text,
    approved_at timestamptz,
    approved_by uuid,
    picture_url varchar(1000),
    email_confirmed_at timestamptz,
    last_sign_in_at timestamptz,
    approved_by_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to view approved users';
    END IF;
    
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.email,
        a.created_at as requested_at,
        a.approval_status,
        a.approved_at,
        a.approved_by,
        a.picture_url,
        u.email_confirmed_at,
        u.last_sign_in_at,
        approver.email::text as approved_by_email
    FROM public.accounts a
    JOIN auth.users u ON a.id = u.id
    LEFT JOIN auth.users approver ON a.approved_by = approver.id
    WHERE a.approval_status = 'approved'
    ORDER BY a.approved_at DESC;
END;
$$;

-- Update the approve_account function to use proper admin role checking
CREATE OR REPLACE FUNCTION kit.approve_account(
    account_id uuid,
    admin_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the admin user has proper admin privileges
    IF NOT public.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: User does not have admin privileges';
    END IF;
    
    -- Update the account approval status
    UPDATE public.accounts 
    SET 
        approval_status = 'approved',
        approved_at = NOW(),
        approved_by = admin_user_id,
        -- Clear rejection fields if previously rejected
        rejection_reason = NULL,
        rejected_at = NULL,
        rejected_by = NULL
    WHERE id = account_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found';
    END IF;
END;
$$;

-- Update the reject_account function to use proper admin role checking
CREATE OR REPLACE FUNCTION kit.reject_account(
    account_id uuid,
    admin_user_id uuid,
    reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the admin user has proper admin privileges
    IF NOT public.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied: User does not have admin privileges';
    END IF;
    
    -- Update the account rejection status
    UPDATE public.accounts 
    SET 
        approval_status = 'rejected',
        rejected_at = NOW(),
        rejected_by = admin_user_id,
        rejection_reason = reason,
        -- Clear approval fields if previously approved
        approved_at = NULL,
        approved_by = NULL
    WHERE id = account_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found';
    END IF;
END;
$$;

-- Add admin role management functions using account_type system
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the calling user is an admin or if this is being called with service role
    IF NOT (
        public.is_admin(auth.uid()) OR 
        current_setting('role') = 'service_role'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required to promote users.';
    END IF;
    
    -- Check if target user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;
    
    -- Update the target user's account type to admin
    UPDATE public.accounts 
    SET account_type = 'admin',
        updated_at = NOW(),
        updated_by = COALESCE(auth.uid(), target_user_id)
    WHERE id = target_user_id;
    
    -- Check if the update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found', target_user_id;
    END IF;
END;
$$;

-- Function to revoke admin privileges (demote to user)
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the calling user is an admin or if this is being called with service role
    IF NOT (
        public.is_admin(auth.uid()) OR 
        current_setting('role') = 'service_role'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required to demote users.';
    END IF;
    
    -- Prevent admins from demoting themselves
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot demote yourself from admin role';
    END IF;
    
    -- Update the target user's account type to user
    UPDATE public.accounts 
    SET account_type = 'user',
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$;

-- Grant execute permissions on admin role functions
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(uuid) TO authenticated, service_role;

/*
 * -------------------------------------------------------
 * ADMIN SETUP INSTRUCTIONS
 * -------------------------------------------------------
 * 
 * The system now uses account_type column for admin privileges instead of admin_roles table.
 * 
 * AUTOMATIC ADMIN SETUP:
 * - Users with email "admin@example.test" are automatically set as admin accounts upon registration
 * - They will have account_type = 'admin' and approval_status = 'approved'
 * 
 * MANUAL ADMIN PROMOTION:
 * To promote any existing user to admin, you can use:
 * 
 * UPDATE public.accounts 
 * SET account_type = 'admin' 
 * WHERE email = 'user@example.com';
 * 
 * Or use the promote_to_admin function:
 * SELECT public.promote_to_admin('USER_UUID_HERE');
 * 
 * To demote an admin back to user:
 * SELECT public.demote_from_admin('USER_UUID_HERE');
 */
