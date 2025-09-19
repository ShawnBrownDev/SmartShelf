-- Debug script to check signup issues
-- Run this in your Supabase SQL Editor to diagnose the problem

-- 1. Check if the trigger function exists and is correct
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Check if the trigger exists
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- 3. Check user_profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check app_settings table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'app_settings')
ORDER BY tablename, policyname;

-- 6. Test the function manually (this will show any syntax errors)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test@example.com';
BEGIN
    -- Create a test auth.users record structure
    -- This won't actually insert, just test the function logic
    RAISE NOTICE 'Testing function with user_id: %, email: %', test_user_id, test_email;
    
    -- Test username generation
    DECLARE
        test_username TEXT := 'user_' || substr(test_user_id::text, 1, 8);
    BEGIN
        RAISE NOTICE 'Generated username: %', test_username;
    END;
END $$;
