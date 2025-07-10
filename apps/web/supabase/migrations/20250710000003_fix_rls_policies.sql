/*
 * -------------------------------------------------------
 * Fix RLS Policies for User Approval System
 * This migration fixes the infinite recursion issue in RLS policies
 * -------------------------------------------------------
 */

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
    (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) IN (
        'admin@example.test',
        'admin@example.com'
    )
    OR (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) ILIKE '%admin%'
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
    (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) IN (
        'admin@example.test',
        'admin@example.com'
    )
    OR (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) ILIKE '%admin%'
)
WITH CHECK (
    -- Same check for updates
    (SELECT auth.uid()) = id
    OR
    (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) IN (
        'admin@example.test', 
        'admin@example.com'
    )
    OR (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) ILIKE '%admin%'
);

-- Create a policy for inserting accounts (for admins and new user creation)
CREATE POLICY accounts_insert ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (
    -- Users can insert their own account
    (SELECT auth.uid()) = id
    OR
    -- Admins can insert any account
    (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) IN (
        'admin@example.test', 
        'admin@example.com'
    )
    OR (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) ILIKE '%admin%'
);

-- Create a policy for deleting accounts (admin only)
CREATE POLICY accounts_delete ON public.accounts FOR DELETE
TO authenticated
USING (
    -- Only admins can delete accounts
    (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) IN (
        'admin@example.test',
        'admin@example.com'
    )
    OR (SELECT email FROM auth.users WHERE id = (SELECT auth.uid())) ILIKE '%admin%'
);

-- Create a separate policy for service_role (for server-side operations)
CREATE POLICY accounts_service_role ON public.accounts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Make sure the policies are enabled
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Grant SELECT permission on auth.users to authenticated role
-- This is needed for the RLS policies to check user emails
GRANT SELECT ON auth.users TO authenticated;

-- Update the get_pending_users function to use SECURITY DEFINER properly
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
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = (SELECT auth.uid()) 
        AND (
            email IN ('admin@example.test', 'admin@example.com')
            OR email ILIKE '%admin%'
        )
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
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

-- Update the get_approved_users function to use SECURITY DEFINER properly
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
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = (SELECT auth.uid()) 
        AND (
            email IN ('admin@example.test', 'admin@example.com')
            OR email ILIKE '%admin%'
        )
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
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

-- Update the approve_account function to check admin privileges
CREATE OR REPLACE FUNCTION kit.approve_account(
    account_id uuid,
    admin_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the admin user has permission
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = admin_user_id 
        AND (
            email IN ('admin@example.test', 'admin@example.com')
            OR email ILIKE '%admin%'
        )
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
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

-- Update the reject_account function to check admin privileges
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
    -- Check if the admin user has permission
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = admin_user_id 
        AND (
            email IN ('admin@example.test', 'admin@example.com')
            OR email ILIKE '%admin%'
        )
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
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
