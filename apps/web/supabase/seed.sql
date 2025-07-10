-- Insert initial admin user for development
-- Note: This should only be used in development environments
--
-- IMPORTANT: This seed file contains direct INSERT statements into auth.users and public.accounts
-- that bypass Row Level Security (RLS). This file must be executed with supabase_admin privileges
-- or in a context where RLS is disabled to avoid permission conflicts.
-- On restored databases, ensure this is run with appropriate privileges.

-- Instead of manually creating auth users, let's create a function to promote existing users to admin
-- You can sign up normally through the app, then run this function to promote your user

-- Create a function to promote a user to admin by email (for development only)
CREATE OR REPLACE FUNCTION dev_promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID from email
    SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Update the account to admin type
    UPDATE public.accounts 
    SET account_type = 'admin',
        updated_at = NOW()
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account for user % not found', user_email;
    END IF;
    
    RAISE NOTICE 'User % promoted to admin successfully', user_email;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION dev_promote_user_to_admin(text) TO service_role;

-- NOTE: Sample services can be created through the admin interface after creating an admin user
-- To create an admin user:
-- 1. Sign up normally through the app
-- 2. Use psql or Supabase Studio to run: SELECT dev_promote_user_to_admin('your-email@example.com');


-- Add test data for user approval system
-- This file is for testing purposes only

-- Temporarily disable RLS for seeding operations
SET session_replication_role = replica;

-- Insert a test user that is pending approval
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test.user@example.com',
  now(),
  now(),
  now(),
  '{"name": "Test User", "approval_status": "pending"}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Insert into accounts table
INSERT INTO public.accounts (
  id,
  name,
  email,
  picture_url,
  created_at,
  updated_at,
  approval_status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test User',
  'test.user@example.com',
  null,
  now(),
  now(),
  'pending'
)
ON CONFLICT (id) DO NOTHING;

-- Insert a second test user for rejection testing
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'test.user2@example.com',
  now(),
  now(),
  now(),
  '{"name": "Test User 2", "approval_status": "pending"}'::jsonb,
  '{}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Insert into accounts table
INSERT INTO public.accounts (
  id,
  name,
  email,
  picture_url,
  created_at,
  updated_at,
  approval_status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Test User 2',
  'test.user2@example.com',
  null,
  now(),
  now(),
  'pending'
)
ON CONFLICT (id) DO NOTHING;

-- Restore default RLS behavior
SET session_replication_role = DEFAULT;