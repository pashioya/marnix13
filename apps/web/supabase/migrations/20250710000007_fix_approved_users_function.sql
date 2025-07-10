-- Fix the get_approved_users function to use the new role system

DROP FUNCTION IF EXISTS public.get_approved_users();

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
    approved_by_email varchar(320)
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
        admin_accounts.email AS approved_by_email
    FROM public.accounts a
    JOIN auth.users u ON a.id = u.id
    LEFT JOIN public.accounts admin_accounts ON a.approved_by = admin_accounts.id
    WHERE a.approval_status = 'approved'
    ORDER BY a.approved_at DESC;
END;
$$;

-- Create internal version for service role access
DROP FUNCTION IF EXISTS public.get_approved_users_internal();

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
    approved_by_email varchar(320)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Internal function bypasses admin check for service role operations
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
        admin_accounts.email AS approved_by_email
    FROM public.accounts a
    JOIN auth.users u ON a.id = u.id
    LEFT JOIN public.accounts admin_accounts ON a.approved_by = admin_accounts.id
    WHERE a.approval_status = 'approved'
    ORDER BY a.approved_at DESC;
END;
$$;

-- Also create internal version for pending users
DROP FUNCTION IF EXISTS public.get_pending_users_internal();

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
    -- Internal function bypasses admin check for service role operations
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_approved_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_approved_users_internal() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_users_internal() TO service_role;
