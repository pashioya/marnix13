/*
 * -------------------------------------------------------
 * User Approval System Migration
 * Adds approval status tracking for user registration
 * -------------------------------------------------------
 */

-- Create admin roles table first
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    granted_at timestamp with time zone DEFAULT NOW(),
    granted_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    UNIQUE(user_id, role)
);

-- Add comments for admin roles table
COMMENT ON TABLE public.admin_roles IS 'Stores admin role assignments for users';
COMMENT ON COLUMN public.admin_roles.user_id IS 'The user who has the admin role';
COMMENT ON COLUMN public.admin_roles.role IS 'The type of admin role (admin, super_admin)';
COMMENT ON COLUMN public.admin_roles.granted_at IS 'When the role was granted';
COMMENT ON COLUMN public.admin_roles.granted_by IS 'The admin who granted this role';
COMMENT ON COLUMN public.admin_roles.is_active IS 'Whether the role is currently active';

-- Create indexes for efficient admin role lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(user_id, is_active) WHERE is_active = true;

-- Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_roles 
        WHERE user_id = is_admin.user_id 
        AND is_active = true
        AND role IN ('admin', 'super_admin')
    );
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- Enable RLS on admin_roles table
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_roles table
CREATE POLICY admin_roles_read ON public.admin_roles FOR SELECT
TO authenticated
USING (
    -- Users can read their own roles
    user_id = auth.uid() OR
    -- Admins can read all roles
    public.is_admin(auth.uid())
);

-- Only super admins can insert/update/delete admin roles
CREATE POLICY admin_roles_super_admin_only ON public.admin_roles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    )
);

-- Function to grant admin role (only super admins can grant roles)
CREATE OR REPLACE FUNCTION public.grant_admin_role(
    target_user_id uuid,
    role_type text DEFAULT 'admin'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the current user is a super admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required to grant admin roles';
    END IF;
    
    -- Validate role type
    IF role_type NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role type. Must be admin or super_admin';
    END IF;
    
    -- Check if target user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;
    
    -- Insert or update the admin role
    INSERT INTO public.admin_roles (user_id, role, granted_by)
    VALUES (target_user_id, role_type, auth.uid())
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
        is_active = true,
        granted_at = NOW(),
        granted_by = auth.uid();
END;
$$;

-- Function to revoke admin role
CREATE OR REPLACE FUNCTION public.revoke_admin_role(
    target_user_id uuid,
    role_type text DEFAULT 'admin'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the current user is a super admin
    IF NOT EXISTS (
        SELECT 1 FROM public.admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required to revoke admin roles';
    END IF;
    
    -- Prevent super admins from revoking their own super admin role
    IF target_user_id = auth.uid() AND role_type = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot revoke your own super admin role';
    END IF;
    
    -- Deactivate the admin role
    UPDATE public.admin_roles 
    SET is_active = false
    WHERE user_id = target_user_id AND role = role_type;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Admin role not found for user';
    END IF;
END;
$$;

-- Grant execute permissions on admin role functions
GRANT EXECUTE ON FUNCTION public.grant_admin_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(uuid, text) TO authenticated, service_role;

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
GRANT EXECUTE ON FUNCTION public.approve_account(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_account(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_approved_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_approval_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_approval_statistics() TO authenticated, service_role;

-- Update the new_user_created_setup function to set new users as pending
CREATE OR REPLACE FUNCTION kit.new_user_created_setup() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_name   text;
    picture_url text;
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

    -- Create account with pending approval status
    INSERT INTO public.accounts(
        id,
        name,
        picture_url,
        email,
        approval_status,
        created_at,
        created_by
    ) VALUES (
        new.id,
        user_name,
        picture_url,
        new.email,
        'pending',  -- Set new users as pending by default
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
 * INITIAL ADMIN SETUP INSTRUCTIONS
 * -------------------------------------------------------
 * 
 * After running this migration, you need to manually create the first super admin.
 * Run the following SQL to grant super admin privileges to a user:
 * 
 * INSERT INTO public.admin_roles (user_id, role, granted_by, is_active)
 * VALUES ('YOUR_USER_UUID_HERE', 'super_admin', 'YOUR_USER_UUID_HERE', true);
 * 
 * Replace 'YOUR_USER_UUID_HERE' with the actual UUID of the user who should be the first super admin.
 * You can find user UUIDs in the auth.users table.
 * 
 * After creating the first super admin, they can use the grant_admin_role() function
 * to grant admin or super_admin roles to other users.
 * 
 * Example:
 * SELECT public.grant_admin_role('user_uuid_here', 'admin');
 * SELECT public.grant_admin_role('user_uuid_here', 'super_admin');
 */
