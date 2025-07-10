-- Add account type system with admin role
-- This replaces the hardcoded email approach with a proper role-based system

-- Create enum for account types (if not already exists)
DO $$ BEGIN
    CREATE TYPE public.account_type AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add account_type column to accounts table (if not already exists)
DO $$ BEGIN
    ALTER TABLE public.accounts 
    ADD COLUMN account_type public.account_type DEFAULT 'user' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add comment for the new column
COMMENT ON COLUMN public.accounts.account_type IS 'The type/role of the account (user, admin, moderator)';

-- Create index for efficient querying of account types
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON public.accounts(account_type);

-- Update existing accounts - you can manually set specific accounts as admin later
-- For now, we'll leave all as 'user' by default

-- Create function to check if a user is an admin
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
        current_role = 'service_role'
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

-- Drop the existing function first, then recreate with new signature
DROP FUNCTION IF EXISTS public.get_approved_users();

-- Update the get_approved_users function to use the new role system
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
    approved_by_email text,
    account_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the calling user is an admin using the new role system
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        a.id AS id,
        a.name AS name,
        a.email AS email,
        a.created_at AS requested_at,
        a.approval_status AS approval_status,
        a.approved_at AS approved_at,
        a.approved_by AS approved_by,
        a.picture_url AS picture_url,
        u.email_confirmed_at AS email_confirmed_at,
        u.last_sign_in_at AS last_sign_in_at,
        approver.email::text AS approved_by_email,
        a.account_type::text AS account_type
    FROM public.accounts a
    JOIN auth.users u ON a.id = u.id
    LEFT JOIN auth.users approver ON a.approved_by = approver.id
    WHERE a.approval_status = 'approved'
    ORDER BY a.approved_at DESC;
END;
$$;

-- Update the approve_account function to require admin privileges
CREATE OR REPLACE FUNCTION kit.approve_account(
    account_id uuid,
    admin_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check if the admin user has admin privileges
    IF NOT public.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required to approve accounts.';
    END IF;
    
    -- Update the account approval status
    UPDATE public.accounts 
    SET approval_status = 'approved',
        approved_at = NOW(),
        approved_by = admin_user_id,
        updated_at = NOW(),
        updated_by = admin_user_id
    WHERE id = account_id;
    
    -- Check if the update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account with ID % not found', account_id;
    END IF;
END;
$$;

-- Create function to reject an account (admin only)
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
    -- Check if the admin user has admin privileges
    IF NOT public.is_admin(admin_user_id) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required to reject accounts.';
    END IF;
    
    -- Update the account rejection status
    UPDATE public.accounts 
    SET approval_status = 'rejected',
        rejected_at = NOW(),
        rejected_by = admin_user_id,
        rejection_reason = reason,
        updated_at = NOW(),
        updated_by = admin_user_id
    WHERE id = account_id;
    
    -- Check if the update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account with ID % not found', account_id;
    END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_approved_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION kit.approve_account(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION kit.reject_account(uuid, uuid, text) TO authenticated, service_role;
