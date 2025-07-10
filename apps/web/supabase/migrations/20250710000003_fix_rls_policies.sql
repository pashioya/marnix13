/*
 * -------------------------------------------------------
 * Fix RLS Policies for User Approval System
 * This migration fixes the infinite recursion issue in RLS policies
 * and implements proper role-based access control
 * -------------------------------------------------------
 */

-- Ensure admin_roles table exists (if not created by previous migration)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    granted_at timestamp with time zone DEFAULT NOW(),
    granted_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    UNIQUE(user_id, role)
);

-- Create indexes for efficient admin role lookups (if not already created)
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(user_id, is_active) WHERE is_active = true;

-- Helper function to check if a user is an admin (if not already created)
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

-- Enable RLS on admin_roles table (if not already enabled)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_roles table (if not already created)
DROP POLICY IF EXISTS admin_roles_read ON public.admin_roles;
DROP POLICY IF EXISTS admin_roles_super_admin_only ON public.admin_roles;

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

-- Add admin role management functions if they don't exist
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
