-- Insert initial admin user for development
-- Note: This should only be used in development environments

-- Create the auth user and account
DO $$
DECLARE
    admin_user_id uuid;
    admin_account_id uuid;
    user_exists boolean := false;
    account_exists boolean := false;
BEGIN
    -- Check if auth user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@example.test') INTO user_exists;
    
    IF user_exists THEN
        -- Get existing user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.test';
    ELSE
        -- Create new auth user
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'admin@example.test',
            crypt('testtest', gen_salt('bf')), -- Hash the password
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated'
        ) RETURNING id INTO admin_user_id;
    END IF;

    -- Check if account already exists
    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE email = 'admin@example.test') INTO account_exists;
    
    IF account_exists THEN
        -- Get existing account ID
        SELECT id INTO admin_account_id FROM public.accounts WHERE email = 'admin@example.test';
    ELSE
        -- Create new account
        INSERT INTO public.accounts (
            id,
            name,
            email,
            created_at,
            updated_at,
            created_by,
            updated_by
        ) VALUES (
            gen_random_uuid(),
            'Admin Account',
            'admin@example.test',
            now(),
            now(),
            admin_user_id,
            admin_user_id
        ) RETURNING id INTO admin_account_id;
    END IF;

    -- Add some sample services for development (only if they don't exist)
    IF NOT EXISTS(SELECT 1 FROM public.services WHERE service_key = 'jellyfin') THEN
        INSERT INTO public.services (
            service_key,
            name,
            description,
            url,
            enabled,
            auto_provision,
            status,
            category,
            service_type,
            auth_type,
            requires_auth,
            ssl_enabled,
            supports_user_provisioning,
            default_user_role,
            account_id,
            created_by,
            updated_by
        ) VALUES (
            'jellyfin',
            'Jellyfin Media Server',
            'Media server for streaming movies, TV shows, and music',
            'http://localhost:8096',
            true,
            true,
            'offline',
            'media',
            'jellyfin',
            'api_key',
            true,
            false,
            true,
            'User',
            admin_account_id,
            admin_user_id,
            admin_user_id
        );
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.services WHERE service_key = 'nextcloud') THEN
        INSERT INTO public.services (
            service_key,
            name,
            description,
            url,
            enabled,
            auto_provision,
            status,
            category,
            service_type,
            auth_type,
            requires_auth,
            ssl_enabled,
            supports_user_provisioning,
            default_user_role,
            account_id,
            created_by,
            updated_by
        ) VALUES (
            'nextcloud',
            'Nextcloud',
            'Personal cloud storage and collaboration platform',
            'http://localhost:8080',
            true,
            true,
            'offline',
            'storage',
            'nextcloud',
            'basic_auth',
            true,
            false,
            true,
            'users',
            admin_account_id,
            admin_user_id,
            admin_user_id
        );
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.services WHERE service_key = 'radarr') THEN
        INSERT INTO public.services (
            service_key,
            name,
            description,
            url,
            enabled,
            auto_provision,
            status,
            category,
            service_type,
            auth_type,
            requires_auth,
            ssl_enabled,
            supports_user_provisioning,
            default_user_role,
            account_id,
            created_by,
            updated_by
        ) VALUES (
            'radarr',
            'Radarr',
            'Movie collection manager',
            'http://localhost:7878',
            true,
            false,
            'offline',
            'management',
            'radarr',
            'api_key',
            true,
            false,
            false,
            null,
            admin_account_id,
            admin_user_id,
            admin_user_id
        );
    END IF;
END $$;