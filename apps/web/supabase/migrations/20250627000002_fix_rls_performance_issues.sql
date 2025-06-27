-- Fix RLS policies performance issues
-- Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
-- This addresses Supabase database linter warnings about auth_rls_initplan

/*
 * Services table RLS policies optimization
 * Fixes the performance issue where auth.uid() was being re-evaluated for each row
 */

-- Drop existing services policies
drop policy if exists "Users can view services from their accounts" on public.services;
drop policy if exists "Users can create services for their accounts" on public.services;
drop policy if exists "Users can update services for their accounts" on public.services;
drop policy if exists "Users can delete services for their accounts" on public.services;

-- Create optimized services policies with (select auth.uid()) to prevent re-evaluation
-- Users can only see services from their own accounts
create policy "Users can view services from their accounts" on public.services
    for select using (
        account_id = (select auth.uid())
    );

-- Users can create services for accounts they belong to
create policy "Users can create services for their accounts" on public.services
    for insert with check (
        account_id = (select auth.uid())
    );

-- Users can update services for accounts they belong to
create policy "Users can update services for their accounts" on public.services
    for update using (
        account_id = (select auth.uid())
    );

-- Users can delete services for accounts they belong to
create policy "Users can delete services for their accounts" on public.services
    for delete using (
        account_id = (select auth.uid())
    );

/*
 * Storage bucket RLS policy optimization
 * Fixes the performance issue for account_image bucket
 */

-- Drop existing storage policy
drop policy if exists "account_image" on storage.objects;

-- Create optimized storage policy with (select auth.uid()) to prevent re-evaluation
create policy "account_image" on storage.objects for all using (
    bucket_id = 'account_image'
        and (
        kit.get_storage_filename_as_uuid(name) = (select auth.uid())
        )
    )
    with
    check (
    bucket_id = 'account_image'
        and (
        kit.get_storage_filename_as_uuid(name) = (select auth.uid())
        )
    );
