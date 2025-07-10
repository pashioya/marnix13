/*
 * -------------------------------------------------------
 * User Approval System Migration
 * Adds approval status tracking for user registration
 * -------------------------------------------------------
 */

-- Create enum for account types (if not already exists from later migration)
DO $$ BEGIN
    CREATE TYPE public.account_type AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add account_type column to accounts table (if not already exists from later migration)
DO $$ BEGIN
    ALTER TABLE public.accounts 
    ADD COLUMN account_type public.account_type DEFAULT 'user' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add comment for the account_type column
COMMENT ON COLUMN public.accounts.account_type IS 'The type/role of the account (user, admin, moderator)';

-- Create index for efficient querying of account types
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON public.accounts(account_type);

-- Helper function to check if a user is an admin using account_type
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

-- Create function to promote a user to admin (can only be called by existing admins or service role)
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

-- Add approval status column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid references auth.users,
ADD COLUMN rejection_reason text,
ADD COLUMN rejected_at timestamp with time zone,
ADD COLUMN rejected_by uuid references auth.users;

-- Add comments for new columns
COMMENT ON COLUMN public.accounts.approval_status IS 'The approval status of the user account (pending, approved, rejected)';
COMMENT ON COLUMN public.accounts.approved_at IS 'The timestamp when the account was approved';
COMMENT ON COLUMN public.accounts.approved_by IS 'The admin user who approved the account';
COMMENT ON COLUMN public.accounts.rejection_reason IS 'The reason for rejecting the account (if applicable)';
COMMENT ON COLUMN public.accounts.rejected_at IS 'The timestamp when the account was rejected';
COMMENT ON COLUMN public.accounts.rejected_by IS 'The admin user who rejected the account';

-- Create index for efficient querying of approval status
CREATE INDEX IF NOT EXISTS idx_accounts_approval_status ON public.accounts(approval_status);
CREATE INDEX IF NOT EXISTS idx_accounts_approved_at ON public.accounts(approved_at);

-- Update existing accounts to be approved by default (for backward compatibility)
UPDATE public.accounts 
SET approval_status = 'approved', 
    approved_at = created_at,
    approved_by = created_by 
WHERE approval_status IS NULL OR approval_status = 'pending';

-- Create a function to handle account approval
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

-- Create a function to handle account rejection
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

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION kit.approve_account(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION kit.reject_account(uuid, uuid, text) TO authenticated, service_role;

-- Create helper functions for the service layer
CREATE OR REPLACE FUNCTION public.approve_account(
    account_id uuid,
    admin_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Call the kit function
    PERFORM kit.approve_account(account_id, admin_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_account(
    account_id uuid,
    admin_user_id uuid,
    reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Call the kit function
    PERFORM kit.reject_account(account_id, admin_user_id, reason);
END;
$$;

-- Create function to get pending users
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
    -- Check if the current user has admin privileges
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

-- Create internal function for service_role (bypasses auth check)
CREATE OR REPLACE FUNCTION public.get_pending_users_internal()
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
    -- No permission check - for use with service_role only
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

-- Create function to get approved users
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
    -- Check if the current user has admin privileges
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

-- Create internal function for service_role (bypasses auth check)
CREATE OR REPLACE FUNCTION public.get_approved_users_internal()
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
    -- No permission check - for use with service_role only
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

-- Create function to get user approval status
CREATE OR REPLACE FUNCTION public.get_user_approval_status(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'approvalStatus', a.approval_status,
        'approvedAt', a.approved_at,
        'rejectedAt', a.rejected_at,
        'rejectionReason', a.rejection_reason
    ) INTO result
    FROM public.accounts a
    WHERE a.id = user_id;
    
    RETURN result;
END;
$$;

-- Create function to get approval statistics
CREATE OR REPLACE FUNCTION public.get_approval_statistics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result json;
BEGIN
    -- Check if the current user has admin privileges
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required to view approval statistics';
    END IF;
    
    SELECT json_build_object(
        'pending', COUNT(*) FILTER (WHERE approval_status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE approval_status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE approval_status = 'rejected'),
        'total', COUNT(*)
    ) INTO result
    FROM public.accounts
    WHERE approval_status IS NOT NULL;
    
    RETURN result;
END;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_account(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_account(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_approved_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_approval_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_approval_statistics() TO authenticated, service_role;

-- Update the new_user_created_setup function to set new users as pending and auto-promote admin@example.test
CREATE OR REPLACE FUNCTION kit.new_user_created_setup() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_name   text;
    picture_url text;
    user_account_type public.account_type;
    user_approval_status text;
    approval_timestamp timestamptz;
    approver_id uuid;
BEGIN
    IF new.raw_user_meta_data ->> 'name' IS NOT NULL THEN
        user_name := new.raw_user_meta_data ->> 'name';
    END IF;

    IF user_name IS NULL AND new.email IS NOT NULL THEN
        user_name := split_part(new.email, '@', 1);
    END IF;

    IF user_name IS NULL THEN
        user_name := '';
    END IF;

    IF new.raw_user_meta_data ->> 'avatar_url' IS NOT NULL THEN
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    ELSE
        picture_url := NULL;
    END IF;

    -- Check if this is the special admin email
    IF new.email = 'admin@example.test' THEN
        user_account_type := 'admin';
        user_approval_status := 'approved';
        approval_timestamp := NOW();
        approver_id := new.id; -- Self-approved
    ELSE
        user_account_type := 'user';
        user_approval_status := 'pending';
        approval_timestamp := NULL;
        approver_id := NULL;
    END IF;

    -- Create account with appropriate status and type
    INSERT INTO public.accounts(
        id,
        name,
        picture_url,
        email,
        account_type,
        approval_status,
        approved_at,
        approved_by,
        created_at,
        created_by
    ) VALUES (
        new.id,
        user_name,
        picture_url,
        new.email,
        user_account_type,
        user_approval_status,
        approval_timestamp,
        approver_id,
        NOW(),
        new.id
    );

    RETURN new;
END;
$$;

-- Create RLS policies for approval status
-- First, drop existing policies that might conflict
DROP POLICY IF EXISTS accounts_read ON public.accounts;
DROP POLICY IF EXISTS accounts_update ON public.accounts;
DROP POLICY IF EXISTS accounts_approved_update ON public.accounts;
DROP POLICY IF EXISTS accounts_admin_read ON public.accounts;

-- Policy for reading accounts
CREATE POLICY accounts_read ON public.accounts FOR SELECT
TO authenticated
USING (
    -- Users can always read their own account
    (SELECT auth.uid()) = id
);

-- Policy for updating accounts (only approved users can update their own accounts)
CREATE POLICY accounts_update ON public.accounts FOR UPDATE
TO authenticated
USING (
    (SELECT auth.uid()) = id AND approval_status = 'approved'
)
WITH CHECK (
    (SELECT auth.uid()) = id AND approval_status = 'approved'
);

-- Admin policy for reading all accounts (for admin dashboard)
CREATE POLICY accounts_admin_read ON public.accounts FOR SELECT
TO authenticated
USING (
    -- Allow admin users to read all accounts
    public.is_admin(auth.uid())
);

-- Policy for admin actions on accounts
CREATE POLICY accounts_admin_update ON public.accounts FOR UPDATE
TO authenticated
USING (
    -- Allow admin users to update approval status
    public.is_admin(auth.uid())
)
WITH CHECK (
    -- Allow admin users to update approval status
    public.is_admin(auth.uid())
);

-- Create a view for pending users (for admin dashboard)
CREATE OR REPLACE VIEW kit.pending_users AS
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

-- Grant access to the view
GRANT SELECT ON kit.pending_users TO authenticated, service_role;

-- Create a view for approved users (for admin dashboard)
CREATE OR REPLACE VIEW kit.approved_users AS
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
    approver.email as approved_by_email
FROM public.accounts a
JOIN auth.users u ON a.id = u.id
LEFT JOIN auth.users approver ON a.approved_by = approver.id
WHERE a.approval_status = 'approved'
ORDER BY a.approved_at DESC;

-- Grant access to the view
GRANT SELECT ON kit.approved_users TO authenticated, service_role;

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
 * ADMIN PRIVILEGES:
 * Admin users can:
 * - View all pending users (get_pending_users)
 * - View all approved users (get_approved_users)
 * - Approve user accounts (approve_account)
 * - Reject user accounts (reject_account)
 * - View approval statistics (get_approval_statistics)
 * - Promote other users to admin (promote_to_admin)
 */
