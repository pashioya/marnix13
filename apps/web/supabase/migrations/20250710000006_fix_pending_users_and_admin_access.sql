-- Fix both get_pending_users and get_approved_users functions
-- to use the new role system and resolve ambiguous column references

-- Drop and recreate get_pending_users function with proper role check
DROP FUNCTION IF EXISTS public.get_pending_users();

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
        a.picture_url AS picture_url,
        u.email_confirmed_at AS email_confirmed_at,
        u.last_sign_in_at AS last_sign_in_at
    FROM public.accounts a
    JOIN auth.users u ON a.id = u.id
    WHERE a.approval_status = 'pending'
    ORDER BY a.created_at DESC;
END;
$$;

-- Update the is_admin function to allow service_role access
-- This is important for server-side admin operations
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_pending_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
